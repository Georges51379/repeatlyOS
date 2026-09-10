import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download, Printer, TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react';
import Toast from '../../components/Toast';
import { useState } from 'react';
import { serviceData, staffData } from '../../data/mockData';
import { useDemo } from '../../context/DemoContext';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6'];
const RANGES = ['This Month', 'Last 3 Months', 'Last 6 Months', 'This Year'];

const retentionData = [
  { month:'Jan',rate:72 },{ month:'Feb',rate:75 },{ month:'Mar',rate:78 },
  { month:'Apr',rate:81 },{ month:'May',rate:83 },{ month:'Jun',rate:87 },
];

export default function ReportsPage() {
  const { business } = useDemo();
  const [toast, setToast] = useState('');
  const [range, setRange] = useState('This Month');
  const exportMsg = () => setToast('Report exported. No backend connected.');

  const ytd = business.revenueData.reduce((a, r) => a + r.revenue, 0);
  const avg = Math.round(ytd / 6);
  const last = business.revenueData.at(-1)?.revenue || 0;
  const prev = business.revenueData.at(-2)?.revenue || 1;
  const monthChange = Math.round(((last - prev) / prev) * 100);

  const insights = [
    { label: 'Revenue This Month', value: `$${last.toLocaleString()}`, trend: monthChange, icon: DollarSign, accent: 'emerald' },
    { label: 'Avg Monthly Revenue', value: `$${avg.toLocaleString()}`, trend: 12, icon: TrendingUp, accent: 'blue' },
    { label: 'Renewal Rate', value: '87%', trend: 5, icon: Users, accent: 'purple' },
    { label: 'Customer Retention', value: '91%', trend: 3, icon: TrendingUp, accent: 'cyan' },
  ] as const;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg">Reports & Analytics</h2>
          <p className="text-slate-500 text-sm">{business.name} — performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date range selector */}
          <div className="flex bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            {RANGES.map(r => (
              <button key={r} onClick={() => setRange(r)} className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${range === r ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>{r}</button>
            ))}
          </div>
          <button onClick={exportMsg} className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 px-3 py-2 rounded-lg transition-colors"><Download size={12} /> Export</button>
          <button onClick={exportMsg} className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 px-2.5 py-2 rounded-lg transition-colors"><Printer size={12} /></button>
        </div>
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {insights.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-500 text-xs font-medium">{k.label}</p>
                <Icon size={13} className="text-slate-600" />
              </div>
              <p className="text-white text-xl font-bold">{k.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {k.trend > 0 ? <TrendingUp size={11} className="text-emerald-400" /> : <TrendingDown size={11} className="text-red-400" />}
                <span className={`text-xs font-medium ${k.trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{k.trend > 0 ? '+' : ''}{k.trend}% vs last period</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={business.revenueData}>
              <defs>
                <linearGradient id="r1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #1e293b', borderRadius:8, fontSize:11 }} formatter={(v:unknown)=>[`$${(v as number).toLocaleString()}`,'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#r1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Monthly Bookings</h3>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={business.revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #1e293b', borderRadius:8, fontSize:11 }} />
              <Bar dataKey="bookings" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Bookings by Service</h3>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie data={serviceData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {serviceData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Legend formatter={v=><span style={{color:'#94a3b8',fontSize:11}}>{v}</span>} />
              <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #1e293b', borderRadius:8, fontSize:11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Customer Retention Rate</h3>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={retentionData}>
              <defs>
                <linearGradient id="ret" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[60,100]} tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} />
              <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #1e293b', borderRadius:8, fontSize:11 }} formatter={(v:unknown)=>[`${v as number}%`,'Retention']} />
              <Area type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} fill="url(#ret)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800"><h3 className="text-white font-semibold text-sm">Staff Performance</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-800">
              {['Staff Member','Total Tasks','Completed','Rate','Rating'].map(h=><th key={h} className="text-left text-slate-500 text-xs font-medium px-5 py-3">{h}</th>)}
            </tr></thead>
            <tbody>
              {staffData.map(s=>(
                <tr key={s.name} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                  <td className="px-5 py-3 text-slate-200 font-medium text-sm">{s.name}</td>
                  <td className="px-5 py-3 text-slate-400 text-sm">{s.tasks}</td>
                  <td className="px-5 py-3 text-emerald-400 text-sm font-medium">{s.completed}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-1.5 max-w-[80px]">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width:`${Math.round((s.completed/s.tasks)*100)}%` }} />
                      </div>
                      <span className="text-slate-400 text-xs">{Math.round((s.completed/s.tasks)*100)}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-amber-400 text-sm font-medium">⭐ {s.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800"><h3 className="text-white font-semibold text-sm">Best-Selling Packages</h3></div>
        <div className="p-5 space-y-3">
          {business.packages.map((p,i)=>{
            const pct = [100,72,48,25][i]||30;
            const sales = [42,28,18,10][i]||8;
            return (
              <div key={p.name} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300 text-xs font-medium">{p.name}</span>
                    <span className="text-slate-400 text-xs">{sales} sold · ${(p.price*sales).toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-700 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width:`${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Customer Lifetime Value */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">💎 Customer Lifetime Value (CLV)</h3>
          <span className="text-slate-500 text-xs">Top 10 by total spend</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead><tr className="border-b border-slate-800 bg-slate-900/60">
              {['Rank','Customer','Type','Total Spent','Avg per Visit','Status'].map(h=><th key={h} className="text-left text-slate-500 text-xs font-medium px-4 py-3">{h}</th>)}
            </tr></thead>
            <tbody>
              {business.customers.map((c) => {
                const myBookings = business.bookings.filter(b => b.customer === c.name && b.payment === 'Paid');
                const clv = myBookings.reduce((a,b) => a + b.amount, 0);
                const avg = myBookings.length > 0 ? Math.round(clv / myBookings.length) : 0;
                return { ...c, clv, avg, visits: myBookings.length };
              }).sort((a,b) => b.clv - a.clv).slice(0,10).map((c, rank) => {
                const medal = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank+1}`;
                return (
                  <tr key={c.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3 text-lg w-10">{medal}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold">{c.name[0]}</div>
                        <span className="text-slate-200 font-medium text-sm">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={`text-xs font-medium ${c.type === 'Subscription' ? 'text-cyan-400' : c.type === 'Package' ? 'text-purple-400' : 'text-slate-400'}`}>{c.type}</span></td>
                    <td className="px-4 py-3 text-emerald-400 font-black">${c.clv.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-400 text-sm">${c.avg}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-medium ${c.status === 'Active' ? 'text-emerald-400' : c.status === 'Expiring Soon' ? 'text-amber-400' : 'text-red-400'}`}>{c.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profit per Service */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800">
          <h3 className="text-white font-semibold text-sm">💡 Profit per Service (Revenue vs Cost)</h3>
        </div>
        <div className="p-5 space-y-3">
          {business.services.map((s, i) => {
            const cost = Math.round(s.price * [0.22, 0.28, 0.18, 0.25, 0.30][i % 5]);
            const profit = s.price - cost;
            const margin = Math.round((profit / s.price) * 100);
            const bookingCount = business.bookings.filter(b => b.service === s.name && b.payment === 'Paid').length;
            return (
              <div key={s.name} className="bg-slate-800/60 rounded-xl p-3.5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-slate-200 text-sm font-semibold">{s.name}</p>
                    <p className="text-slate-500 text-xs">{bookingCount} paid bookings · Cost: ${cost} · Revenue: ${s.price}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-black text-lg">{margin}%</p>
                    <p className="text-slate-500 text-xs">margin</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-700 rounded-full h-2.5 overflow-hidden flex">
                    <div className="h-2.5 bg-red-500/70" style={{ width: `${(cost / s.price) * 100}%` }} />
                    <div className="h-2.5 bg-emerald-500" style={{ width: `${margin}%` }} />
                  </div>
                  <div className="flex items-center gap-3 text-xs shrink-0">
                    <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded-full bg-red-500/70 inline-block"/>Cost</span>
                    <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/>Profit</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
