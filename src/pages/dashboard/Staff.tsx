import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Star, TrendingUp, CheckSquare, AlertTriangle, Plus } from 'lucide-react';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Toast from '../../components/Toast';
import Modal from '../../components/Modal';
import { useDemo } from '../../context/DemoContext';

const avatarBg = ['bg-blue-600', 'bg-purple-600', 'bg-amber-600', 'bg-emerald-600'];

export default function StaffPage() {
  const { business } = useDemo();
  const [toast, setToast] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const staffMetrics = business.staff.map((name, i) => {
    const myTasks = business.tasks.filter(t => t.staff === name);
    const completed = myTasks.filter(t => t.column === 'completed').length;
    const issues = myTasks.filter(t => t.column === 'issue').length;
    const inProgress = myTasks.filter(t => t.column === 'inprogress').length;
    const ratings = [4.9, 4.7, 5.0, 4.5];
    const revenue = [3200, 2800, 2400, 1800];
    return {
      name, i,
      total: myTasks.length,
      completed, issues, inProgress,
      todo: myTasks.filter(t => t.column === 'todo').length,
      rating: ratings[i % ratings.length],
      revenue: revenue[i % revenue.length],
      tasks: myTasks,
      completionRate: myTasks.length > 0 ? Math.round((completed / Math.max(myTasks.length, 1)) * 100) : 100,
    };
  });

  const totalTasks = staffMetrics.reduce((a, s) => a + s.total, 0);
  const totalCompleted = staffMetrics.reduce((a, s) => a + s.completed, 0);
  const totalIssues = staffMetrics.reduce((a, s) => a + s.issues, 0);
  const topPerformer = staffMetrics.reduce((a, b) => (a.completionRate >= b.completionRate ? a : b));

  const weeklyData = business.staff.map((name, i) => ({
    name,
    Mon: [3,2,4,1][i], Tue: [4,3,2,2][i], Wed: [5,4,3,2][i],
    Thu: [3,5,2,3][i], Fri: [4,3,4,2][i], Sat: [2,1,3,1][i],
  }));

  const selectedStaff = selected ? staffMetrics.find(s => s.name === selected) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">Staff Performance</h2>
          <p className="text-slate-500 text-sm">{business.staff.length} team members · {business.name}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors">
          <Plus size={13} /> Add Staff
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Tasks Today" value={totalTasks} icon={CheckSquare} accent="blue" />
        <StatCard title="Completed" value={totalCompleted} icon={TrendingUp} accent="emerald" trend={`${Math.round((totalCompleted/Math.max(totalTasks,1))*100)}% rate`} trendUp />
        <StatCard title="Issues Reported" value={totalIssues} icon={AlertTriangle} accent="red" />
        <StatCard title="Top Performer" value={topPerformer.name} icon={Star} accent="amber" />
      </div>

      {/* Staff cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {staffMetrics.map(s => (
          <button
            key={s.name}
            onClick={() => setSelected(s.name === selected ? null : s.name)}
            className={`bg-slate-900 border rounded-xl p-5 text-left transition-all hover:border-slate-700 ${selected === s.name ? 'border-blue-500 bg-blue-600/5' : 'border-slate-800'}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg ${avatarBg[s.i % avatarBg.length]}`}>
                {s.name[0]}
              </div>
              <div>
                <p className="text-white font-bold">{s.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={10} className={i < Math.floor(s.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
                  ))}
                  <span className="text-slate-400 text-xs ml-1">{s.rating}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { label: 'Tasks', value: s.total, color: 'text-slate-300' },
                { label: 'Done', value: s.completed, color: 'text-emerald-400' },
                { label: 'In Progress', value: s.inProgress, color: 'text-blue-400' },
                { label: 'Issues', value: s.issues, color: s.issues > 0 ? 'text-red-400' : 'text-slate-500' },
              ].map(m => (
                <div key={m.label} className="bg-slate-800 rounded-lg px-2.5 py-2 text-center">
                  <p className={`font-bold text-lg leading-none ${m.color}`}>{m.value}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Completion rate</span>
                <span className="text-slate-300 font-medium">{s.completionRate}%</span>
              </div>
              <div className="bg-slate-700 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all ${s.completionRate >= 90 ? 'bg-emerald-500' : s.completionRate >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${s.completionRate}%` }} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">Revenue generated</span>
              <span className="text-emerald-400 font-bold text-sm">${s.revenue.toLocaleString()}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Selected staff detail */}
      {selectedStaff && (
        <div className="bg-slate-900 border border-blue-500/30 rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">{selectedStaff.name}'s Tasks Today</h3>
          {selectedStaff.tasks.length > 0 ? (
            <div className="space-y-2">
              {selectedStaff.tasks.map(t => (
                <div key={t.id} className="flex items-center gap-3 bg-slate-800 rounded-lg px-3 py-2.5">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${t.column === 'completed' ? 'bg-emerald-400' : t.column === 'issue' ? 'bg-red-400' : t.column === 'inprogress' ? 'bg-blue-400' : 'bg-slate-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-xs font-medium">{t.customer} — {t.service}</p>
                    <p className="text-slate-500 text-xs">{t.time} · {t.notes}</p>
                  </div>
                  <StatusBadge status={t.column === 'completed' ? 'Completed' : t.column === 'issue' ? 'Issue' : t.column === 'inprogress' ? 'Active' : 'Pending'} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No tasks assigned today.</p>
          )}
        </div>
      )}

      {/* Weekly tasks chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-white font-semibold text-sm mb-4">Weekly Task Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }} />
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
              <Bar key={day} dataKey={day} fill={['#3b82f6','#8b5cf6','#f59e0b','#10b981','#06b6d4','#ef4444'][i]} radius={[3, 3, 0, 0]} stackId="a" />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {showAdd && (
        <Modal title="Add Staff Member" onClose={() => setShowAdd(false)} size="sm">
          <div className="space-y-3">
            {[{label:'Full Name',ph:'e.g. Layla Hamdan'},{label:'Role',ph:'e.g. Senior Technician'},{label:'Phone',ph:'+961 70 000 000'}].map(f => (
              <div key={f.label}>
                <label className="text-xs text-slate-400 mb-1 block">{f.label}</label>
                <input placeholder={f.ph} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500" />
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={() => { setShowAdd(false); setToast('Staff member added. Demo only.'); }} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">Add Staff</button>
            </div>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
