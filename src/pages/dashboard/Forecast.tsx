import { useMemo } from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDemo } from '../../context/DemoContext';

export default function ForecastPage() {
  const { business } = useDemo();

  const today = new Date('2024-06-11');

  const forecast = useMemo(() => {
    const subRevenue    = business.customers.filter(c => c.type === 'Subscription').length * business.subscription.price;
    const pkgRevenue    = business.customers.filter(c => c.type === 'Package').length * (business.packages[0]?.price || 0) * 0.3;
    const bookingAvg    = business.bookings.filter(b => b.payment === 'Paid').reduce((a, b) => a + b.amount, 0) / Math.max(business.bookings.length, 1) * 22;
    const overdueLoss   = business.customers.filter(c => c.balance < 0).reduce((a, c) => a + Math.abs(c.balance), 0);
    const expiringRisk  = business.customers.filter(c => c.status === 'Expiring Soon').length * business.subscription.price;

    const floor   = Math.round(subRevenue * 0.85);
    const likely  = Math.round(subRevenue + pkgRevenue * 0.6 + bookingAvg * 0.7);
    const best    = Math.round(subRevenue + pkgRevenue + bookingAvg + overdueLoss * 0.5);

    // 30-day daily projection
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i + 1);
      const isRenewalDay = i === 6 || i === 13 || i === 20 || i === 27;
      const dailyBase = likely / 30;
      const spike     = isRenewalDay ? subRevenue * 0.25 : 0;
      const noise     = (Math.sin(i * 1.5) * dailyBase * 0.3);
      return {
        day: `Jun ${d.getDate()}`,
        revenue: Math.max(0, Math.round(dailyBase + spike + noise)),
        floor: Math.round(floor / 30),
        best: Math.round(best / 30 + (isRenewalDay ? best * 0.08 : 0)),
      };
    });

    return { floor, likely, best, overdueLoss, expiringRisk, days, subRevenue: Math.round(subRevenue), pkgRevenue: Math.round(pkgRevenue), bookingAvg: Math.round(bookingAvg) };
  }, [business]);

  const breakdown = [
    { label: 'Subscription Renewals', value: forecast.subRevenue, color: 'bg-blue-500', pct: Math.round((forecast.subRevenue / forecast.likely) * 100), icon: '🔄', confidence: 'High' },
    { label: 'Package Sales',         value: forecast.pkgRevenue, color: 'bg-purple-500', pct: Math.round((forecast.pkgRevenue / forecast.likely) * 100), icon: '📦', confidence: 'Medium' },
    { label: 'Ad-hoc Bookings',       value: forecast.bookingAvg, color: 'bg-emerald-500', pct: Math.round((forecast.bookingAvg / forecast.likely) * 100), icon: '📅', confidence: 'Medium' },
  ];

  const risks = [
    ...(forecast.overdueLoss > 0 ? [{ label: `${business.customers.filter(c => c.balance < 0).length} unpaid customer${business.customers.filter(c => c.balance < 0).length !== 1 ? 's' : ''}`, amount: forecast.overdueLoss, icon: '⚠️', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' }] : []),
    ...(forecast.expiringRisk > 0 ? [{ label: `${business.customers.filter(c => c.status === 'Expiring Soon').length} subscription${business.customers.filter(c => c.status === 'Expiring Soon').length !== 1 ? 's' : ''} expiring`, amount: forecast.expiringRisk, icon: '⏰', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' }] : []),
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-400" /> Revenue Forecast
        </h2>
        <p className="text-slate-500 text-sm">Next 30 days projection for {business.name} — based on subscriptions, packages, and booking patterns</p>
      </div>

      {/* Scenario cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Floor Revenue', value: forecast.floor, sub: 'Guaranteed if all subs renew', color: 'border-slate-700', badge: 'bg-slate-800 text-slate-400', icon: '🛡️' },
          { label: 'Likely Revenue', value: forecast.likely, sub: 'With avg bookings + packages', color: 'border-blue-500/40 bg-blue-500/5', badge: 'bg-blue-500/20 text-blue-400', icon: '📊', highlight: true },
          { label: 'Best Case', value: forecast.best, sub: 'Recover all overdue + max capacity', color: 'border-emerald-500/40 bg-emerald-500/5', badge: 'bg-emerald-500/20 text-emerald-400', icon: '🚀' },
        ].map(s => (
          <div key={s.label} className={`relative bg-slate-900 border rounded-2xl p-5 ${s.color} ${s.highlight ? 'ring-1 ring-blue-500/30' : ''}`}>
            {s.highlight && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs bg-blue-600 text-white px-3 py-0.5 rounded-full font-semibold">Most Likely</span>}
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-slate-500 text-xs font-medium mb-1">{s.label}</p>
            <p className="text-white text-3xl font-black">${s.value.toLocaleString()}</p>
            <p className="text-slate-500 text-xs mt-1">{s.sub}</p>
            <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full mt-3 ${s.badge}`}>Next 30 days</span>
          </div>
        ))}
      </div>

      {/* 30-day chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold text-sm">Daily Revenue Projection</h3>
            <p className="text-slate-500 text-xs mt-0.5">Jun 12 – Jul 11, 2024 · Spikes = renewal days</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-blue-400"><span className="w-3 h-0.5 bg-blue-500 rounded inline-block" />Likely</span>
            <span className="flex items-center gap-1.5 text-slate-500"><span className="w-3 h-0.5 bg-slate-600 rounded inline-block" />Floor</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={forecast.days}>
            <defs>
              <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="best-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, fontSize: 11 }} formatter={(v: unknown) => [`$${v}`, '']} />
            <Area type="monotone" dataKey="best"    stroke="#10b981" strokeWidth={1} strokeDasharray="4 2" fill="url(#best-grad)" />
            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#rev-grad)" />
            <Area type="monotone" dataKey="floor"   stroke="#475569" strokeWidth={1} strokeDasharray="4 2" fill="none" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Revenue Breakdown</h3>
          <div className="space-y-4">
            {breakdown.map(b => (
              <div key={b.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span>{b.icon}</span>
                    <span className="text-slate-300 text-sm">{b.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${b.confidence === 'High' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>{b.confidence}</span>
                  </div>
                  <span className="text-white font-bold text-sm">${b.value.toLocaleString()}</span>
                </div>
                <div className="bg-slate-800 rounded-full h-2">
                  <div className={`h-2 rounded-full ${b.color} transition-all`} style={{ width: `${b.pct}%` }} />
                </div>
                <p className="text-slate-600 text-xs mt-0.5">{b.pct}% of projected revenue</p>
              </div>
            ))}
          </div>
        </div>

        {/* Risk factors */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-1 flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-400" /> Revenue Risks
          </h3>
          <p className="text-slate-500 text-xs mb-4">Issues that could reduce your forecast</p>

          {risks.length > 0 ? (
            <div className="space-y-3">
              {risks.map(r => (
                <div key={r.label} className={`border rounded-xl p-3.5 flex items-center justify-between ${r.bg}`}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{r.icon}</span>
                    <div>
                      <p className={`text-sm font-semibold ${r.color}`}>{r.label}</p>
                      <p className="text-slate-500 text-xs">at risk of not being collected</p>
                    </div>
                  </div>
                  <p className={`font-black text-lg ${r.color}`}>-${r.amount}</p>
                </div>
              ))}
              <div className="bg-slate-800 rounded-xl p-3 flex items-center justify-between">
                <span className="text-slate-400 text-sm">Total at-risk revenue</span>
                <span className="text-red-400 font-black">${(forecast.overdueLoss + forecast.expiringRisk).toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">🎉</p>
              <p className="text-emerald-400 font-semibold text-sm">No major risks detected</p>
              <p className="text-slate-500 text-xs mt-1">Your revenue pipeline looks healthy!</p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Confidence score</span>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-4 h-2 rounded-full ${i < (risks.length === 0 ? 5 : risks.length === 1 ? 4 : 3) ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                  ))}
                </div>
                <span className="text-emerald-400 font-semibold">{risks.length === 0 ? 'High' : risks.length === 1 ? 'Good' : 'Medium'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
