import { useState, useEffect, useMemo } from 'react';
import { Target, Edit2, Check, X } from 'lucide-react';
import Toast from '../../components/Toast';
import { useDemo } from '../../context/DemoContext';

interface Goal { id: string; label: string; target: number; current: number; unit: string; icon: string; color: string; ring: string; to: string; }

function GoalRing({ pct, size = 100, color, children }: { pct: number; size?: number; color: string; children: React.ReactNode }) {
  const [animated, setAnimated] = useState(0);
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(animated, 100) / 100) * circ;

  useEffect(() => {
    let v = 0;
    const step = () => { v = Math.min(v + 1.2, pct); setAnimated(v); if (v < pct) requestAnimationFrame(step); };
    const t = setTimeout(() => requestAnimationFrame(step), 200);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth={8} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: 'stroke-dashoffset 0.05s linear', filter: `drop-shadow(0 0 6px ${color}60)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export default function GoalsPage() {
  const { business } = useDemo();
  const [toast, setToast] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  const [targets, setTargets] = useState({
    revenue:     business.revenueData.at(-1)?.revenue ? Math.round(business.revenueData.at(-1)!.revenue * 1.15) : 5000,
    newCustomers: 8,
    renewalRate:  90,
    zeroOverdue:  business.customers.filter(c => c.balance < 0).length,
    bookings:    30,
  });

  const actuals = useMemo(() => ({
    revenue:     business.revenueData.at(-1)?.revenue || 0,
    newCustomers: 5,
    renewalRate:  Math.round(business.customers.filter(c => c.status === 'Active').length / Math.max(business.customers.length, 1) * 100),
    zeroOverdue:  business.customers.filter(c => c.balance < 0).length,
    bookings:    business.bookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed').length,
  }), [business]);

  const goals: Goal[] = [
    { id:'revenue',     label:'Monthly Revenue',    target: targets.revenue,      current: actuals.revenue,     unit:'$',  icon:'💰', color:'#10b981', ring:'#10b981', to:'/dashboard/reports'  },
    { id:'newCustomers',label:'New Customers',       target: targets.newCustomers, current: actuals.newCustomers,unit:'',   icon:'👥', color:'#3b82f6', ring:'#3b82f6', to:'/dashboard/customers'},
    { id:'renewalRate', label:'Renewal Rate',        target: targets.renewalRate,  current: actuals.renewalRate, unit:'%',  icon:'🔄', color:'#8b5cf6', ring:'#8b5cf6', to:'/dashboard/subscriptions'},
    { id:'bookings',    label:'Confirmed Bookings',  target: targets.bookings,     current: actuals.bookings,    unit:'',   icon:'📅', color:'#f59e0b', ring:'#f59e0b', to:'/dashboard/bookings' },
    { id:'zeroOverdue', label:'Overdue Customers',   target: 0,                    current: actuals.zeroOverdue, unit:'',   icon:'💸', color: actuals.zeroOverdue === 0 ? '#10b981' : '#ef4444', ring: actuals.zeroOverdue === 0 ? '#10b981' : '#ef4444', to:'/dashboard/payments', },
  ];

  const completed = goals.filter(g => g.id === 'zeroOverdue' ? g.current === 0 : g.current >= g.target).length;
  const daysLeft  = 19; // simulated — days left in June

  const getPct = (g: Goal) => {
    if (g.id === 'zeroOverdue') return g.current === 0 ? 100 : Math.max(0, 100 - (g.current / Math.max(targets.zeroOverdue, 1)) * 100);
    return Math.min(100, g.target > 0 ? (g.current / g.target) * 100 : 0);
  };

  const saveEdit = (id: string) => {
    const val = Number(editVal);
    if (isNaN(val) || val <= 0) { setToast('Enter a valid target.'); return; }
    setTargets(prev => ({ ...prev, [id]: val }));
    setEditing(null);
    setToast('Goal updated!');
  };

  const overallPct = Math.round(goals.reduce((a, g) => a + getPct(g), 0) / goals.length);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Target size={18} className="text-blue-400" /> Goal Tracker
          </h2>
          <p className="text-slate-500 text-sm">Monthly targets with live progress · {business.name}</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
          <span className="text-slate-500 text-xs">{daysLeft} days left in June</span>
          <span className="w-px h-3 bg-slate-700" />
          <span className="text-blue-400 text-xs font-bold">{completed}/{goals.length} goals hit</span>
        </div>
      </div>

      {/* Overall progress ring */}
      <div className="bg-gradient-to-r from-blue-600/10 via-purple-600/8 to-transparent border border-blue-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-8">
        <div className="flex flex-col items-center gap-2 shrink-0">
          <GoalRing pct={overallPct} size={140} color={overallPct >= 75 ? '#10b981' : overallPct >= 50 ? '#f59e0b' : '#3b82f6'}>
            <p className="text-white font-black text-2xl">{overallPct}%</p>
            <p className="text-slate-500 text-xs">overall</p>
          </GoalRing>
          <p className="text-white font-semibold">{overallPct >= 80 ? '🚀 On fire!' : overallPct >= 60 ? '📈 On track' : overallPct >= 40 ? '⚠️ Needs push' : '🎯 Behind pace'}</p>
        </div>

        <div className="flex-1 w-full">
          <p className="text-white font-bold text-lg mb-1">June 2024 Progress</p>
          <p className="text-slate-400 text-sm mb-4">{completed} of {goals.length} targets achieved · {daysLeft} days remaining</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {goals.map(g => {
              const pct = getPct(g);
              const done = g.id === 'zeroOverdue' ? g.current === 0 : pct >= 100;
              return (
                <div key={g.id} className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${done ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-800/60 border-slate-700'}`}>
                  <span className="text-base">{g.icon}</span>
                  <div className="min-w-0">
                    <p className="text-slate-300 text-xs font-medium truncate">{g.label}</p>
                    <p className={`text-xs font-bold ${done ? 'text-emerald-400' : 'text-slate-400'}`}>{done ? '✓ Done' : `${Math.round(pct)}%`}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Individual goal rings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map(g => {
          const pct = getPct(g);
          const done = g.id === 'zeroOverdue' ? g.current === 0 : pct >= 100;
          const isEditing = editing === g.id;
          const displayCurrent = g.id === 'revenue' ? `$${g.current.toLocaleString()}` : g.id === 'renewalRate' ? `${g.current}%` : String(g.current);
          const displayTarget  = g.id === 'revenue' ? `$${g.target.toLocaleString()}` : g.id === 'renewalRate' ? `${g.target}%` : String(g.target);

          return (
            <div key={g.id} className={`bg-slate-900 border rounded-2xl p-5 transition-all ${done ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 hover:border-slate-700'}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xl mb-0.5">{g.icon}</p>
                  <p className="text-white font-bold text-sm">{g.label}</p>
                  {done && <p className="text-emerald-400 text-xs font-semibold mt-0.5">🎉 Goal achieved!</p>}
                </div>
                <button
                  onClick={() => { setEditing(g.id); setEditVal(String(g.target)); }}
                  className="text-slate-600 hover:text-slate-400 hover:bg-slate-800 rounded-lg p-1 transition-colors"
                  title="Edit target"
                >
                  <Edit2 size={13} />
                </button>
              </div>

              <div className="flex items-center gap-5">
                <GoalRing pct={pct} size={90} color={done ? '#10b981' : g.ring}>
                  <p className="text-white font-black text-sm">{Math.round(pct)}%</p>
                </GoalRing>
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 block">New target</label>
                      <input
                        type="number" autoFocus value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(g.id); if (e.key === 'Escape') setEditing(null); }}
                        className="w-full bg-slate-800 border border-blue-500 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none"
                      />
                      <div className="flex gap-1.5">
                        <button onClick={() => saveEdit(g.id)}    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"><Check size={11}/> Save</button>
                        <button onClick={() => setEditing(null)}  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"><X size={11}/> Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div>
                        <p className="text-slate-500 text-xs">Current</p>
                        <p className="text-white font-black text-xl">{displayCurrent}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Target</p>
                        <p className="text-slate-300 font-bold">{g.id === 'zeroOverdue' ? '0 overdue' : displayTarget}</p>
                      </div>
                      {!done && g.id !== 'zeroOverdue' && (
                        <p className="text-slate-600 text-xs">{Math.ceil((g.target - g.current) / Math.max(daysLeft / 30, 0.1))} needed/day</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Motivation banner */}
      <div className={`rounded-2xl p-5 flex items-center gap-4 border ${completed === goals.length ? 'bg-gradient-to-r from-emerald-600/20 to-transparent border-emerald-500/30' : 'bg-gradient-to-r from-blue-600/10 to-transparent border-blue-500/20'}`}>
        <div className="text-4xl">{completed === goals.length ? '🏆' : completed >= 3 ? '🚀' : '🎯'}</div>
        <div>
          <p className="text-white font-bold">{completed === goals.length ? 'All goals achieved this month!' : completed >= 3 ? `${completed} goals down, ${goals.length - completed} to go!` : `${daysLeft} days to reach your targets`}</p>
          <p className="text-slate-400 text-sm mt-0.5">{completed === goals.length ? 'Outstanding performance. Set new targets for next month!' : `You're at ${overallPct}% overall — ${overallPct >= 60 ? 'keep the momentum going!' : 'time to push harder.'}`}</p>
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
