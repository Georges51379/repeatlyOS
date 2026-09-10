import { useState, useMemo } from 'react';
import { AlertTriangle, X, Plus, UserX, Check } from 'lucide-react';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import StatCard from '../../components/StatCard';
import { useDemo } from '../../context/DemoContext';
import type { NoShowRecord } from '../../context/DemoContext';

export default function NoShowPage() {
  const { business, noShows, setNoShows } = useDemo();
  const [toast, setToast] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ customerName: '', service: '', date: '2024-06-11', type: 'no_show' as NoShowRecord['type'] });

  const byCustomer = useMemo(() => {
    const map: Record<string, { name: string; count: number; lateCancel: number; lastDate: string; records: NoShowRecord[] }> = {};
    noShows.forEach(r => {
      if (!map[r.customerName]) map[r.customerName] = { name: r.customerName, count: 0, lateCancel: 0, lastDate: '', records: [] };
      if (r.type === 'no_show') map[r.customerName].count++;
      else map[r.customerName].lateCancel++;
      if (r.date > map[r.customerName].lastDate) map[r.customerName].lastDate = r.date;
      map[r.customerName].records.push(r);
    });
    return Object.values(map).sort((a, b) => (b.count + b.lateCancel) - (a.count + a.lateCancel));
  }, [noShows]);

  const flagged   = byCustomer.filter(c => c.count >= 2 || (c.count + c.lateCancel) >= 3);
  const totalLoss = noShows.length * (business.services[0]?.price || 0);

  const addRecord = () => {
    if (!form.customerName || !form.service) { setToast('Customer and service required.'); return; }
    setNoShows([...noShows, { ...form, customerId: Date.now() }]);
    setShowAdd(false);
    setForm({ customerName: '', service: '', date: '2024-06-11', type: 'no_show' });
    setToast('No-show recorded.');
  };

  const removeRecord = (name: string, date: string) => {
    setNoShows(noShows.filter(r => !(r.customerName === name && r.date === date)));
    setToast('Record removed.');
  };

  const getRiskLevel = (c: typeof byCustomer[0]) => {
    const total = c.count + c.lateCancel;
    if (c.count >= 3 || total >= 4) return { label: 'High Risk', cls: 'text-red-400 bg-red-500/10 border-red-500/25' };
    if (c.count >= 2 || total >= 3) return { label: 'Watch',     cls: 'text-amber-400 bg-amber-500/10 border-amber-500/25' };
    return { label: 'Low',          cls: 'text-slate-500 bg-slate-800 border-slate-700' };
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2"><UserX size={18} className="text-red-400" /> No-Show Tracker</h2>
          <p className="text-slate-500 text-sm">Track cancellations & no-shows — flag repeat offenders · {business.name}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
          <Plus size={14} /> Log No-Show
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total No-Shows"    value={noShows.filter(r=>r.type==='no_show').length}    icon={UserX}        accent="red"    />
        <StatCard title="Late Cancellations" value={noShows.filter(r=>r.type==='late_cancel').length} icon={AlertTriangle} accent="amber" />
        <StatCard title="Flagged Customers" value={flagged.length}                                   icon={AlertTriangle} accent="red"    />
        <StatCard title="Est. Revenue Lost" value={`$${totalLoss}`}                                  icon={X}             accent="red"    />
      </div>

      {flagged.length > 0 && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-2xl p-4">
          <p className="text-red-400 font-bold text-sm mb-3 flex items-center gap-2"><AlertTriangle size={14}/> {flagged.length} customer{flagged.length>1?'s':''} flagged for repeat no-shows</p>
          <div className="flex flex-wrap gap-2">
            {flagged.map(c => (
              <span key={c.name} className="text-xs bg-red-500/15 border border-red-500/25 text-red-400 font-medium px-2.5 py-1 rounded-full">
                {c.name} · {c.count + c.lateCancel} incidents
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">By Customer</h3>
          <p className="text-slate-500 text-xs">{byCustomer.length} customers with incidents</p>
        </div>
        <div className="divide-y divide-slate-800/50">
          {byCustomer.map(c => {
            const risk = getRiskLevel(c);
            return (
              <div key={c.name} className="px-5 py-4 hover:bg-slate-800/20 transition-colors">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold shrink-0">{c.name[0]}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-sm">{c.name}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${risk.cls}`}>{risk.label}</span>
                    </div>
                    <p className="text-slate-500 text-xs">Last incident: {c.lastDate}</p>
                  </div>
                  <div className="flex items-center gap-4 text-right shrink-0">
                    <div><p className="text-red-400 font-black">{c.count}</p><p className="text-slate-600 text-xs">no-shows</p></div>
                    <div><p className="text-amber-400 font-black">{c.lateCancel}</p><p className="text-slate-600 text-xs">late cancel</p></div>
                  </div>
                </div>
                <div className="pl-11 space-y-1.5">
                  {c.records.map(r => (
                    <div key={`${r.customerName}-${r.date}`} className="flex items-center gap-3 text-xs">
                      <span className={`font-medium px-2 py-0.5 rounded-full ${r.type==='no_show' ? 'text-red-400 bg-red-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                        {r.type === 'no_show' ? '🚫 No Show' : '⏰ Late Cancel'}
                      </span>
                      <span className="text-slate-500">{r.date} · {r.service}</span>
                      <button onClick={() => removeRecord(r.customerName, r.date)} className="ml-auto text-slate-700 hover:text-red-400 transition-colors"><X size={12}/></button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {byCustomer.length === 0 && (
            <div className="py-14 text-center">
              <Check size={32} className="text-emerald-400 mx-auto mb-3"/>
              <p className="text-slate-400 text-sm font-medium">No no-shows recorded</p>
              <p className="text-slate-600 text-xs mt-1">Great attendance record! Keep it up.</p>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <Modal title="Log No-Show / Late Cancel" onClose={() => setShowAdd(false)} size="sm" icon={<UserX size={15} className="text-red-400"/>}>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Customer *</label>
              <select value={form.customerName} onChange={e => setForm(f=>({...f, customerName: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                <option value="">Select customer...</option>
                {business.customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Service</label>
              <select value={form.service} onChange={e => setForm(f=>({...f, service: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                <option value="">Select...</option>
                {business.services.map(s => <option key={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f=>({...f, date: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"/>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Type</label>
                <select value={form.type} onChange={e => setForm(f=>({...f, type: e.target.value as NoShowRecord['type']}))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="no_show">No Show</option>
                  <option value="late_cancel">Late Cancel</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={addRecord} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">Log Incident</button>
            </div>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast} onClose={() => setToast('')}/>}
    </div>
  );
}
