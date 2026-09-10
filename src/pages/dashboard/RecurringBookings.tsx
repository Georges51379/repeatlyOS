import { useState } from 'react';
import { RefreshCw, Plus, Check, X, Pause, Play, Calendar } from 'lucide-react';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import StatCard from '../../components/StatCard';

import { useDemo } from '../../context/DemoContext';
import type { RecurringRule } from '../../context/DemoContext';

const DAYS_OF_WEEK = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const FREQ_LABELS: Record<string,string> = { weekly:'Every week', biweekly:'Every 2 weeks', monthly:'Every month' };

export default function RecurringBookingsPage() {
  const { business, recurringRules, setRecurringRules } = useDemo();
  const [toast, setToast] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ customerName:'', service:'', staff:'', time:'09:00', frequency:'weekly' as RecurringRule['frequency'], dayOfWeek:1, startDate:'2024-06-12', endDate:'2024-12-31' });

  const active   = recurringRules.filter(r => r.active).length;
  const paused   = recurringRules.filter(r => !r.active).length;
  const totalB   = recurringRules.reduce((a, r) => a + r.bookingsCreated, 0);

  const addRule = () => {
    if (!form.customerName || !form.service) { setToast('Customer and service required.'); return; }
    const newRule: RecurringRule = {
      id: recurringRules.length + 1, customerId: Date.now(), customerName: form.customerName,
      service: form.service, staff: form.staff || business.staff[0], time: form.time,
      frequency: form.frequency, dayOfWeek: form.dayOfWeek, startDate: form.startDate,
      endDate: form.endDate, active: true, bookingsCreated: 0,
    };
    setRecurringRules([...recurringRules, newRule]);
    setShowAdd(false);
    setForm({ customerName:'', service:'', staff:'', time:'09:00', frequency:'weekly', dayOfWeek:1, startDate:'2024-06-12', endDate:'2024-12-31' });
    setToast(`Recurring booking created for ${form.customerName}.`);
  };

  const toggleRule = (id: number) => {
    setRecurringRules(recurringRules.map(r => r.id === id ? { ...r, active: !r.active } : r));
    const rule = recurringRules.find(r => r.id === id);
    setToast(`Rule ${rule?.active ? 'paused' : 'resumed'}.`);
  };

  const deleteRule = (id: number) => {
    setRecurringRules(recurringRules.filter(r => r.id !== id));
    setToast('Recurring booking removed.');
  };

  const freqColor = (f: string) => f === 'weekly' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : f === 'biweekly' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2"><RefreshCw size={18} className="text-blue-400" /> Recurring Bookings</h2>
          <p className="text-slate-500 text-sm">Auto-create repeating bookings — weekly, bi-weekly, or monthly</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
          <Plus size={14} /> New Recurring Rule
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Active Rules"      value={active}  icon={RefreshCw} accent="blue"   />
        <StatCard title="Paused"            value={paused}  icon={Pause}     accent="amber"  />
        <StatCard title="Bookings Created"  value={totalB}  icon={Calendar}  accent="emerald"/>
        <StatCard title="Time Saved (hrs)"  value={`~${totalB * 2}`} icon={Check} accent="purple" />
      </div>

      <div className="bg-blue-600/8 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
        <RefreshCw size={16} className="text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-300 font-semibold text-sm">How Recurring Bookings work</p>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">Set a rule once — "Book Rami every Saturday at 10am" — and the system auto-creates bookings for the entire date range. Staff are notified, reminders are sent automatically, and you never manually create the same booking twice.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Recurring Rules</h3>
          <p className="text-slate-500 text-xs">{recurringRules.length} total</p>
        </div>
        <div className="divide-y divide-slate-800/50">
          {recurringRules.map(r => (
            <div key={r.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-800/20 transition-colors ${!r.active ? 'opacity-60' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold shrink-0">{r.customerName[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-semibold text-sm">{r.customerName}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${freqColor(r.frequency)}`}>{FREQ_LABELS[r.frequency]}</span>
                  {!r.active && <span className="text-xs text-slate-600">Paused</span>}
                </div>
                <p className="text-slate-500 text-xs mt-0.5">
                  {r.service} · {DAYS_OF_WEEK[r.dayOfWeek]}s at {r.time} · {r.staff} · {r.startDate} → {r.endDate}
                </p>
                <p className="text-slate-600 text-xs">{r.bookingsCreated} bookings created automatically</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => toggleRule(r.id)} className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${r.active ? 'text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20'}`}>
                  {r.active ? <><Pause size={11}/> Pause</> : <><Play size={11}/> Resume</>}
                </button>
                <button onClick={() => deleteRule(r.id)} className="text-slate-600 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg border border-slate-700 hover:border-red-500/30 transition-colors">
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}
          {recurringRules.length === 0 && (
            <div className="py-14 text-center">
              <RefreshCw size={32} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No recurring rules yet</p>
              <button onClick={() => setShowAdd(true)} className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">Create your first recurring booking →</button>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <Modal title="New Recurring Booking Rule" onClose={() => setShowAdd(false)} icon={<RefreshCw size={15} className="text-blue-400" />}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Customer Name *</label>
                <input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="e.g. Rami Haddad" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Service *</label>
                <select value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="">Select...</option>
                  {business.services.map(s => <option key={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Staff</label>
                <select value={form.staff} onChange={e => setForm(f => ({ ...f, staff: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="">Auto</option>
                  {business.staff.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Frequency</label>
                <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value as RecurringRule['frequency'] }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Day of Week</label>
                <select value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: Number(e.target.value) }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                  {DAYS_OF_WEEK.map((d, i) => <option key={d} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Time</label>
                <select value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                  {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">End Date</label>
                <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-3 text-xs text-slate-400 border border-slate-700">
              📅 This will create bookings every <strong className="text-white">{DAYS_OF_WEEK[form.dayOfWeek]}</strong> at <strong className="text-white">{form.time}</strong> from <strong className="text-white">{form.startDate}</strong> to <strong className="text-white">{form.endDate}</strong>.
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={addRule} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">Create Rule</button>
            </div>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
