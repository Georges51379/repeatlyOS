import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Heart, TrendingUp, UserCheck, AlertTriangle, Star, Award } from 'lucide-react';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { useDemo } from '../../context/DemoContext';

const tiers = [
  { name: 'Platinum', min: 6, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25', icon: '💎' },
  { name: 'Gold', min: 4, color: 'text-amber-400 bg-amber-500/10 border-amber-500/25', icon: '🥇' },
  { name: 'Silver', min: 2, color: 'text-slate-300 bg-slate-500/10 border-slate-500/25', icon: '🥈' },
  { name: 'New', min: 0, color: 'text-blue-400 bg-blue-500/10 border-blue-500/25', icon: '🆕' },
];

const getTier = (visits: number) => tiers.find(t => visits >= t.min) || tiers[tiers.length - 1];

export default function LoyaltyPage() {
  const { business } = useDemo();

  // Build loyalty metrics per customer
  const loyaltyData = business.customers.map((c, i) => {
    const visits = [8, 5, 3, 2, 1, 6, 4, 7][i % 8];
    const spend = visits * (business.subscription.price || 50);
    const risk = c.status === 'Overdue' || c.status === 'Expiring Soon';
    const tier = getTier(visits);
    return { ...c, visits, spend, tier, risk, score: Math.min(100, visits * 10 + (c.balance === 0 ? 20 : 0)) };
  });

  const retentionByMonth = [
    { month: 'Jan', new: 2, retained: 18, churned: 1 },
    { month: 'Feb', new: 3, retained: 19, churned: 2 },
    { month: 'Mar', new: 4, retained: 21, churned: 1 },
    { month: 'Apr', new: 2, retained: 23, churned: 0 },
    { month: 'May', new: 5, retained: 25, churned: 2 },
    { month: 'Jun', new: 3, retained: 27, churned: 1 },
  ];

  const radarData = [
    { subject: 'Bookings', A: 85 },
    { subject: 'Payments', A: 78 },
    { subject: 'Renewals', A: 91 },
    { subject: 'Reminders', A: 65 },
    { subject: 'Satisfaction', A: 94 },
    { subject: 'Retention', A: 87 },
  ];

  const avgScore = Math.round(loyaltyData.reduce((a, c) => a + c.score, 0) / loyaltyData.length);
  const atRisk = loyaltyData.filter(c => c.risk).length;
  const topSpender = loyaltyData.reduce((a, b) => a.spend > b.spend ? a : b);
  const platinum = loyaltyData.filter(c => c.tier.name === 'Platinum').length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white font-bold text-lg">Loyalty & Retention</h2>
        <p className="text-slate-500 text-sm">Customer health scores, tiers, and churn risk · {business.name}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Avg Health Score" value={`${avgScore}%`} icon={Heart} accent="emerald" trend="Good" trendUp />
        <StatCard title="Platinum Members" value={platinum} icon={Award} accent="purple" />
        <StatCard title="At Churn Risk" value={atRisk} icon={AlertTriangle} accent="red" />
        <StatCard title="Retention Rate" value="91%" icon={TrendingUp} accent="blue" trend="+3% vs last month" trendUp />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Radar chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-1">Business Health Radar</h3>
          <p className="text-slate-500 text-xs mb-4">Overall operational performance</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
              <Radar name="Score" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Retention chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 lg:col-span-2">
          <h3 className="text-white font-semibold text-sm mb-1">Retention by Month</h3>
          <p className="text-slate-500 text-xs mb-4">New vs retained vs churned customers</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={retentionByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="retained" name="Retained" fill="#10b981" radius={[3, 3, 0, 0]} stackId="a" />
              <Bar dataKey="new" name="New" fill="#3b82f6" radius={[3, 3, 0, 0]} stackId="a" />
              <Bar dataKey="churned" name="Churned" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top spender highlight */}
      <div className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl p-4 flex items-center gap-4">
        <div className="text-3xl">🏆</div>
        <div className="flex-1">
          <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-0.5">Top Customer This Month</p>
          <p className="text-white font-bold">{topSpender.name}</p>
          <p className="text-slate-400 text-sm">{topSpender.visits} visits · ${topSpender.spend} total spent · {topSpender.tier.name} tier</p>
        </div>
        <div className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${topSpender.tier.color}`}>
          {topSpender.tier.icon} {topSpender.tier.name}
        </div>
      </div>

      {/* Customer loyalty table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Customer Loyalty Scores</h3>
          <div className="flex items-center gap-3">
            {tiers.map(t => (
              <span key={t.name} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${t.color}`}>{t.icon} {t.name}</span>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-800">
                {['Customer', 'Tier', 'Visits', 'Total Spend', 'Health Score', 'Status', 'Risk'].map(h => (
                  <th key={h} className="text-left text-slate-500 text-xs font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loyaltyData.sort((a, b) => b.score - a.score).map((c) => (
                <tr key={c.id} className={`border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors ${c.risk ? 'border-l-2 border-l-red-500/50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold">{c.name[0]}</div>
                      <span className="text-slate-200 text-sm font-medium">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${c.tier.color}`}>{c.tier.icon} {c.tier.name}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm font-medium">{c.visits}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm font-medium">${c.spend}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${c.score >= 80 ? 'bg-emerald-500' : c.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${c.score}%` }}
                        />
                      </div>
                      <span className="text-slate-400 text-xs">{c.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">
                    {c.risk
                      ? <span className="flex items-center gap-1 text-red-400 text-xs"><AlertTriangle size={11} /> At Risk</span>
                      : <span className="flex items-center gap-1 text-emerald-400 text-xs"><UserCheck size={11} /> Healthy</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tier summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tiers.map(t => {
          const count = loyaltyData.filter(c => c.tier.name === t.name).length;
          return (
            <div key={t.name} className={`border rounded-xl p-4 text-center ${t.color.split(' ').filter(c => c.startsWith('bg-') || c.startsWith('border-')).join(' ')}`}>
              <p className="text-2xl mb-1">{t.icon}</p>
              <p className={`text-xl font-black ${t.color.split(' ').find(c => c.startsWith('text-'))}`}>{count}</p>
              <p className="text-slate-400 text-xs mt-0.5">{t.name} members</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {[...Array(t.name === 'Platinum' ? 5 : t.name === 'Gold' ? 4 : t.name === 'Silver' ? 3 : 1)].map((_, i) => (
                  <Star key={i} size={8} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
