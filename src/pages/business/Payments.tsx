import { useCallback, useEffect, useState } from 'react';
import { Plus, Lock, Receipt } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCurrentBusiness } from '../../hooks/useCurrentBusiness';
import { hasBusinessPermission } from '../../lib/authz';
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
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  const customerName = (id: string | null) => customers.find((c) => c.id === id)?.full_name ?? '—';

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
    await load();
  };

  const total = payments.reduce((sum, p) => (p.status === 'paid' ? sum + Number(p.amount) : sum), 0);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-semibold text-lg">Payments</h1>
          <p className="text-slate-500 text-sm">{business.name}</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Record payment
          </button>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <p className="text-slate-500 text-xs mb-1">Total collected (paid)</p>
        <p className="text-white text-2xl font-semibold">${total.toFixed(2)}</p>
      </div>

      {loading ? null : payments.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
          <Receipt className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No payments yet.</p>
          {canManage && <p className="text-slate-500 text-sm">Record your first payment.</p>}
        </div>
      ) : (
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
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-slate-800/60 last:border-0">
                  <td className="px-4 py-3 text-slate-400">{p.paid_at.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-white">{customerName(p.customer_id)}</td>
                  <td className="px-4 py-3 text-white">${Number(p.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-400">{METHOD_LABEL[p.method]}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        p.status === 'paid'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : p.status === 'refunded'
                            ? 'bg-red-500/15 text-red-400'
                            : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-white font-semibold mb-4">Record payment</h2>
            <div className="space-y-3">
              <select
                value={form.customer_id}
                onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">No customer linked</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Amount *"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <select
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value as PaymentMethod })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {METHOD_LABEL[m]}
                  </option>
                ))}
              </select>
              <input
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="Reference (optional)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
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
                {saving ? 'Saving…' : 'Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
