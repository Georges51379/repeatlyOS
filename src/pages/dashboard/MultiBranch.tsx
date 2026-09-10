import { useState } from 'react';
import { MapPin, TrendingUp, TrendingDown, Users, DollarSign, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../../components/StatCard';
import { useDemo } from '../../context/DemoContext';

const branches = [
  { name: 'Beirut — Main Branch', area: 'Hamra', revenue: 8420, customers: 126, bookings: 18, trend: 8, staff: 4, status: 'Excellent' },
  { name: 'Jounieh Branch', area: 'Kaslik', revenue: 5240, customers: 84, bookings: 12, trend: 4, staff: 3, status: 'Good' },
  { name: 'Tripoli Branch', area: 'Mina', revenue: 3180, customers: 52, bookings: 7, trend: -2, staff: 2, status: 'Needs Attention' },
  { name: 'Saida Branch', area: 'Downtown', revenue: 4560, customers: 68, bookings: 9, trend: 6, staff: 2, status: 'Good' },
];

const statusColor: Record<string, string> = {
  'Excellent': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  'Good': 'text-blue-400 bg-blue-500/10 border-blue-500/25',
  'Needs Attention': 'text-amber-400 bg-amber-500/10 border-amber-500/25',
};

export default function MultiBranchPage() {
  const { business } = useDemo();
  const [selected, setSelected] = useState<string | null>(null);

  const totalRevenue = branches.reduce((a, b) => a + b.revenue, 0);
  const totalCustomers = branches.reduce((a, b) => a + b.customers, 0);
  const totalStaff = branches.reduce((a, b) => a + b.staff, 0);

  const chartData = branches.map(b => ({ name: b.name.split(' — ')[0].split(' ')[0], revenue: b.revenue }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            Multi-Branch Overview
            <span className="bg-purple-500/15 text-purple-400 border border-purple-500/25 text-xs px-2 py-0.5 rounded-full font-medium">Enterprise</span>
          </h2>
          <p className="text-slate-500 text-sm">{branches.length} locations · {business.name} Group</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} accent="emerald" trend="+6% all branches" trendUp />
        <StatCard title="Total Customers" value={totalCustomers} icon={Users} accent="blue" />
        <StatCard title="Locations" value={branches.length} icon={MapPin} accent="purple" />
        <StatCard title="Total Staff" value={totalStaff} icon={Users} accent="amber" />
      </div>

      {/* Revenue by branch chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-white font-semibold text-sm mb-4">Revenue by Branch</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }} formatter={(v: unknown) => [`$${(v as number).toLocaleString()}`, 'Revenue']} />
            <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
              {chartData.map((_, i) => <Bar key={i} dataKey="revenue" fill={['#3b82f6','#10b981','#f59e0b','#8b5cf6'][i % 4]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Branch cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {branches.map(b => (
          <button
            key={b.name}
            onClick={() => setSelected(b.name === selected ? null : b.name)}
            className={`text-left bg-slate-900 border rounded-xl p-5 transition-all hover:border-slate-700 ${selected === b.name ? 'border-blue-500 bg-blue-600/5' : 'border-slate-800'}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                  <MapPin size={15} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{b.name}</p>
                  <p className="text-slate-500 text-xs">{b.area}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${statusColor[b.status]}`}>{b.status}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-slate-800 rounded-lg px-2 py-2 text-center">
                <p className="text-white font-bold text-sm">${(b.revenue/1000).toFixed(1)}k</p>
                <p className="text-slate-500 text-xs mt-0.5">Revenue</p>
              </div>
              <div className="bg-slate-800 rounded-lg px-2 py-2 text-center">
                <p className="text-white font-bold text-sm">{b.customers}</p>
                <p className="text-slate-500 text-xs mt-0.5">Customers</p>
              </div>
              <div className="bg-slate-800 rounded-lg px-2 py-2 text-center">
                <p className="text-white font-bold text-sm">{b.staff}</p>
                <p className="text-slate-500 text-xs mt-0.5">Staff</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {b.trend > 0 ? <TrendingUp size={12} className="text-emerald-400" /> : <TrendingDown size={12} className="text-red-400" />}
                <span className={`text-xs font-medium ${b.trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{b.trend > 0 ? '+' : ''}{b.trend}% this month</span>
              </div>
              <span className="text-slate-500 text-xs">{b.bookings} bookings today</span>
            </div>
          </button>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-purple-600/10 to-transparent border border-purple-500/20 rounded-xl p-5 flex items-center gap-4">
        <div className="text-3xl">🏢</div>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">Manage all your branches from one account</p>
          <p className="text-slate-400 text-xs mt-0.5">Centralized reporting, cross-branch staff management, and consolidated billing — available on the Enterprise plan.</p>
        </div>
        <button className="shrink-0 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5">
          Learn more <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
