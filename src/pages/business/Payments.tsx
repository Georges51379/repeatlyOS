import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Lock, Receipt, DollarSign, Clock3, Hash } from 'lucide-react';
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
import type { Customer, Payment, PaymentMethod } from '../../types/domain';

const METHODS: PaymentMethod[] = ['cash', 'whish', 'omt', 'bank_transfer', 'pay_at_store'];
const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Cash',
  whish: 'Whish',
  omt: 'OMT',
  bank_transfer: 'Bank Transfer',
  pay_at_store: 'Pay at Store',
};

interface FormState {
  customer_id: string;
  amount: string;
  method: PaymentMethod;
  reference: string;
  notes: string;
}

const EMPTY_FORM: FormState = { customer_id: '', amount: '', method: 'cash', reference: '', notes: '' };

export default function Payments() {
  const { memberships } = useAuth();
  const { business } = useCurrentBusiness();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const canView = business ? hasBusinessPermission(memberships, business.id, 'finance.view') : false;
  const canManage = business ? hasBusinessPermission(memberships, business.id, 'finance.manage') : false;

  const load = useCallback(async () => {
    if (!business) return;
    const [{ data: paymentRows }, { data: customerRows }] = await Promise.all([
      supabase.from('payments').select('*').eq('business_id', business.id).order('paid_at', { ascending: false }),
      supabase.from('customers').select('*').eq('business_id', business.id),
    ]);
    setPayments((paymentRows ?? []) as Payment[]);
    setCustomers((customerRows ?? []) as Customer[]);
    setLoading(false);
  }, [business]);

  useEffect(() => {
    load();
  }, [load]);

  const customerName = useCallback((id: string | null) => customers.find((c) => c.id === id)?.full_name ?? '—', [customers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter(
      (p) => customerName(p.customer_id).toLowerCase().includes(q) || METHOD_LABEL[p.method].toLowerCase().includes(q),
    );
  }, [payments, search, customerName]);

  const stats = useMemo(() => {
    const paid = payments.filter((p) => p.status === 'paid');
    const total = paid.reduce((sum, p) => sum + Number(p.amount), 0);
    const pending = payments.filter((p) => p.status === 'pending').length;
    return { total, pending, count: payments.length };
  }, [payments]);

  if (!business) return null;

  if (!canView) {
    return (
      <div className="max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
        <Lock className="w-8 h-8 text-slate-700 mx-auto mb-3" />
        <p className="text-white font-medium mb-1">No access to Finance</p>
        <p className="text-slate-500 text-sm">Ask the business owner to grant you the finance.view permission.</p>
      </div>
    );
  }

  const handleAdd = async () => {
    const amountNum = Number(form.amount);
    if (!form.amount || Number.isNaN(amountNum) || amountNum <= 0) {
      setError('A valid amount is required.');
      return;
    }
    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from('payments').insert({
      business_id: business.id,
      customer_id: form.customer_id || null,
      amount: amountNum,
      method: form.method,
      reference: form.reference.trim() || null,
      notes: form.notes.trim() || null,
    });

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setShowAdd(false);
    setForm(EMPTY_FORM);
    setToast({ message: 'Payment recorded.', type: 'success' });
    await load();
  };

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Payments"
        subtitle={business.name}
        actionLabel={canManage ? 'Record payment' : undefined}
        actionIcon={Plus}
        onAction={() => setShowAdd(true)}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <StatCard title="Total collected" value={`$${stats.total.toFixed(2)}`} icon={DollarSign} accent="emerald" />
        <StatCard title="Pending" value={stats.pending} icon={Clock3} accent="amber" />
        <StatCard title="Transactions" value={stats.count} icon={Hash} accent="blue" />
      </div>

      {payments.length > 0 && (
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by customer or method…" className="max-w-sm" />
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-slate-500 text-xs">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={4} cols={5} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  {payments.length === 0 ? (
                    <EmptyState type="payments" onCreate={canManage ? () => setShowAdd(true) : undefined} />
                  ) : (
                    <EmptyState type="generic" search={search} onClear={() => setSearch('')} />
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b border-slate-800/60 last:border-0 tr-hover">
                  <td className="px-4 py-3 text-slate-400">{p.paid_at.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-white">{customerName(p.customer_id)}</td>
                  <td className="px-4 py-3 text-white">${Number(p.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-400">{METHOD_LABEL[p.method]}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="Record payment" onClose={() => { setShowAdd(false); setError(null); }} size="sm" icon={<Receipt className="w-4 h-4 text-blue-400" />}>
          <div className="space-y-4">
            <FormField label="Customer" helper="Optional — link it to someone in your customer list.">
              <select
                value={form.customer_id}
                onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                className={fieldInputClass}
              >
                <option value="">No customer linked</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Amount (USD)" required>
              <input
                type="number"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                className={fieldInputClass}
              />
            </FormField>
            <FormField label="Payment method" required>
              <select
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value as PaymentMethod })}
                className={fieldInputClass}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {METHOD_LABEL[m]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Reference" helper="Optional — a receipt number or transaction ID.">
              <input
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="e.g. #4021"
                className={fieldInputClass}
              />
            </FormField>
            <FormField label="Notes" helper="Only visible to your team.">
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional"
                rows={2}
                className={fieldInputClass}
              />
            </FormField>
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
              {saving ? 'Saving…' : 'Record'}
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
