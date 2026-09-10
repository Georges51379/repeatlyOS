import { useCallback, useEffect, useState } from 'react';
import { Plus, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCurrentBusiness } from '../../hooks/useCurrentBusiness';
import { hasBusinessPermission } from '../../lib/authz';
import type { Customer, CustomerMembership, MembershipPlanType } from '../../types/domain';

interface FormState {
  customer_id: string;
  plan_type: MembershipPlanType;
  plan_name: string;
  price: string;
  sessions_total: string;
}

const EMPTY_FORM: FormState = {
  customer_id: '',
  plan_type: 'package',
  plan_name: '',
  price: '',
  sessions_total: '',
};

export default function Memberships() {
  const { memberships: authMemberships } = useAuth();
  const { business } = useCurrentBusiness();
  const [items, setItems] = useState<CustomerMembership[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canManage = business ? hasBusinessPermission(authMemberships, business.id, 'finance.manage') : false;

  const load = useCallback(async () => {
    if (!business) return;
    const [{ data: itemRows }, { data: customerRows }] = await Promise.all([
      supabase
        .from('customer_memberships')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false }),
      supabase.from('customers').select('*').eq('business_id', business.id),
    ]);
    setItems((itemRows ?? []) as CustomerMembership[]);
    setCustomers((customerRows ?? []) as Customer[]);
    setLoading(false);
  }, [business]);

  useEffect(() => {
    load();
  }, [load]);

  if (!business) return null;

  const customerName = (id: string) => customers.find((c) => c.id === id)?.full_name ?? '—';

  const handleAdd = async () => {
    if (!form.customer_id || !form.plan_name.trim()) {
      setError('Customer and plan name are required.');
      return;
    }
    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from('customer_memberships').insert({
      business_id: business.id,
      customer_id: form.customer_id,
      plan_type: form.plan_type,
      plan_name: form.plan_name.trim(),
      price: form.price.trim() === '' ? null : Number(form.price),
      sessions_total: form.plan_type === 'package' && form.sessions_total.trim() !== '' ? Number(form.sessions_total) : null,
    });

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setShowAdd(false);
    setForm(EMPTY_FORM);
    await load();
  };

  const useSession = async (item: CustomerMembership) => {
    await supabase
      .from('customer_memberships')
      .update({ sessions_used: item.sessions_used + 1 })
      .eq('id', item.id);
    await load();
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-semibold text-lg">Packages &amp; Subscriptions</h1>
          <p className="text-slate-500 text-sm">{business.name}</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Sell a plan
          </button>
        )}
      </div>

      {loading ? null : items.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
          <Package className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No packages or subscriptions sold yet.</p>
          {canManage && <p className="text-slate-500 text-sm">Sell your first plan to a customer.</p>}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-slate-500 text-xs">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Sessions</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {canManage && <th className="px-4 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-b border-slate-800/60 last:border-0">
                  <td className="px-4 py-3 text-white">{customerName(i.customer_id)}</td>
                  <td className="px-4 py-3 text-slate-400">{i.plan_name}</td>
                  <td className="px-4 py-3 text-slate-400 capitalize">{i.plan_type}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {i.sessions_total != null ? `${i.sessions_used} / ${i.sessions_total}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        i.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700/40 text-slate-400'
                      }`}
                    >
                      {i.status}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      {i.plan_type === 'package' &&
                        i.sessions_total != null &&
                        i.sessions_used < i.sessions_total &&
                        i.status === 'active' && (
                          <button
                            onClick={() => useSession(i)}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            Use session
                          </button>
                        )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-white font-semibold mb-4">Sell a plan</h2>
            <div className="space-y-3">
              <select
                value={form.customer_id}
                onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select customer *</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
              <select
                value={form.plan_type}
                onChange={(e) => setForm({ ...form, plan_type: e.target.value as MembershipPlanType })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="package">Package (fixed sessions)</option>
                <option value="subscription">Subscription (recurring)</option>
              </select>
              <input
                value={form.plan_name}
                onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
                placeholder="Plan name * (e.g. 8 Washes / Month)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="Price"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              {form.plan_type === 'package' && (
                <input
                  type="number"
                  value={form.sessions_total}
                  onChange={(e) => setForm({ ...form, sessions_total: e.target.value })}
                  placeholder="Total sessions"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              )}
            </div>

            {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => {
                  setShowAdd(false);
                  setError(null);
                }}
                className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-300 text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                {saving ? 'Saving…' : 'Sell plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
