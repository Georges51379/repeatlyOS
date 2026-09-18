import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Package, Ticket, RefreshCw, CheckCircle2 } from 'lucide-react';
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
import FormField, { fieldInputClass } from '../../components/FormField';
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
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

  const customerName = useCallback((id: string) => customers.find((c) => c.id === id)?.full_name ?? '—', [customers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => customerName(i.customer_id).toLowerCase().includes(q) || i.plan_name.toLowerCase().includes(q));
  }, [items, search, customerName]);

  const stats = useMemo(() => {
    const active = items.filter((i) => i.status === 'active').length;
    const packages = items.filter((i) => i.plan_type === 'package').length;
    const subscriptions = items.filter((i) => i.plan_type === 'subscription').length;
    return { total: items.length, active, packages, subscriptions };
  }, [items]);

  if (!business) return null;

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
    setToast({ message: 'Plan sold.', type: 'success' });
    await load();
  };

  const useSession = async (item: CustomerMembership) => {
    const { error: updateError } = await supabase
      .from('customer_memberships')
      .update({ sessions_used: item.sessions_used + 1 })
      .eq('id', item.id);
    if (updateError) {
      setToast({ message: updateError.message, type: 'error' });
      return;
    }
    await load();
  };

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Packages & Subscriptions"
        subtitle={business.name}
        actionLabel={canManage ? 'Sell a plan' : undefined}
        actionIcon={Plus}
        onAction={() => setShowAdd(true)}
      />

      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard title="Total sold" value={stats.total} icon={Package} accent="blue" />
          <StatCard title="Active" value={stats.active} icon={CheckCircle2} accent="emerald" />
          <StatCard title="Packages" value={stats.packages} icon={Ticket} accent="purple" />
          <StatCard title="Subscriptions" value={stats.subscriptions} icon={RefreshCw} accent="amber" />
        </div>
      )}

      {items.length > 0 && (
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by customer or plan…" className="max-w-sm" />
        </div>
      )}

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
            {loading ? (
              <SkeletonTable rows={3} cols={canManage ? 6 : 5} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 6 : 5}>
                  {items.length === 0 ? (
                    <EmptyState type="memberships" onCreate={canManage ? () => setShowAdd(true) : undefined} />
                  ) : (
                    <EmptyState type="generic" search={search} onClear={() => setSearch('')} />
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((i) => (
                <tr key={i.id} className="border-b border-slate-800/60 last:border-0 tr-hover">
                  <td className="px-4 py-3 text-white">{customerName(i.customer_id)}</td>
                  <td className="px-4 py-3 text-slate-400">{i.plan_name}</td>
                  <td className="px-4 py-3 text-slate-400 capitalize">{i.plan_type}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {i.sessions_total != null ? (
                      <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap">{i.sessions_used} / {i.sessions_total}</span>
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${Math.min(100, (i.sessions_used / i.sessions_total) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={i.status} />
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      {i.plan_type === 'package' &&
                        i.sessions_total != null &&
                        i.sessions_used < i.sessions_total &&
                        i.status === 'active' && (
                          <button onClick={() => useSession(i)} className="text-xs text-blue-400 hover:text-blue-300">
                            Use session
                          </button>
                        )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="Sell a plan" onClose={() => { setShowAdd(false); setError(null); }} size="sm" icon={<Package className="w-4 h-4 text-blue-400" />}>
          <div className="space-y-4">
            <FormField label="Customer" required>
              <select
                value={form.customer_id}
                onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                className={fieldInputClass}
              >
                <option value="">Select a customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Plan type" required>
              <select
                value={form.plan_type}
                onChange={(e) => setForm({ ...form, plan_type: e.target.value as MembershipPlanType })}
                className={fieldInputClass}
              >
                <option value="package">Package (fixed sessions)</option>
                <option value="subscription">Subscription (recurring)</option>
              </select>
            </FormField>
            <FormField label="Plan name" required>
              <input
                value={form.plan_name}
                onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
                placeholder="e.g. 8 Washes / Month"
                className={fieldInputClass}
              />
            </FormField>
            <FormField label="Price (USD)" helper="Optional.">
              <input
                type="number"
                inputMode="decimal"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
                className={fieldInputClass}
              />
            </FormField>
            {form.plan_type === 'package' && (
              <FormField label="Total sessions" helper="How many uses this package includes.">
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.sessions_total}
                  onChange={(e) => setForm({ ...form, sessions_total: e.target.value })}
                  placeholder="e.g. 8"
                  className={fieldInputClass}
                />
              </FormField>
            )}
          </div>

          {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

          <div className="flex gap-2 mt-5">
            <button
              onClick={() => { setShowAdd(false); setError(null); }}
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
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
