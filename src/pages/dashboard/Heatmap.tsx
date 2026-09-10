import { useState, useMemo } from 'react';
import { useDemo } from '../../context/DemoContext';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function generateHeatData(business: ReturnType<typeof import('../../context/DemoContext').useDemo>['business']) {
  const seed: Record<string, number> = {};
  // Use revenueData as monthly seeds
  const monthly = business.revenueData.map(r => r.revenue);
  // Generate 365 days worth of data with realistic patterns
  for (let m = 0; m < 6; m++) {
    const monthBase = (monthly[m] || 1000) / 26; // ~4 weeks business days
    for (let d = 1; d <= 30; d++) {
      const date = new Date(2024, m, d);
      if (date.getDay() === 0) continue; // skip Sundays
      const dow   = date.getDay(); // 1=Mon...6=Sat
      const isSat = dow === 6;
      const isFri = dow === 5;
      const wave  = Math.sin((d / 7) * Math.PI) * 0.4 + 0.6;
      const v = Math.max(0, Math.round(monthBase * wave * (isSat ? 1.6 : isFri ? 1.3 : 1) * (0.7 + Math.random() * 0.6)));
      const key = date.toISOString().slice(0, 10);
      seed[key] = v;
    }
  }
  return seed;
}

export default function HeatmapPage() {
  const { business } = useDemo();
  const [hoveredDay, setHoveredDay] = useState<{ key: string; value: number; date: Date } | null>(null);
  const [viewMonth, setViewMonth] = useState(5); // June = index 5

  const heatData = useMemo(() => generateHeatData(business), [business.key]);

  const maxVal = useMemo(() => Math.max(...Object.values(heatData), 1), [heatData]);

  const getColor = (val: number) => {
    if (val === 0) return 'bg-slate-800/80';
    const pct = val / maxVal;
    if (pct < 0.15) return 'bg-emerald-900/60';
    if (pct < 0.30) return 'bg-emerald-800/70';
    if (pct < 0.50) return 'bg-emerald-700/80';
    if (pct < 0.70) return 'bg-emerald-600';
    if (pct < 0.85) return 'bg-emerald-500';
    return 'bg-emerald-400';
  };

  // Build calendar grid for selected month
  const monthGrid = useMemo(() => {
    const year = 2024;
    const firstDay = new Date(year, viewMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, viewMonth + 1, 0).getDate();
    // Shift to Mon-start (0=Mon)
    const startOffset = (firstDay === 0 ? 6 : firstDay - 1);
    const cells: ({ date: Date; key: string; val: number } | null)[] = Array(startOffset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, viewMonth, d);
      const key  = date.toISOString().slice(0, 10);
      cells.push({ date, key, val: heatData[key] || 0 });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewMonth, heatData]);

  // Full year week view
  const yearWeeks = useMemo(() => {
    const weeks: ({ date: Date; key: string; val: number } | null)[][] = [];
    const start = new Date(2024, 0, 1);
    const dow = start.getDay();
    const offset = dow === 0 ? 0 : -dow + 1; // align to Mon
    start.setDate(start.getDate() + offset);
    for (let w = 0; w < 26; w++) {
      const week: ({ date: Date; key: string; val: number } | null)[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(start.getDate() + w * 7 + d);
        if (date.getFullYear() !== 2024 || date.getMonth() > 5) { week.push(null); continue; }
        const key = date.toISOString().slice(0, 10);
        week.push({ date, key, val: heatData[key] || 0 });
      }
      weeks.push(week);
    }
    return weeks;
  }, [heatData]);

  const monthTotal   = monthGrid.reduce((a, c) => a + (c?.val || 0), 0);
  const monthPeak    = monthGrid.reduce((a, c) => Math.max(a, c?.val || 0), 0);
  const monthAvg     = Math.round(monthTotal / Math.max(monthGrid.filter(c => c && c.val > 0).length, 1));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            🔥 Revenue Heatmap
          </h2>
          <p className="text-slate-500 text-sm">See your busiest days at a glance · {business.name}</p>
        </div>
      </div>

      {/* Month/Year selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {MONTHS.slice(0, 6).map((m, i) => (
          <button key={m} onClick={() => setViewMonth(i)} className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${viewMonth === i ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>{m} 2024</button>
        ))}
      </div>

      {/* Month stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Month Total', value: `$${monthTotal.toLocaleString()}`, icon: '💰' },
          { label: 'Peak Day',    value: `$${monthPeak.toLocaleString()}`,  icon: '🚀' },
          { label: 'Daily Avg',   value: `$${monthAvg.toLocaleString()}`,   icon: '📊' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xl mb-1">{s.icon}</p>
            <p className="text-white font-black text-lg">{s.value}</p>
            <p className="text-slate-500 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Calendar heatmap */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-white font-semibold text-sm mb-4">{MONTHS[viewMonth]} 2024 — Daily Revenue</h3>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map(d => <p key={d} className="text-slate-600 text-xs text-center font-medium">{d[0]}</p>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {monthGrid.map((cell, i) => (
            <div
              key={i}
              className={`relative aspect-square rounded-lg transition-all cursor-pointer ${cell ? getColor(cell.val) + ' hover:ring-2 hover:ring-emerald-400/60 hover:scale-105' : ''}`}
              onMouseEnter={() => cell && setHoveredDay({ key: cell.key, value: cell.val, date: cell.date })}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {cell && (
                <span className="absolute inset-0 flex items-center justify-center text-xs text-white/70 font-medium">{cell.date.getDate()}</span>
              )}
            </div>
          ))}
        </div>

        {/* Tooltip */}
        {hoveredDay && (
          <div className="mt-4 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex items-center justify-between animate-in">
            <div>
              <p className="text-white font-semibold text-sm">{hoveredDay.date.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}</p>
              <p className="text-slate-400 text-xs mt-0.5">{hoveredDay.value === 0 ? 'No revenue recorded' : 'Revenue generated'}</p>
            </div>
            <p className={`font-black text-2xl ${hoveredDay.value > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>${hoveredDay.value.toLocaleString()}</p>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 justify-end">
          <span className="text-slate-600 text-xs">Less</span>
          {['bg-slate-800/80','bg-emerald-900/60','bg-emerald-700/80','bg-emerald-500','bg-emerald-400'].map(c => (
            <div key={c} className={`w-4 h-4 rounded-sm ${c}`} />
          ))}
          <span className="text-slate-600 text-xs">More</span>
        </div>
      </div>

      {/* Year-to-date grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-white font-semibold text-sm mb-4">Jan – Jun 2024 · Year at a Glance</h3>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-1 shrink-0">
            {DAYS.map((d, i) => (
              <div key={d} className="h-3 flex items-center text-slate-600 text-[9px]">{i % 2 === 0 ? d[0] : ''}</div>
            ))}
          </div>
          {yearWeeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1 shrink-0">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={`w-3 h-3 rounded-sm transition-all cursor-pointer ${day ? getColor(day.val) + ' hover:ring-1 hover:ring-emerald-400/80' : 'bg-transparent'}`}
                  title={day ? `${day.date.toLocaleDateString('en-US',{month:'short',day:'numeric'})}: $${day.val}` : ''}
                />
              ))}
            </div>
          ))}
        </div>
        {/* Month labels */}
        <div className="flex mt-1 ml-6 text-slate-600 text-[9px] overflow-x-auto">
          {MONTHS.slice(0, 6).map(m => (
            <div key={m} className="w-[72px] shrink-0">{m}</div>
          ))}
        </div>
      </div>

      {/* Best/Worst days breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { title: '🔥 Best Days', entries: Object.entries(heatData).sort((a,b)=>b[1]-a[1]).slice(0,5), color: 'text-emerald-400' },
          { title: '❄️ Slowest Days', entries: Object.entries(heatData).filter(([,v])=>v>0).sort((a,b)=>a[1]-b[1]).slice(0,5), color: 'text-slate-400' },
        ].map(panel => (
          <div key={panel.title} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <h3 className="text-white font-semibold text-sm mb-3">{panel.title}</h3>
            <div className="space-y-2">
              {panel.entries.map(([key, val]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">{new Date(key).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</span>
                  <span className={`font-bold text-sm ${panel.color}`}>${val.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
