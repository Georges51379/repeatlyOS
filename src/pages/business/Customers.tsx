import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, Users, UserPlus, Phone, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCurrentBusiness } from '../../hooks/useCurrentBusiness';
import { hasBusinessPermission } from '../../lib/authz';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import EmptyState from '../../components/EmptyState';
import { SkeletonTable } from '../../components/Skeletons';
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

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

export default function Customers() {
  const { memberships } = useAuth();
  const { business } = useCurrentBusiness();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<CustomerFormState | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) => c.full_name.toLowerCase().includes(q) || (c.phone ?? '').includes(q) || (c.email ?? '').toLowerCase().includes(q),
    );
  }, [customers, search]);

  const stats = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const newThisMonth = customers.filter((c) => new Date(c.created_at).getTime() >= thirtyDaysAgo).length;
    const withPhone = customers.filter((c) => c.phone).length;
    return { total: customers.length, newThisMonth, withPhone };
  }, [customers]);

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

    const isNew = !form.id;
    const { error: saveError } = form.id
      ? await supabase.from('customers').update(payload).eq('id', form.id)
      : await supabase.from('customers').insert(payload);

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setForm(null);
    setToast({ message: isNew ? 'Customer added.' : 'Customer updated.', type: 'success' });
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
    const { error: deleteError } = await supabase.from('customers').delete().eq('id', id);
    setConfirmDeleteId(null);
    if (deleteError) {
      setToast({ message: deleteError.message, type: 'error' });
      return;
    }
    setToast({ message: 'Customer deleted.', type: 'success' });
    await load();
  };

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Customers"
        subtitle={business.name}
        actionLabel={canManage ? 'Add customer' : undefined}
        actionIcon={Plus}
        onAction={() => setForm(EMPTY_FORM)}
      />

      {customers.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <StatCard title="Total customers" value={stats.total} icon={Users} accent="blue" />
          <StatCard title="New (30 days)" value={stats.newThisMonth} icon={UserPlus} accent="emerald" />
          <StatCard title="With phone number" value={stats.withPhone} icon={Phone} accent="purple" />
        </div>
      )}

      {customers.length > 0 && (
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, phone, or email…" className="max-w-sm" />
        </div>
      )}

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
            {loading ? (
              <SkeletonTable rows={4} cols={canManage ? 5 : 4} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 5 : 4}>
                  {customers.length === 0 ? (
                    <EmptyState type="customers" onCreate={canManage ? () => setForm(EMPTY_FORM) : undefined} />
                  ) : (
                    <EmptyState type="generic" search={search} onClear={() => setSearch('')} />
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="border-b border-slate-800/60 last:border-0 tr-hover">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-500/15 text-blue-400 text-xs font-semibold flex items-center justify-center shrink-0">
                        {initials(c.full_name) || '?'}
                      </div>
                      <span className="text-white">{c.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {c.phone ? (
                      <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-600" />{c.phone}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {c.email ? (
                      <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-600" />{c.email}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(c)} className="text-slate-500 hover:text-slate-300 p-1 focus-ring rounded">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setConfirmDeleteId(c.id)} className="text-slate-500 hover:text-red-400 p-1 focus-ring rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal title={form.id ? 'Edit customer' : 'Add customer'} onClose={() => { setForm(null); setError(null); }} size="sm" icon={<Users className="w-4 h-4 text-blue-400" />}>
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
              onClick={() => { setForm(null); setError(null); }}
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
        </Modal>
      )}

      {confirmDeleteId && (
        <Modal title="Delete customer" onClose={() => setConfirmDeleteId(null)} size="sm">
          <p className="text-slate-400 text-sm mb-4">This cannot be undone.</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDeleteId(null)} className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-300 text-sm font-semibold py-2.5 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
              Delete
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
