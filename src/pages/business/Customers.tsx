import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCurrentBusiness } from '../../hooks/useCurrentBusiness';
import { hasBusinessPermission } from '../../lib/authz';
import type { Customer } from '../../types/domain';

interface CustomerFormState {
  id: string | null;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

const EMPTY_FORM: CustomerFormState = { id: null, full_name: '', phone: '', email: '', address: '', notes: '' };

export default function Customers() {
  const { memberships } = useAuth();
  const { business } = useCurrentBusiness();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CustomerFormState | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canManage = business ? hasBusinessPermission(memberships, business.id, 'customers.manage') : false;

  const load = useCallback(async () => {
    if (!business) return;
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false });
    setCustomers((data ?? []) as Customer[]);
    setLoading(false);
  }, [business]);

  useEffect(() => {
    load();
  }, [load]);

  if (!business) return null;

  const handleSave = async () => {
    if (!form || !form.full_name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      business_id: business.id,
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
    };

    const { error: saveError } = form.id
      ? await supabase.from('customers').update(payload).eq('id', form.id)
      : await supabase.from('customers').insert(payload);

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setForm(null);
    await load();
  };

  // `address` is ciphertext at rest (migration 20260914000016) — the
  // Customers table never renders it directly (see the table's columns
  // below: Name/Phone/Email/Status only), so it's decrypted on demand, one
  // row at a time, only when actually opening that row's edit form. Same
  // authorization-then-decrypt Edge Function pattern as invited_email.
  const handleEdit = async (customer: Customer) => {
    setForm({
      id: customer.id,
      full_name: customer.full_name,
      phone: customer.phone ?? '',
      email: customer.email ?? '',
      address: '',
      notes: customer.notes ?? '',
    });
    if (!customer.address) return;
    setLoadingAddress(true);
    const { data, error: fnError } = await supabase.functions.invoke<{ address: string | null }>(
      'decrypt-customer-address',
      { body: { customerId: customer.id } },
    );
    setLoadingAddress(false);
    if (fnError) {
      setError('Could not load the saved address.');
      return;
    }
    setForm((prev) => (prev && prev.id === customer.id ? { ...prev, address: data?.address ?? '' } : prev));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer? This cannot be undone.')) return;
    const { error: deleteError } = await supabase.from('customers').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await load();
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-semibold text-lg">Customers</h1>
          <p className="text-slate-500 text-sm">{business.name}</p>
        </div>
        {canManage && (
          <button
            onClick={() => setForm(EMPTY_FORM)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add customer
          </button>
        )}
      </div>

      {loading ? null : customers.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
          <Users className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No customers yet.</p>
          <p className="text-slate-500 text-sm mb-4">Add your first customer to get started.</p>
          {canManage && (
            <button
              onClick={() => setForm(EMPTY_FORM)}
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Add your first customer
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-slate-500 text-xs">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {canManage && <th className="px-4 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-slate-800/60 last:border-0">
                  <td className="px-4 py-3 text-white">{c.full_name}</td>
                  <td className="px-4 py-3 text-slate-400">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{c.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                      {c.status}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(c)}
                          className="text-slate-500 hover:text-slate-300 p-1"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-white font-semibold mb-4">{form.id ? 'Edit customer' : 'Add customer'}</h2>
            <div className="space-y-3">
              <input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Full name *"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder={loadingAddress ? 'Loading saved address…' : 'Address'}
                disabled={loadingAddress}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notes"
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => {
                  setForm(null);
                  setError(null);
                }}
                className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-300 text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
