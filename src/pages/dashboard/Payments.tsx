import { useState, useMemo } from 'react';
import { DollarSign, Clock, AlertCircle, XCircle, Upload, Check, Download, Search, Filter, CreditCard, Plus } from 'lucide-react';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import EmptyState from '../../components/EmptyState';
import { useDemo } from '../../context/DemoContext';

const METHOD_COLORS: Record<string, string> = {
  'Whish': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'Cash': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'Bank Transfer': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'OMT': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'Card Later': 'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

const METHODS = ['Cash', 'Whish', 'OMT', 'Bank Transfer', 'Card Later'];
const STATUS_FILTERS = ['All', 'Paid', 'Pending', 'Partial', 'Overdue'];

export default function PaymentsPage() {
  const { business } = useDemo();
  const [payments, setPayments] = useState(business.payments);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [receiptModal, setReceiptModal] = useState<typeof business.payments[0] | null>(null);
  const [form, setForm] = useState({ customer: '', amount: '', method: 'Cash', notes: '' });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showMethodFilter, setShowMethodFilter] = useState(false);

  const filtered = useMemo(() => payments.filter(p => {
    const ms = search === '' || p.customer.toLowerCase().includes(search.toLowerCase()) || p.ref.toLowerCase().includes(search.toLowerCase());
    const mf = filter === 'All' || p.status === filter;
    const mm = methodFilter === 'All' || p.method === methodFilter;
    return ms && mf && mm;
  }), [payments, search, filter, methodFilter]);

  const paid = payments.filter(p => p.status === 'Paid').reduce((a, p) => a + p.amount, 0);
  const pending = payments.filter(p => p.status === 'Pending').length;
  const partial = payments.filter(p => p.status === 'Partial').length;
  const overdue = payments.filter(p => p.status === 'Overdue').length;
  const overdueTotal = payments.filter(p => p.status === 'Overdue').reduce((a, p) => a + p.amount, 0);

  const markPaid = (id: number) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'Paid', proof: true } : p));
    setToast('Payment marked as paid.');
  };

  const bulkMarkPaid = () => {
    setPayments(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, status: 'Paid', proof: true } : p));
    setToast(`${selectedIds.length} payments marked as paid.`);
    setSelectedIds([]);
  };

  const recordPayment = () => {
    if (!form.customer || !form.amount) { setToast('Customer and amount are required.'); return; }
    const np = { id: payments.length + 1, customer: form.customer, ref: `PAY-${Date.now().toString().slice(-4)}`, amount: Number(form.amount), method: form.method, status: 'Paid', date: '2024-06-11', proof: false };
    setPayments([np, ...payments]);
    setShowRecordModal(false);
    setForm({ customer: '', amount: '', method: 'Cash', notes: '' });
    setToast(`Payment of $${form.amount} recorded for ${form.customer}.`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg">Payments</h2>
          <p className="text-slate-500 text-sm">Lebanon-ready — Cash · Whish · OMT · Bank Transfer</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button onClick={bulkMarkPaid} className="flex items-center gap-1.5 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 px-3 py-2 rounded-lg transition-colors">
              <Check size={12} /> Mark {selectedIds.length} Paid
            </button>
          )}
          <button onClick={() => setToast('Export generated. Demo only.')} className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 px-3 py-2 rounded-lg transition-colors">
            <Download size={12} /> Export
          </button>
          <button onClick={() => setShowRecordModal(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
            <Plus size={14} /> Record Payment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Collected" value={`$${paid.toLocaleString()}`} icon={DollarSign} accent="emerald" trend="This month" trendUp />
        <StatCard title="Pending" value={pending} icon={Clock} accent="amber" />
        <StatCard title="Partial" value={partial} icon={AlertCircle} accent="purple" />
        <StatCard title="Overdue" value={overdue} icon={XCircle} accent="red" trend={overdue > 0 ? `-$${overdueTotal}` : undefined} />
      </div>

      {overdue > 0 && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <XCircle size={16} className="text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="text-red-400 font-semibold text-sm">${overdueTotal} in overdue payments</p>
            <p className="text-slate-500 text-xs mt-0.5">{overdue} customer{overdue > 1 ? 's' : ''} need payment follow-up</p>
          </div>
          <button onClick={() => setFilter('Overdue')} className="text-xs text-red-400 bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 px-3 py-1.5 rounded-lg transition-colors shrink-0">View all</button>
        </div>
      )}

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer or reference..." className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {STATUS_FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'}`}>{f}</button>
          ))}
          <div className="relative">
            <button onClick={() => setShowMethodFilter(v => !v)} className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${methodFilter !== 'All' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
              <Filter size={10} /> {methodFilter === 'All' ? 'Method' : methodFilter}
            </button>
            {showMethodFilter && (
              <div className="absolute top-full mt-1 right-0 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-10 overflow-hidden min-w-[140px]">
                {['All', ...METHODS].map(m => (
                  <button key={m} onClick={() => { setMethodFilter(m); setShowMethodFilter(false); }} className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-slate-800 ${methodFilter === m ? 'text-blue-400' : 'text-slate-300'}`}>{m}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <p className="text-white font-semibold text-sm">Payment Ledger</p>
          <p className="text-slate-500 text-xs">{filtered.length} entries</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="px-4 py-3 w-8">
                  <input type="checkbox" onChange={e => setSelectedIds(e.target.checked ? filtered.map(p => p.id) : [])} checked={selectedIds.length === filtered.length && filtered.length > 0} className="rounded border-slate-600 bg-slate-800 text-blue-600" />
                </th>
                {['Customer','Reference','Amount','Method','Status','Date','Proof','Actions'].map(h => (
                  <th key={h} className="text-left text-slate-500 text-xs font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className={`border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors ${selectedIds.includes(p.id) ? 'bg-blue-600/5' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => setSelectedIds(s => s.includes(p.id) ? s.filter(x => x !== p.id) : [...s, p.id])} className="rounded border-slate-600 bg-slate-800 text-blue-600" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setReceiptModal(p)}>
                      <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">{p.customer[0]}</div>
                      <span className="text-slate-200 text-sm font-medium hover:text-blue-400 transition-colors">{p.customer}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs font-mono">{p.ref}</td>
                  <td className="px-4 py-3 text-slate-200 font-bold text-sm">${p.amount}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${METHOD_COLORS[p.method] || 'text-slate-400'}`}>{p.method}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{p.date}</td>
                  <td className="px-4 py-3">
                    {p.proof ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs"><Check size={11} /> Uploaded</span>
                    ) : (
                      <button onClick={() => setToast('Upload proof — demo only.')} className="flex items-center gap-1 text-slate-500 hover:text-blue-400 text-xs transition-colors hover:bg-blue-500/10 px-2 py-1 rounded-lg">
                        <Upload size={11} /> Upload
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.status !== 'Paid' ? (
                      <button onClick={() => markPaid(p.id)} className="flex items-center gap-1 text-xs bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-lg transition-colors font-medium">
                        <Check size={11} /> Mark Paid
                      </button>
                    ) : (
                      <button onClick={() => setReceiptModal(p)} className="text-xs text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 px-2.5 py-1 rounded-lg transition-colors">Receipt</button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9}>
                  <EmptyState type="payments" search={search} onClear={() => { setSearch(''); setFilter('All'); setMethodFilter('All'); }} onCreate={() => setShowRecordModal(true)} createLabel="Record Payment" />
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-2.5 border-t border-slate-800 flex items-center justify-between">
          <p className="text-slate-600 text-xs">{filtered.length} of {payments.length} payments</p>
          {selectedIds.length > 0 && <p className="text-blue-400 text-xs font-medium">{selectedIds.length} selected</p>}
        </div>
      </div>

      {/* Record Payment Modal */}
      {showRecordModal && (
        <Modal title="Record Payment" onClose={() => setShowRecordModal(false)} icon={<DollarSign size={15} className="text-emerald-400" />}>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Customer *</label>
              <select value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                <option value="">Select customer...</option>
                {business.customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Amount ($) *</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Method</label>
                <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                  {METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Notes (optional)</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. June subscription, WhatsApp transfer" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowRecordModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={recordPayment} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">Record Payment</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Receipt Modal */}
      {receiptModal && (
        <Modal title="Payment Receipt" onClose={() => setReceiptModal(null)} size="sm" icon={<CreditCard size={15} className="text-emerald-400" />}>
          <div className="space-y-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 text-center">
              <Check size={24} className="text-emerald-400 mx-auto mb-2 animate-check-pop" />
              <p className="text-white font-bold text-lg">${receiptModal.amount}</p>
              <p className="text-emerald-400 text-sm font-medium">Paid via {receiptModal.method}</p>
            </div>
            {[['Customer', receiptModal.customer], ['Reference', receiptModal.ref], ['Date', receiptModal.date], ['Status', receiptModal.status]].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center bg-slate-800 rounded-lg px-3 py-2.5">
                <span className="text-slate-500 text-xs">{k}</span>
                <span className="text-slate-200 text-xs font-medium">{v}</span>
              </div>
            ))}
            <button onClick={() => { setToast('Receipt printed. Demo only.'); setReceiptModal(null); }} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">Print Receipt</button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
