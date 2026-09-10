import { useState } from 'react';
import { Clock, Plus, Check, X, Calendar, UserCheck, AlertTriangle } from 'lucide-react';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import StatCard from '../../components/StatCard';
import { useDemo } from '../../context/DemoContext';
import type { ShiftEntry } from '../../context/DemoContext';

const WEEK_DATES = ['2024-06-10','2024-06-11','2024-06-12','2024-06-13','2024-06-14','2024-06-15','2024-06-16'];
const WEEK_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const SHIFT_STYLES = {
  work:  'bg-blue-600/20 border-blue-500/30 text-blue-300',
  off:   'bg-slate-800 border-slate-700 text-slate-500',
  leave: 'bg-amber-500/15 border-amber-500/25 text-amber-400',
};

export default function SchedulerPage() {
  const { business, shifts, setShifts, clocks, setClocks } = useDemo();
  const [tab, setTab] = useState<'schedule' | 'clockin'>('schedule');
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ staffName: '', date: '2024-06-11', startTime: '08:00', endTime: '17:00', type: 'work' as ShiftEntry['type'], note: '' });

  const staffList = business.staff;

  const addShift = () => {
    if (!form.staffName) { setToast('Select a staff member.'); return; }
    const newShift: ShiftEntry = { id: shifts.length + 1, ...form };
    setShifts([...shifts, newShift]);
    setShowAdd(false);
    setToast(`Shift added for ${form.staffName} on ${form.date}.`);
  };

  const clockIn = (staffName: string) => {
    const already = clocks.find(c => c.staffName === staffName && c.date === '2024-06-11' && !c.clockOut);
    if (already) { setToast(`${staffName} already clocked in at ${already.clockIn}.`); return; }
    const newEntry = { id: clocks.length + 1, staffName, date: '2024-06-11', clockIn: '09:' + String(Math.floor(Math.random()*59)).padStart(2,'0') };
    setClocks([...clocks, newEntry]);
    setToast(`${staffName} clocked in.`);
  };

  const clockOut = (id: number, staffName: string) => {
    setClocks(clocks.map(c => c.id === id ? { ...c, clockOut: '17:00', totalHours: 8.0 } : c));
    setToast(`${staffName} clocked out.`);
  };

  const totalHours = clocks.filter(c => c.totalHours).reduce((a, c) => a + (c.totalHours || 0), 0);
  const onShift = clocks.filter(c => c.date === '2024-06-11' && !c.clockOut).length;
  const offShift = staffList.length - onShift;
  const onLeave = shifts.filter(s => s.date === '2024-06-11' && s.type === 'leave').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2"><Calendar size={18} className="text-blue-400" /> Staff Scheduler</h2>
          <p className="text-slate-500 text-sm">Shift planning + clock-in/out tracking · {business.name}</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-slate-800 border border-slate-700 rounded-lg overflow-hidden text-xs">
            <button onClick={() => setTab('schedule')} className={`px-3 py-2 font-medium transition-colors ${tab === 'schedule' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Schedule</button>
            <button onClick={() => setTab('clockin')}  className={`px-3 py-2 font-medium transition-colors ${tab === 'clockin'  ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Clock In/Out</button>
          </div>
          {tab === 'schedule' && (
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
              <Plus size={14} /> Add Shift
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="On Shift Now"    value={onShift}           icon={UserCheck}      accent="emerald" />
        <StatCard title="Off Today"       value={offShift}           icon={X}              accent="amber" />
        <StatCard title="On Leave"        value={onLeave}            icon={AlertTriangle}  accent="amber" />
        <StatCard title="Total Hours (week)" value={totalHours.toFixed(1)} icon={Clock} accent="blue" />
      </div>

      {tab === 'schedule' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800">
            <h3 className="text-white font-semibold text-sm">Week of Jun 10–16, 2024</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-slate-500 px-4 py-3 font-medium w-28">Staff</th>
                  {WEEK_LABELS.map((d, i) => (
                    <th key={d} className={`text-center px-2 py-3 font-medium ${WEEK_DATES[i] === '2024-06-11' ? 'text-blue-400' : 'text-slate-500'}`}>
                      {d}<br /><span className="font-normal text-slate-600">{WEEK_DATES[i].slice(8)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staffList.map(staff => (
                  <tr key={staff} className="border-b border-slate-800/40 hover:bg-slate-800/10 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">{staff[0]}</div>
                        <span className="text-slate-200 font-medium">{staff}</span>
                      </div>
                    </td>
                    {WEEK_DATES.map(date => {
                      const shift = shifts.find(s => s.staffName === staff && s.date === date);
                      return (
                        <td key={date} className="px-1.5 py-2 text-center">
                          {shift ? (
                            <div className={`rounded-lg px-2 py-1.5 border text-xs font-medium ${SHIFT_STYLES[shift.type]}`}>
                              {shift.type === 'work' ? `${shift.startTime}–${shift.endTime}` : shift.type === 'off' ? 'Off' : 'Leave'}
                              {shift.note && <p className="text-xs opacity-60 truncate">{shift.note}</p>}
                            </div>
                          ) : (
                            <div className="text-slate-700 text-xs">—</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-800 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-blue-400"><span className="w-3 h-3 rounded bg-blue-600/20 border border-blue-500/30 inline-block" /> Working</span>
            <span className="flex items-center gap-1.5 text-slate-500"><span className="w-3 h-3 rounded bg-slate-800 border border-slate-700 inline-block" /> Day Off</span>
            <span className="flex items-center gap-1.5 text-amber-400"><span className="w-3 h-3 rounded bg-amber-500/15 border border-amber-500/25 inline-block" /> Leave</span>
          </div>
        </div>
      )}

      {tab === 'clockin' && (
        <div className="space-y-4">
          {/* Today's status */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800">
              <h3 className="text-white font-semibold text-sm">Today — Jun 11, 2024</h3>
            </div>
            <div className="divide-y divide-slate-800/50">
              {staffList.map(staff => {
                const todayClock = clocks.find(c => c.staffName === staff && c.date === '2024-06-11');
                const isIn = todayClock && !todayClock.clockOut;
                const isDone = todayClock && todayClock.clockOut;
                return (
                  <div key={staff} className="flex items-center gap-4 px-5 py-3.5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isIn ? 'bg-emerald-500/20 text-emerald-400' : isDone ? 'bg-slate-700 text-slate-400' : 'bg-slate-800 text-slate-500'}`}>
                      {staff[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">{staff}</p>
                      <p className="text-slate-500 text-xs">
                        {todayClock ? `Clocked in: ${todayClock.clockIn}${todayClock.clockOut ? ` · Out: ${todayClock.clockOut} · ${todayClock.totalHours}h` : ' · Still on shift'}` : 'Not clocked in today'}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {isDone ? (
                        <span className="text-xs text-slate-500 flex items-center gap-1"><Check size={12} className="text-emerald-400" /> Done</span>
                      ) : isIn ? (
                        <button onClick={() => clockOut(todayClock!.id, staff)} className="flex items-center gap-1.5 text-xs bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-medium px-3 py-1.5 rounded-lg transition-colors">
                          <X size={11} /> Clock Out
                        </button>
                      ) : (
                        <button onClick={() => clockIn(staff)} className="flex items-center gap-1.5 text-xs bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-medium px-3 py-1.5 rounded-lg transition-colors">
                          <Check size={11} /> Clock In
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent history */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800">
              <h3 className="text-white font-semibold text-sm">Clock History (last 5 entries)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[500px]">
                <thead><tr className="border-b border-slate-800 bg-slate-900/60">
                  {['Staff','Date','Clock In','Clock Out','Total Hours'].map(h => (
                    <th key={h} className="text-left text-slate-500 px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {clocks.slice(0,5).map(c => (
                    <tr key={c.id} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                      <td className="px-4 py-3 text-slate-200 font-medium">{c.staffName}</td>
                      <td className="px-4 py-3 text-slate-500">{c.date}</td>
                      <td className="px-4 py-3 text-emerald-400 font-mono">{c.clockIn}</td>
                      <td className="px-4 py-3 text-red-400 font-mono">{c.clockOut || <span className="text-amber-400">Active</span>}</td>
                      <td className="px-4 py-3 text-blue-400 font-bold">{c.totalHours ? `${c.totalHours}h` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <Modal title="Add Shift" onClose={() => setShowAdd(false)} icon={<Calendar size={15} className="text-blue-400" />}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Staff Member</label>
                <select value={form.staffName} onChange={e => setForm(f => ({ ...f, staffName: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="">Select...</option>
                  {staffList.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ShiftEntry['type'] }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="work">Working</option>
                  <option value="off">Day Off</option>
                  <option value="leave">Leave</option>
                </select>
              </div>
              {form.type === 'work' && (<>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Start Time</label>
                  <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">End Time</label>
                  <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
              </>)}
              {form.type !== 'work' && (
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block">Note (optional)</label>
                  <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="e.g. Medical leave, family emergency..." className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={addShift} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">Add Shift</button>
            </div>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
