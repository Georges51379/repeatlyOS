import { useState, useEffect } from 'react';
import { AlertCircle, Plus, Search, User, Clock, CheckCircle2, AlertOctagon } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { useDemo } from '../../context/DemoContext';

type Column = 'todo' | 'inprogress' | 'completed' | 'issue';

const COLUMNS: { key: Column; label: string; emoji: string; borderColor: string; dotColor: string; headerBg: string; icon: typeof CheckCircle2 }[] = [
  { key: 'todo',      label: 'To Do',          emoji: '📋', borderColor: 'border-slate-700',       dotColor: 'bg-slate-500',   headerBg: 'bg-slate-800/50', icon: Clock },
  { key: 'inprogress',label: 'In Progress',    emoji: '⚡', borderColor: 'border-blue-500/40',     dotColor: 'bg-blue-400',    headerBg: 'bg-blue-500/10',  icon: AlertOctagon },
  { key: 'completed', label: 'Completed',      emoji: '✅', borderColor: 'border-emerald-500/40', dotColor: 'bg-emerald-400', headerBg: 'bg-emerald-500/10', icon: CheckCircle2 },
  { key: 'issue',     label: 'Issue Reported', emoji: '🚨', borderColor: 'border-red-500/40',      dotColor: 'bg-red-400',     headerBg: 'bg-red-500/10',   icon: AlertCircle },
];

const STAFF_COLORS = [
  'bg-blue-600/20 text-blue-400 border-blue-500/20',
  'bg-purple-600/20 text-purple-400 border-purple-500/20',
  'bg-amber-600/20 text-amber-400 border-amber-500/20',
  'bg-emerald-600/20 text-emerald-400 border-emerald-500/20',
];

export default function TasksPage() {
  const { business } = useDemo();
  const [tasks, setTasks] = useState(business.tasks);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [staffFilter, setStaffFilter] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ customer: '', service: '', staff: '', time: '', notes: '', column: 'todo' as Column });

  useEffect(() => { setTasks(business.tasks); }, [business.key]);

  const staffColorMap: Record<string, string> = {};
  business.staff.forEach((s, i) => { staffColorMap[s] = STAFF_COLORS[i % STAFF_COLORS.length]; });

  const filtered = tasks.filter(t => {
    const ms = search === '' || t.customer.toLowerCase().includes(search.toLowerCase()) || t.service.toLowerCase().includes(search.toLowerCase());
    const mf = staffFilter === 'All' || t.staff === staffFilter;
    return ms && mf;
  });

  const moveTask = (id: number, to: Column) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, column: to } : t));
    const label = COLUMNS.find(c => c.key === to)?.label;
    setToast(`Task moved to "${label}".`);
  };

  const addTask = () => {
    if (!addForm.customer || !addForm.service) { setToast('Customer and service are required.'); return; }
    const newTask = {
      id: tasks.length + 1, column: addForm.column,
      customer: addForm.customer, service: addForm.service,
      staff: addForm.staff || business.staff[0], time: addForm.time || '09:00',
      payment: 'Pending', notes: addForm.notes,
    };
    setTasks(prev => [newTask, ...prev]);
    setShowAdd(false);
    setAddForm({ customer: '', service: '', staff: '', time: '', notes: '', column: 'todo' });
    setToast(`Task added for ${addForm.customer}.`);
  };

  const totalIssues = tasks.filter(t => t.column === 'issue').length;
  const totalDone = tasks.filter(t => t.column === 'completed').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg">Staff Tasks</h2>
          <p className="text-slate-500 text-sm">
            Today's operational board · {tasks.length} tasks · {totalDone} done
            {totalIssues > 0 && <span className="text-red-400 ml-2">· {totalIssues} issue{totalIssues > 1 ? 's' : ''} reported</span>}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
          <Plus size={14} /> Add Task
        </button>
      </div>

      {/* Search + staff filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {['All', ...business.staff].map((s, i) => (
            <button key={s} onClick={() => setStaffFilter(s)} className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${staffFilter === s ? 'bg-blue-600 text-white border-blue-500' : s === 'All' ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200' : `${STAFF_COLORS[(i - 1) % STAFF_COLORS.length]} border-current hover:opacity-80`}`}>
              {s !== 'All' && <User size={10} />} {s}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map(col => {
          const colTasks = filtered.filter(t => t.column === col.key);
          const ColIcon = col.icon;
          return (
            <div key={col.key} className={`bg-slate-900 border rounded-2xl overflow-hidden ${col.borderColor}`}>
              {/* Column header */}
              <div className={`px-4 py-3 border-b border-slate-800 flex items-center justify-between ${col.headerBg}`}>
                <div className="flex items-center gap-2">
                  <ColIcon size={13} className={`${col.dotColor.replace('bg-', 'text-')}`} />
                  <span className="text-slate-200 font-semibold text-sm">{col.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`${col.dotColor.replace('bg-', 'bg-')}/20 text-xs font-bold px-2 py-0.5 rounded-full ${col.dotColor.replace('bg-', 'text-')}`}>{colTasks.length}</span>
                </div>
              </div>

              {/* Tasks */}
              <div className="p-3 space-y-2.5 min-h-[200px]">
                {colTasks.map(task => (
                  <div key={task.id} className={`bg-slate-800 border rounded-xl p-3 hover:border-slate-600 transition-all group ${task.column === 'issue' ? 'border-red-500/30' : 'border-slate-700'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-bold truncate">{task.customer}</p>
                        <p className="text-slate-400 text-xs mt-0.5 truncate">{task.service}</p>
                      </div>
                      {task.column === 'issue' && <AlertCircle size={12} className="text-red-400 shrink-0 ml-2 mt-0.5" />}
                    </div>

                    <div className="flex items-center justify-between mb-2.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${staffColorMap[task.staff] || 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                        {task.staff}
                      </span>
                      <span className="text-slate-500 text-xs font-mono flex items-center gap-1">
                        <Clock size={9} />{task.time}
                      </span>
                    </div>

                    <StatusBadge status={task.payment} />

                    {task.notes && (
                      <p className="text-slate-500 text-xs mt-2 leading-snug line-clamp-2 italic">"{task.notes}"</p>
                    )}

                    {/* Move buttons — visible on hover */}
                    <div className="flex gap-1 mt-2.5 flex-wrap opacity-60 group-hover:opacity-100 transition-opacity">
                      {COLUMNS.filter(c => c.key !== col.key).map(c => (
                        <button key={c.key} onClick={() => moveTask(task.id, c.key)} className="text-xs text-slate-500 hover:text-slate-200 bg-slate-700/60 hover:bg-slate-700 px-2 py-0.5 rounded-lg transition-colors">
                          {c.emoji} {c.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-24 gap-2">
                    <p className="text-slate-700 text-xs">No tasks</p>
                    {col.key === 'todo' && (
                      <button onClick={() => setShowAdd(true)} className="text-xs text-slate-600 hover:text-blue-400 transition-colors flex items-center gap-1">
                        <Plus size={10} /> Add task
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {showAdd && (
        <Modal title="Add Task" onClose={() => setShowAdd(false)} icon={<Plus size={15} className="text-blue-400" />}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Customer *</label>
                <input value={addForm.customer} onChange={e => setAddForm(f => ({ ...f, customer: e.target.value }))} placeholder="Customer name" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Service *</label>
                <select value={addForm.service} onChange={e => setAddForm(f => ({ ...f, service: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="">Select...</option>
                  {business.services.map(s => <option key={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Assign Staff</label>
                <select value={addForm.staff} onChange={e => setAddForm(f => ({ ...f, staff: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="">Auto</option>
                  {business.staff.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Time</label>
                <select value={addForm.time} onChange={e => setAddForm(f => ({ ...f, time: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                  {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Start In Column</label>
                <select value={addForm.column} onChange={e => setAddForm(f => ({ ...f, column: e.target.value as Column }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                  {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Notes</label>
                <textarea value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} placeholder="Special instructions, customer preference..." rows={2} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none transition-colors" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={addTask} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">Add Task</button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
