import { useState, useEffect } from 'react';
import { Calendar, RefreshCw, AlertCircle, CreditCard, Package, TrendingUp, Bell, CheckCircle, ArrowRight, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import Toast from '../../components/Toast';
import OnboardingChecklist from '../../components/OnboardingChecklist';
import DailyBriefing from '../../components/DailyBriefing';
import { useDemo } from '../../context/DemoContext';

const PIE_COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6'];

const actColor: Record<string,string> = {
  booking:'bg-blue-500', package:'bg-purple-500',
  payment:'bg-emerald-500', reminder:'bg-amber-500', subscription:'bg-cyan-500', task:'bg-slate-500',
};

const quickActions = [
  { label:'New Booking',    icon:'📅', to:'/dashboard/bookings',     color:'bg-blue-600/15 border-blue-500/25 hover:bg-blue-600/25' },
  { label:'Send Broadcast', icon:'📢', to:'/dashboard/broadcast',    color:'bg-green-600/15 border-green-500/25 hover:bg-green-600/25' },
  { label:'Mark Payment',   icon:'💵', to:'/dashboard/payments',     color:'bg-emerald-600/15 border-emerald-500/25 hover:bg-emerald-600/25' },
  { label:'Sell Product',   icon:'🛍️', to:'/dashboard/products',     color:'bg-orange-600/15 border-orange-500/25 hover:bg-orange-600/25' },
  { label:'View Forecast',  icon:'📈', to:'/dashboard/forecast',     color:'bg-purple-600/15 border-purple-500/25 hover:bg-purple-600/25' },
  { label:'Expenses',       icon:'📉', to:'/dashboard/expenses',     color:'bg-red-600/15 border-red-500/25 hover:bg-red-600/25' },
];

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <div className="text-right">
      <p className="text-white font-bold text-lg font-mono tabular-nums">{time.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}</p>
      <p className="text-slate-500 text-xs">{time.toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' })}</p>
    </div>
  );
}

export default function DashboardOverview() {
  const { business } = useDemo();
  const { kpis, bookings, customers, revenueData } = business;
  const [toast, setToast] = useState('');
  const [completedIds, setCompletedIds] = useState<number[]>([]);

  const upcoming = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Pending').slice(0, 5);
  const unpaid = customers.filter(c => c.balance < 0);
  const lowStockProducts = business.products.filter(p => p.stock <= p.lowStockAt);
  const expiring = customers.filter(c => c.status === 'Expiring Soon');

  const serviceData = business.services.slice(0,4).map((s,i) => ({ name: s.name, value: [38,28,20,14][i] || 10 }));

  const activity = [
    { time:'11:45', text:`${customers[0]?.name} — ${business.services[0]?.name}`, type:'booking' },
    { time:'10:22', text:`Reminder sent to ${customers[2]?.name}`, type:'reminder' },
    { time:'10:05', text:`Payment received — ${customers[5]?.name || customers[0]?.name}`, type:'payment' },
    { time:'09:30', text:`Session consumed — ${customers[1]?.name}`, type:'package' },
    { time:'09:12', text:`${customers[0]?.name} checked in`, type:'booking' },
    { time:'08:55', text:`${customers[3]?.name} subscription renewed`, type:'subscription' },
  ];

  const markComplete = (id: number) => {
    setCompletedIds(p => [...p, id]);
    setToast('Booking marked as completed.');
  };

  return (
    <div className="space-y-5">
      <DailyBriefing />
      <OnboardingChecklist />
      {/* Top row: KPIs + Clock */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-white font-bold text-lg">{business.name}</h2>
          <p className="text-slate-500 text-sm">{business.category} · Live dashboard</p>
        </div>
        <LiveClock />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard title="Today's Bookings" value={kpis.todayBookings} icon={Calendar} trend="+3 vs yesterday" trendUp accent="blue" />
        <StatCard title="Active Subscriptions" value={kpis.activeSubscriptions} icon={RefreshCw} trend="+5 this month" trendUp accent="emerald" />
        <StatCard title="Expiring This Week" value={kpis.expiringThisWeek} icon={AlertCircle} trend="Needs attention" accent="amber" />
        <StatCard title="Unpaid Customers" value={kpis.unpaidCustomers} icon={CreditCard} trend="Outstanding" accent="red" />
        <StatCard title="Revenue This Month" value={`$${kpis.revenueThisMonth.toLocaleString()}`} icon={TrendingUp} trend="↑ 8% vs last month" trendUp accent="emerald" />
        <StatCard title={kpis.sessionsRemaining > 0 ? 'Sessions Remaining' : 'Active Contracts'} value={kpis.sessionsRemaining > 0 ? kpis.sessionsRemaining : kpis.activeSubscriptions} icon={Package} trend="Across packages" accent="purple" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {quickActions.map(a => (
          <Link key={a.label} to={a.to} className={`flex items-center gap-2.5 border rounded-xl px-4 py-3 transition-all ${a.color}`}>
            <span className="text-xl">{a.icon}</span>
            <span className="text-slate-200 text-sm font-medium">{a.label}</span>
            <ArrowRight size={13} className="text-slate-500 ml-auto" />
          </Link>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-sm">Revenue Overview</h3>
              <p className="text-slate-500 text-xs mt-0.5">{business.name} — 2024</p>
            </div>
            <span className="text-emerald-400 text-xs font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">↑ 8% this month</span>
          </div>
          <ResponsiveContainer width="100%" height={185}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
              <XAxis dataKey="month" tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
              <Tooltip contentStyle={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:8,color:'#e2e8f0',fontSize:11}} formatter={(v:unknown)=>[`$${(v as number).toLocaleString()}`,'Revenue']}/>
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#rev)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-1">Services Breakdown</h3>
          <p className="text-slate-500 text-xs mb-3">Bookings by service</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={serviceData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                {serviceData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:8,fontSize:11}}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {serviceData.map((s,i)=>(
              <div key={s.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:PIE_COLORS[i%PIE_COLORS.length]}}/>
                <span className="text-slate-400 text-xs flex-1 truncate">{s.name}</span>
                <span className="text-slate-300 text-xs font-medium">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row — three columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming bookings */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2"><Clock size={13} className="text-blue-400"/> Upcoming</h3>
            <Link to="/dashboard/bookings" className="text-blue-400 text-xs hover:text-blue-300">View all →</Link>
          </div>
          <div className="divide-y divide-slate-800/50">
            {upcoming.map(b => (
              <div key={b.id} className={`px-4 py-2.5 flex items-center gap-2.5 hover:bg-slate-800/20 transition-colors ${completedIds.includes(b.id) ? 'opacity-50' : ''}`}>
                <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">{b.customer[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-xs font-medium truncate">{b.customer}</p>
                  <p className="text-slate-500 text-xs">{b.service} · {b.time}</p>
                </div>
                {completedIds.includes(b.id)
                  ? <CheckCircle size={13} className="text-emerald-400 shrink-0"/>
                  : <button onClick={() => markComplete(b.id)} className="shrink-0 text-xs text-slate-500 hover:text-emerald-400 bg-slate-800 hover:bg-emerald-500/10 px-2 py-0.5 rounded transition-colors">Done</button>
                }
              </div>
            ))}
            {upcoming.length === 0 && <div className="px-4 py-8 text-center text-slate-600 text-xs">No upcoming bookings</div>}
          </div>
        </div>

        {/* Expiring subscriptions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2"><AlertCircle size={13} className="text-amber-400"/> Expiring Soon</h3>
            <Link to="/dashboard/subscriptions" className="text-blue-400 text-xs hover:text-blue-300">View all →</Link>
          </div>
          <div className="divide-y divide-slate-800/50">
            {expiring.length > 0 ? expiring.map(c => (
              <div key={c.id} className="px-4 py-2.5 flex items-center gap-2.5 hover:bg-slate-800/20 transition-colors">
                <div className="w-6 h-6 rounded-full bg-amber-600/20 flex items-center justify-center text-amber-400 text-xs font-bold shrink-0">{c.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-xs font-medium truncate">{c.name}</p>
                  <p className="text-slate-500 text-xs truncate">{c.plan}</p>
                </div>
                <button onClick={() => setToast(`Reminder sent to ${c.name}. Demo only.`)} className="shrink-0">
                  <Bell size={13} className="text-slate-500 hover:text-amber-400 transition-colors"/>
                </button>
              </div>
            )) : (
              <div className="px-4 py-8 text-center">
                <CheckCircle size={20} className="text-emerald-400 mx-auto mb-1"/>
                <p className="text-slate-500 text-xs">All subscriptions healthy</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800">
            <h3 className="text-white font-semibold text-sm">Live Activity</h3>
            <Link to="/dashboard/activity" className="text-blue-400 text-xs hover:text-blue-300">Full log →</Link>
          </div>
          <div className="p-3 space-y-2.5">
            {activity.map((a,i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${actColor[a.type]}`}/>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-300 text-xs leading-snug">{a.text}</p>
                  <p className="text-slate-600 text-xs mt-0.5 font-mono">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Unpaid customers alert banner */}
      {unpaid.length > 0 && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4 flex items-center gap-4">
          <div className="w-9 h-9 bg-red-500/15 rounded-lg flex items-center justify-center shrink-0">
            <CreditCard size={16} className="text-red-400"/>
          </div>
          <div className="flex-1">
            <p className="text-red-400 font-semibold text-sm">{unpaid.length} customers have outstanding balances</p>
            <p className="text-slate-400 text-xs mt-0.5">Total: ${unpaid.reduce((a,c) => a + Math.abs(c.balance), 0)} overdue · Send reminders to recover revenue</p>
          </div>
          <Link to="/dashboard/payments" className="shrink-0 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-xs font-medium px-3 py-2 rounded-lg transition-colors">
            View →
          </Link>
        </div>
      )}

      {/* Low stock products banner */}
      {lowStockProducts.length > 0 && (
        <div className="bg-orange-500/8 border border-orange-500/20 rounded-xl p-4 flex items-center gap-4">
          <div className="w-9 h-9 bg-orange-500/15 rounded-lg flex items-center justify-center shrink-0">
            <Package size={16} className="text-orange-400"/>
          </div>
          <div className="flex-1">
            <p className="text-orange-400 font-semibold text-sm">{lowStockProducts.length} products are low or out of stock</p>
            <p className="text-slate-400 text-xs mt-0.5">{lowStockProducts.slice(0,3).map(p => p.name).join(', ')}{lowStockProducts.length > 3 ? ` +${lowStockProducts.length - 3} more` : ''}</p>
          </div>
          <Link to="/dashboard/inventory" className="shrink-0 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-400 text-xs font-medium px-3 py-2 rounded-lg transition-colors">
            Restock →
          </Link>
        </div>
      )}

      {/* New features spotlight */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      {/* At-Risk Customers Alert */}
      {(() => {
        const atRisk = business.customers.filter(c => {
          const daysSince = Math.floor((new Date('2024-06-11').getTime() - new Date(c.lastVisit || '2024-01-01').getTime()) / 86400000);
          return daysSince > 21 || c.balance < 0 || c.status === 'Expiring Soon';
        });
        if (atRisk.length === 0) return null;
        return (
          <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-red-400 font-bold text-sm flex items-center gap-2">
                ⚠️ {atRisk.length} customer{atRisk.length > 1 ? 's' : ''} at churn risk
              </p>
              <Link to="/dashboard/customers" className="text-xs text-red-400 hover:text-red-300 bg-red-500/15 border border-red-500/25 px-2.5 py-1 rounded-lg transition-colors">View all →</Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {atRisk.slice(0, 6).map(c => (
                <div key={c.id} className="flex items-center gap-1.5 bg-slate-900 border border-red-500/20 rounded-lg px-2.5 py-1.5">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xs font-bold">{c.name[0]}</div>
                  <span className="text-slate-300 text-xs">{c.name.split(' ')[0]}</span>
                  <span className="text-red-400 text-xs">·</span>
                  <span className="text-slate-500 text-xs">{c.status === 'Expiring Soon' ? 'Expiring' : c.balance < 0 ? 'Unpaid' : 'Inactive'}</span>
                </div>
              ))}
              {atRisk.length > 6 && <span className="text-slate-600 text-xs self-center">+{atRisk.length - 6} more</span>}
            </div>
          </div>
        );
      })()}

        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">Business Intelligence Tools</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { emoji:'💚', label:'Health Score',  sub:'Live business score',    to:'/dashboard/health',      highlight: true },
            { emoji:'🎯', label:'Goals',         sub:'Monthly targets',        to:'/dashboard/goals',       highlight: true },
            { emoji:'🔥', label:'Heatmap',       sub:'Busiest days visual',    to:'/dashboard/heatmap' },
            { emoji:'🤝', label:'Referrals',     sub:'Who brought who',        to:'/dashboard/referrals' },
            { emoji:'📢', label:'Broadcast',     sub:'WhatsApp segments',      to:'/dashboard/broadcast' },
            { emoji:'📈', label:'Forecast',      sub:'30-day projection',      to:'/dashboard/forecast' },
            { emoji:'💰', label:'Commissions',   sub:'Staff payroll auto',     to:'/dashboard/commissions' },
            { emoji:'📉', label:'Expenses',      sub:'Profit & loss view',     to:'/dashboard/expenses' },
            { emoji:'🎂', label:'Occasions',     sub:'Birthdays + anniv.',     to:'/dashboard/occasions' },
            { emoji:'⏳', label:'Waitlist',      sub:'Turn cancels → revenue', to:'/dashboard/waitlist' },
            { emoji:'⚡', label:'Reorder',       sub:'Smart stock alerts',     to:'/dashboard/reorder' },
            { emoji:'🏢', label:'Multi-Branch',  sub:'Enterprise view',        to:'/dashboard/branches' },
          ].map(f => (
            <Link key={f.to} to={f.to} className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 transition-all group hover:scale-[1.02] ${'highlight' in f && f.highlight ? 'bg-blue-600/10 border-blue-500/25 hover:bg-blue-600/15' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-slate-600'}`}>
              <span className="text-lg shrink-0">{f.emoji}</span>
              <div className="min-w-0">
                <p className={`text-xs font-semibold truncate ${'highlight' in f && f.highlight ? 'text-blue-300' : 'text-slate-200'}`}>{f.label}</p>
                <p className="text-slate-500 text-xs truncate">{f.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')}/>}
    </div>
  );
}
