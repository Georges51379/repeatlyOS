import { useState } from 'react';
import { DollarSign, Plus, Check, CreditCard, AlertCircle } from 'lucide-react';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import StatCard from '../../components/StatCard';
import { useDemo } from '../../context/DemoContext';
import type { PartialPayment } from '../../context/DemoContext';

export default function PartialPaymentsPage() {
  const { business, partialPayments, setPartialPayments, exchangeRate, vatRate, currency } = useDemo();
  const [toast, setToast] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ customerName: '', totalAmount: '', installments: 2, note: '' });

  const fmt = (usd: number) => {
    if (currency === 'LBP') return `LL ${(usd * exchangeRate).toLocaleString()}`;
    if (currency === 'BOTH') return `$${usd} / LL ${(usd * exchangeRate).toLocaleString()}`;
    return `$${usd}`;
  };

  const totalOwed    = partialPayments.reduce((a, p) => a + p.installments.filter(i => !i.paid).reduce((b, i) => b + i.amount, 0), 0);
  const totalPaid    = partialPayments.reduce((a, p) => a + p.installments.filter(i => i.paid).reduce((b, i) => b + i.amount, 0), 0);
  const overdue      = partialPayments.filter(p => p.installments.some(i => !i.paid && i.dueDate < '2024-06-11')).length;

  const markPaid = (planId: number, instId: number) => {
    setPartialPayments(partialPayments.map(p => p.id !== planId ? p : {
      ...p, installments: p.installments.map(i => i.id !== instId ? i : { ...i, paid: true, paidDate: '2024-06-11', method: 'Cash' })
    }));
    setToast('Installment marked as paid.');
  };

  const createPlan = () => {
    if (!form.customerName || !form.totalAmount) { setToast('Customer and amount required.'); return; }
    const total = Number(form.totalAmount);
    const amount = Math.round(total / form.installments);
    const installments = Array.from({ length: form.installments }, (_, i) => {
      const due = new Date('2024-06-11'); due.setMonth(due.getMonth() + i);
      return { id: i + 1, amount: i === form.installments - 1 ? total - amount * (form.installments - 1) : amount, dueDate: due.toISOString().slice(0, 10), paid: i === 0 };
    });
    const newPlan: PartialPayment = { id: partialPayments.length + 1, customerId: Date.now(), customerName: form.customerName, totalAmount: total, installments, note: form.note, createdAt: '2024-06-11' };
    setPartialPayments([...partialPayments, newPlan]);
    setShowAdd(false);
    setForm({ customerName: '', totalAmount: '', installments: 2, note: '' });
    setToast(`Payment plan created for ${form.customerName}.`);
  };

  const withVAT = (amt: number) => vatRate > 0 ? amt * (1 + vatRate / 100) : amt;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2"><CreditCard size={18} className="text-blue-400"/> Partial Payments & Plans</h2>
          <p className="text-slate-500 text-sm">Split payments into installments — track each one separately</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
          <Plus size={14}/> New Payment Plan
        </button>
      </div>

      {/* Currency & VAT info */}
      {(currency !== 'USD' || vatRate > 0) && (
        <div className="flex flex-wrap gap-2">
          {currency !== 'USD' && <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5 text-xs text-blue-400"><DollarSign size={11}/> Rate: 1 USD = LL {exchangeRate.toLocaleString()}</div>}
          {vatRate > 0 && <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-1.5 text-xs text-purple-400"><AlertCircle size={11}/> VAT {vatRate}% applied</div>}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Active Plans"  value={partialPayments.length} icon={CreditCard}   accent="blue"   />
        <StatCard title="Total Paid"    value={fmt(totalPaid)}         icon={Check}         accent="emerald"/>
        <StatCard title="Outstanding"   value={fmt(totalOwed)}         icon={DollarSign}    accent="amber"  />
        <StatCard title="Overdue Plans" value={overdue}                icon={AlertCircle}   accent="red"    />
      </div>

      <div className="space-y-4">
        {partialPayments.map(plan => {
          const paidCount = plan.installments.filter(i => i.paid).length;
          const totalCount = plan.installments.length;
          const pct = Math.round((paidCount / totalCount) * 100);
          const isComplete = paidCount === totalCount;
          const hasOverdue = plan.installments.some(i => !i.paid && i.dueDate < '2024-06-11');
          return (
            <div key={plan.id} className={`bg-slate-900 border rounded-2xl overflow-hidden ${hasOverdue ? 'border-red-500/25' : isComplete ? 'border-emerald-500/20' : 'border-slate-800'}`}>
              <div className="px-5 py-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold">{plan.customerName[0]}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold">{plan.customerName}</p>
                      {isComplete && <span className="text-xs bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 px-2 py-0.5 rounded-full">✓ Complete</span>}
                      {hasOverdue && <span className="text-xs bg-red-500/15 border border-red-500/25 text-red-400 px-2 py-0.5 rounded-full">⚠ Overdue</span>}
                    </div>
                    <p className="text-slate-500 text-xs">{plan.note} · Created {plan.createdAt}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white font-black text-lg">{fmt(plan.totalAmount)}</p>
                  {vatRate > 0 && <p className="text-slate-500 text-xs">+{vatRate}% VAT = {fmt(Math.round(withVAT(plan.totalAmount)))}</p>}
                </div>
              </div>
              <div className="px-5 pb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500">{paidCount} of {totalCount} installments paid</span>
                  <span className="text-slate-400 font-semibold">{pct}%</span>
                </div>
                <div className="bg-slate-800 rounded-full h-2 mb-4">
                  <div className={`h-2 rounded-full transition-all ${isComplete ? 'bg-emerald-500' : hasOverdue ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {plan.installments.map(inst => {
                    const isOverdue = !inst.paid && inst.dueDate < '2024-06-11';
                    return (
                      <div key={inst.id} className={`flex items-center justify-between rounded-xl px-3 py-2.5 border ${inst.paid ? 'bg-emerald-500/8 border-emerald-500/20' : isOverdue ? 'bg-red-500/8 border-red-500/20' : 'bg-slate-800 border-slate-700'}`}>
                        <div>
                          <p className="text-xs font-semibold text-slate-200">Installment {inst.id}</p>
                          <p className="text-xs text-slate-500">Due: {inst.dueDate}{inst.paidDate ? ` · Paid: ${inst.paidDate}` : ''}{inst.method ? ` via ${inst.method}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${inst.paid ? 'text-emerald-400' : isOverdue ? 'text-red-400' : 'text-slate-300'}`}>{fmt(inst.amount)}</span>
                          {!inst.paid ? (
                            <button onClick={() => markPaid(plan.id, inst.id)} className="flex items-center gap-1 text-xs bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 px-2 py-1 rounded-lg transition-colors">
                              <Check size={11}/> Pay
                            </button>
                          ) : (
                            <Check size={14} className="text-emerald-400"/>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="px-5 pb-4 mt-2">
                <div className="flex items-center justify-between text-xs bg-slate-800 rounded-xl px-3 py-2">
                  <span className="text-slate-500">Remaining balance</span>
                  <span className={`font-black ${isComplete ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {fmt(plan.installments.filter(i => !i.paid).reduce((a, i) => a + i.amount, 0))}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {partialPayments.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl py-14 text-center">
            <CreditCard size={32} className="text-slate-700 mx-auto mb-3"/>
            <p className="text-slate-500 text-sm">No payment plans yet</p>
            <button onClick={() => setShowAdd(true)} className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">Create first plan →</button>
          </div>
        )}
      </div>

      {showAdd && (
        <Modal title="New Payment Plan" onClose={() => setShowAdd(false)} icon={<CreditCard size={15} className="text-blue-400"/>}>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Customer *</label>
              <select value={form.customerName} onChange={e => setForm(f=>({...f, customerName: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                <option value="">Select...</option>
                {business.customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Total Amount ($) *</label>
                <input type="number" value={form.totalAmount} onChange={e => setForm(f=>({...f, totalAmount: e.target.value}))} placeholder="e.g. 300" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"/>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Number of Installments</label>
                <select value={form.installments} onChange={e => setForm(f=>({...f, installments: Number(e.target.value)}))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                  {[2,3,4,6].map(n => <option key={n} value={n}>{n} payments</option>)}
                </select>
              </div>
            </div>
            {form.totalAmount && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300">
                💡 {form.installments} installments of ~${Math.round(Number(form.totalAmount)/form.installments)} each, paid monthly starting today.
              </div>
            )}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Note (optional)</label>
              <input value={form.note} onChange={e => setForm(f=>({...f, note: e.target.value}))} placeholder="e.g. Annual package, 3-month plan" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"/>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={createPlan} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">Create Plan</button>
            </div>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast} onClose={() => setToast('')}/>}
    </div>
  );
}
