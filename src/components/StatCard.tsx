import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  accent?: 'blue'|'emerald'|'amber'|'red'|'purple'|'cyan'|'orange';
  subtitle?: string;
}

const accents = {
  blue:    { icon: 'text-blue-400 bg-blue-500/10 border-blue-500/20',    bar: 'bg-blue-500' },
  emerald: { icon: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', bar: 'bg-emerald-500' },
  amber:   { icon: 'text-amber-400 bg-amber-500/10 border-amber-500/20', bar: 'bg-amber-500' },
  red:     { icon: 'text-red-400 bg-red-500/10 border-red-500/20',       bar: 'bg-red-500' },
  purple:  { icon: 'text-purple-400 bg-purple-500/10 border-purple-500/20', bar: 'bg-purple-500' },
  cyan:    { icon: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',    bar: 'bg-cyan-500' },
  orange:  { icon: 'text-orange-400 bg-orange-500/10 border-orange-500/20', bar: 'bg-orange-500' },
};

export default function StatCard({ title, value, icon: Icon, trend, trendUp, accent = 'blue', subtitle }: StatCardProps) {
  const a = accents[accent];
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 card-hover group relative overflow-hidden animate-in">
      {/* Subtle top accent line */}
      <div className={clsx('absolute top-0 left-0 right-0 h-px opacity-50', a.bar)} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider truncate">{title}</p>
          <p className="text-white text-2xl font-bold mt-1.5 tabular-nums">{value}</p>
          {subtitle && <p className="text-slate-600 text-xs mt-0.5 truncate">{subtitle}</p>}
          {trend && (
            <p className={clsx('text-xs mt-1.5 flex items-center gap-1 font-medium', trendUp ? 'text-emerald-400' : 'text-red-400')}>
              {trendUp ? <TrendingUp size={10}/> : <TrendingDown size={10}/>} {trend}
            </p>
          )}
        </div>
        <div className={clsx('p-2.5 rounded-xl border shrink-0', a.icon)}>
          <Icon size={16} />
        </div>
      </div>
    </div>
  );
}
