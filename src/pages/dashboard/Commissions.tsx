import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Star, Download, Settings2, Check } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../../components/StatCard';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { useDemo } from '../../context/DemoContext';

export default function CommissionsPage() {
  const { business } = useDemo();
  const [rates, setRates] = useState<Record<string, number>>(() => {
    const r: Record<string, number> = {};
    business.staff.forEach(s => { r[s] = 15; });
    return r;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [editRates, setEditRates] = useState<Record<string, string>>({});
  const [period, setPeriod] = useState<'week' | 'month'>('month');
  const [toast, setToast] = useState('');

  const commissions = useMemo(() => business.staff.map((name, i) => {
    const myBookings = business.bookings.filter(b => b.staff === name && b.payment === 'Paid');
    const revenue = myBookings.reduce((a, b) => a + b.amount, 0);
    const rate = rates[name] ?? 15;
    const commission = Math.round(revenue * (rate / 100));
    const tasks = business.tasks.filter(t => t.staff === name);
    const completed = tasks.filter(t => t.column === 'completed').length;
    return { name, revenue, rate, commission, bookings: myBookings.length, completed, tasks: tasks.length, index: i };
  }), [business, rates, period]);

  const totalRevenue    = commissions.reduce((a, c) => a + c.revenue, 0);
  const totalCommission = commissions.reduce((a, c) => a + c.commission, 0);
  const topEarner       = commissions.reduce((a, b) => a.commission > b.commission ? a : b, commissions[0]);

  const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'];

  const openSettings = () => {
    const r: Record<string, string> = {};
    business.staff.forEach(s => { r[s] = String(rates[s] ?? 15); });
    setEditRates(r);
    setShowSettings(true);
  };

  const saveRates = () => {
    const newRates: Record<string, number> = {};
    Object.entries(editRates).forEach(([name, val]) => { newRates[name] = Math.min(100, Math.max(0, Number(val) || 0)); });
    setRates(newRates);
    setShowSettings(false);
    setToast('Commission rates updated.');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <DollarSign size={18} className="text-emerald-400" /> Commission Tracker
          </h2>
          <p className="text-slate-500 text-sm">Automatic payroll calculations for {business.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period toggle */}
          <div className="flex bg-slate-800 border border-slate-700 rounded-lg overflow-hidden text-xs">
            <button onClick={() => setPeriod('week')}  className={`px-3 py-1.5 font-medium transition-colors ${period === 'week'  ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Week</button>
            <button onClick={() => setPeriod('month')} className={`px-3 py-1.5 font-medium transition-colors ${period === 'month' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Month</button>
          </div>
          <button onClick={openSettings} className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 px-3 py-2 rounded-lg transition-colors">
            <Settings2 size={12} /> Rates
          </button>
          <button onClick={() => setToast('Payroll report exported. Demo only.')} className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 px-3 py-2 rounded-lg transition-colors">
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} accent="blue" />
        <StatCard title="Total Commissions" value={`$${totalCommission.toLocaleString()}`} icon={TrendingUp} accent="emerald" />
        <StatCard title="Top Earner" value={topEarner?.name || '—'} icon={Star} accent="amber" />
        <StatCard title="Avg Commission Rate" value={`${Math.round(Object.values(rates).reduce((a, r) => a + r, 0) / Math.max(Object.values(rates).length, 1))}%`} icon={TrendingUp} accent="purple" />
      </div>

      {/* Bar chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-white font-semibold text-sm mb-4">Revenue & Commission by Staff</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={commissions} margin={{ left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, fontSize: 11 }} formatter={(v: unknown) => [`$${v}`, '']} />
            <Bar dataKey="revenue"    name="Revenue"    fill="#3b82f6" radius={[6,6,0,0]} />
            <Bar dataKey="commission" name="Commission" fill="#10b981" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Staff commission cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {commissions.map(s => (
          <div key={s.name} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-black shadow-lg`} style={{ backgroundColor: colors[s.index % colors.length] }}>
                {s.name[0]}
              </div>
              <div>
                <p className="text-white font-bold">{s.name}</p>
                <p className="text-slate-500 text-xs">{s.bookings} paid bookings · {s.completed}/{s.tasks} tasks done</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-emerald-400 font-black text-xl">${s.commission}</p>
                <p className="text-slate-500 text-xs">commission</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: 'Revenue', value: `$${s.revenue}`, color: 'text-blue-400' },
                { label: 'Rate', value: `${s.rate}%`, color: 'text-purple-400' },
                { label: 'Commission', value: `$${s.commission}`, color: 'text-emerald-400' },
              ].map(m => (
                <div key={m.label} className="bg-slate-800 rounded-xl p-2.5 text-center">
                  <p className={`font-bold text-sm ${m.color}`}>{m.value}</p>
                  <p className="text-slate-500 text-xs">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Commission bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Commission share</span>
                <span className="text-slate-400">{totalCommission > 0 ? Math.round((s.commission / totalCommission) * 100) : 0}% of total</span>
              </div>
              <div className="bg-slate-800 rounded-full h-2">
                <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${totalCommission > 0 ? (s.commission / totalCommission) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payroll summary */}
      <div className="bg-gradient-to-r from-emerald-600/10 to-transparent border border-emerald-500/20 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Payroll Summary — {period === 'week' ? 'This Week' : 'This Month'}</h3>
          <span className="text-xs text-slate-500 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg">Demo · Not submitted</span>
        </div>
        <div className="space-y-2">
          {commissions.map(s => (
            <div key={s.name} className="flex items-center justify-between bg-slate-900/60 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: colors[s.index % colors.length] + '80' }}>
                  {s.name[0]}
                </div>
                <span className="text-slate-300 text-sm">{s.name}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-500 text-xs">{s.rate}% of ${s.revenue}</span>
                <span className="text-emerald-400 font-bold">${s.commission}</span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3 mt-1 border border-slate-700">
            <span className="text-white font-semibold">Total Payroll</span>
            <span className="text-emerald-400 font-black text-lg">${totalCommission.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Rate settings modal */}
      {showSettings && (
        <Modal title="Commission Rates" onClose={() => setShowSettings(false)} size="sm" icon={<Settings2 size={15} className="text-blue-400" />}>
          <div className="space-y-3">
            <p className="text-slate-500 text-xs">Set the percentage commission each staff member earns on paid bookings.</p>
            {business.staff.map(s => (
              <div key={s} className="flex items-center justify-between bg-slate-800 rounded-xl px-3 py-2.5 gap-3">
                <span className="text-slate-200 text-sm font-medium flex-1">{s}</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0" max="100"
                    value={editRates[s] ?? '15'}
                    onChange={e => setEditRates(r => ({ ...r, [s]: e.target.value }))}
                    className="w-16 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <span className="text-slate-400 text-sm">%</span>
                </div>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowSettings(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={saveRates} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                <Check size={14} /> Save Rates
              </button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
