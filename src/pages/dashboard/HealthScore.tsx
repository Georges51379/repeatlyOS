import { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useDemo } from '../../context/DemoContext';

interface Business {
  customers: { status: string; balance: number }[];
  payments: { status: string }[];
  tasks: { column: string }[];
  products: { stock: number; lowStockAt: number }[];
  bookings: { status: string }[];
  subscription: { price: number };
}

function useBuildScore(business: Business) {
  return useMemo(() => {
    const { customers, payments, tasks, products, bookings } = business;

    const activeRate  = customers.length > 0 ? customers.filter((c) => c.status === 'Active').length / customers.length : 0;
    const paidRate    = payments.length  > 0 ? payments.filter((p) => p.status === 'Paid').length    / payments.length   : 1;
    const taskDone    = tasks.length     > 0 ? tasks.filter((t) => t.column === 'completed').length   / tasks.length      : 1;
    const noIssues    = tasks.length     > 0 ? 1 - tasks.filter((t) => t.column === 'issue').length   / tasks.length      : 1;
    const stockHealth = products.length  > 0 ? products.filter((p) => p.stock > p.lowStockAt).length  / products.length   : 1;
    const confirmedB  = bookings.length  > 0 ? bookings.filter((b) => b.status === 'Confirmed' || b.status === 'Completed').length / bookings.length : 0.8;

    const factors = [
      { label: 'Customer Retention', score: Math.round(activeRate  * 20), max: 20, desc: `${customers.filter((c) => c.status === 'Active').length}/${customers.length} active`,      to: '/dashboard/customers', trend: (activeRate > 0.7 ? 'up' : activeRate < 0.5 ? 'down' : 'flat') as 'up'|'down'|'flat' },
      { label: 'Payment Collection', score: Math.round(paidRate    * 20), max: 20, desc: `${payments.filter((p) => p.status === 'Paid').length}/${payments.length} paid`,             to: '/dashboard/payments',  trend: (paidRate  > 0.8 ? 'up' : paidRate  < 0.6 ? 'down' : 'flat') as 'up'|'down'|'flat' },
      { label: 'Task Completion',    score: Math.round(taskDone    * 15), max: 15, desc: `${tasks.filter((t) => t.column === 'completed').length}/${tasks.length} tasks done`,        to: '/dashboard/tasks',     trend: (taskDone  > 0.8 ? 'up' : taskDone  < 0.5 ? 'down' : 'flat') as 'up'|'down'|'flat' },
      { label: 'No Issues Reported', score: Math.round(noIssues   * 15), max: 15, desc: `${tasks.filter((t) => t.column === 'issue').length} issues reported`,                       to: '/dashboard/tasks',     trend: (noIssues > 0.9 ? 'up' : noIssues < 0.7 ? 'down' : 'flat') as 'up'|'down'|'flat' },
      { label: 'Stock Health',       score: Math.round(stockHealth * 15), max: 15, desc: `${products.filter((p) => p.stock <= p.lowStockAt).length} products low/out`,                to: '/dashboard/reorder',   trend: (stockHealth > 0.8 ? 'up' : stockHealth < 0.6 ? 'down' : 'flat') as 'up'|'down'|'flat' },
      { label: 'Booking Efficiency', score: Math.round(confirmedB  * 15), max: 15, desc: `${bookings.filter((b) => b.status === 'Confirmed' || b.status === 'Completed').length}/${bookings.length} confirmed`, to: '/dashboard/bookings', trend: (confirmedB > 0.7 ? 'up' : 'flat') as 'up'|'down'|'flat' },
    ];
    const total = factors.reduce((a, f) => a + f.score, 0);
    return { total, factors };
  }, [business]);
}

function Ring({ score, size = 120 }: { score: number; size?: number }) {
  const [animated, setAnimated] = useState(0);
  const r = (size - 20) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(animated, 100) / 100) * circ;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const glow  = score >= 75 ? 'drop-shadow(0 0 8px rgba(16,185,129,0.5))' : score >= 50 ? 'drop-shadow(0 0 8px rgba(245,158,11,0.4))' : 'drop-shadow(0 0 8px rgba(239,68,68,0.4))';

  useEffect(() => {
    let v = 0;
    const step = () => { v = Math.min(v + 1.5, score); setAnimated(v); if (v < score) requestAnimationFrame(step); };
    const t = setTimeout(() => requestAnimationFrame(step), 300);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <svg width={size} height={size} style={{ filter: glow }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth={10} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset} transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.05s linear' }} />
      <text x={size/2} y={size/2 - 6}  textAnchor="middle" fill="white" fontSize={size === 120 ? 26 : 20} fontWeight="900" fontFamily="monospace">{Math.round(animated)}</text>
      <text x={size/2} y={size/2 + 12} textAnchor="middle" fill="#64748b" fontSize={10}>/ 100</text>
    </svg>
  );
}

export function HealthScoreBadge() {
  const { business } = useDemo();
  const { total } = useBuildScore(business);
  const color = total >= 75 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : total >= 50 ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10';
  const emoji = total >= 75 ? '💚' : total >= 50 ? '💛' : '🔴';
  return (
    <Link to="/dashboard/health" className={`hidden sm:flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all hover:scale-[1.03] ${color}`} title="Business Health Score">
      {emoji} <span>{total}</span><span className="font-normal opacity-70">/100</span>
    </Link>
  );
}

export default function HealthScore() {
  const { business } = useDemo();
  const { total, factors } = useBuildScore(business);

  const label = total >= 80 ? 'Excellent' : total >= 65 ? 'Good' : total >= 50 ? 'Fair' : total >= 35 ? 'Needs Attention' : 'Critical';
  const color = total >= 75 ? 'text-emerald-400' : total >= 50 ? 'text-amber-400' : 'text-red-400';
  const bgGrad = total >= 75 ? 'from-emerald-600/10' : total >= 50 ? 'from-amber-600/10' : 'from-red-600/10';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white font-bold text-lg flex items-center gap-2">💚 Business Health Score</h2>
        <p className="text-slate-500 text-sm">Real-time score from live operational data · {business.name}</p>
      </div>

      <div className={`bg-gradient-to-br ${bgGrad} to-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-8`}>
        <div className="flex flex-col items-center gap-3 shrink-0">
          <Ring score={total} size={160} />
          <div className="text-center">
            <p className={`text-2xl font-black ${color}`}>{label}</p>
            <p className="text-slate-500 text-sm mt-0.5">Overall business health</p>
          </div>
        </div>
        <div className="flex-1 space-y-3 w-full">
          {factors.map(f => {
            const pct = f.max > 0 ? (f.score / f.max) * 100 : 0;
            const barColor = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
            const TrendIcon = f.trend === 'up' ? TrendingUp : f.trend === 'down' ? TrendingDown : Minus;
            const trendColor = f.trend === 'up' ? 'text-emerald-400' : f.trend === 'down' ? 'text-red-400' : 'text-slate-500';
            return (
              <Link key={f.label} to={f.to} className="block group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <TrendIcon size={12} className={trendColor} />
                    <span className="text-slate-300 text-sm font-medium group-hover:text-white transition-colors">{f.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-xs">{f.desc}</span>
                    <span className="text-slate-300 text-sm font-bold tabular-nums">{f.score}<span className="text-slate-600 font-normal">/{f.max}</span></span>
                  </div>
                </div>
                <div className="bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className={`h-2 rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {factors.map(f => {
          const pct = f.max > 0 ? (f.score / f.max) * 100 : 0;
          const grade = pct >= 80 ? { g: 'A', c: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' } : pct >= 65 ? { g: 'B', c: 'text-blue-400 bg-blue-500/10 border-blue-500/20' } : pct >= 50 ? { g: 'C', c: 'text-amber-400 bg-amber-500/10 border-amber-500/20' } : { g: 'D', c: 'text-red-400 bg-red-500/10 border-red-500/20' };
          return (
            <Link key={f.label} to={f.to} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all hover:translate-y-[-2px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-medium leading-snug">{f.label}</span>
                <span className={`text-xs font-black px-1.5 py-0.5 rounded border ${grade.c}`}>{grade.g}</span>
              </div>
              <Ring score={pct} size={56} />
              <p className="text-slate-500 text-xs mt-2 leading-snug">{f.desc}</p>
            </Link>
          );
        })}
      </div>

      {total < 80 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">💡 How to improve your score</h3>
          <div className="space-y-2.5">
            {factors.filter(f => f.score < f.max * 0.75).map(f => (
              <Link key={f.label} to={f.to} className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 rounded-xl px-3 py-2.5 transition-colors group">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                  <TrendingUp size={13} className="text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-xs font-semibold">{f.label} — {f.score}/{f.max} pts</p>
                  <p className="text-slate-500 text-xs">{f.desc} · Click to fix →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
