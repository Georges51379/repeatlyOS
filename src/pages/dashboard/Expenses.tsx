import { useState, useMemo } from 'react';
import { DollarSign, TrendingDown, TrendingUp, Plus, Trash2, Download, PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import StatCard from '../../components/StatCard';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import StatusBadge from '../../components/StatusBadge';
import { useDemo } from '../../context/DemoContext';

type Expense = { id: number; date: string; category: string; description: string; amount: number; recurring: boolean };

const CATEGORIES = ['Rent', 'Staff Salaries', 'Supplies', 'Utilities', 'Marketing', 'Equipment', 'Transport', 'Other'];
const CAT_COLORS: Record<string, string> = {
  'Rent': '#3b82f6', 'Staff Salaries': '#8b5cf6', 'Supplies': '#f59e0b',
  'Utilities': '#06b6d4', 'Marketing': '#ec4899', 'Equipment': '#10b981', 'Transport': '#f97316', 'Other': '#64748b',
};

const SEED_EXPENSES: Expense[] = [
  { id: 1, date: '2024-06-01', category: 'Rent',           description: 'Monthly shop/office rent',      amount: 800, recurring: true  },
  { id: 2, date: '2024-06-01', category: 'Staff Salaries', description: 'Staff salaries — June',         amount: 1200, recurring: true  },
  { id: 3, date: '2024-06-05', category: 'Supplies',       description: 'Cleaning & maintenance supplies',amount: 150, recurring: false },
  { id: 4, date: '2024-06-07', category: 'Utilities',      description: 'Electricity & water',           amount: 95,  recurring: true  },
  { id: 5, date: '2024-06-09', category: 'Marketing',      description: 'Instagram ad campaign',         amount: 60,  recurring: false },
  { id: 6, date: '2024-06-10', category: 'Transport',      description: 'Fuel & delivery costs',         amount: 45,  recurring: false },
];

export default function ExpensesPage() {
  const { business } = useDemo();
  const [expenses, setExpenses] = useState<Expense[]>(SEED_EXPENSES);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState('');
  const [period, setPeriod] = useState<'month' | 'year'>('month');
  const [form, setForm] = useState({ category: 'Rent', description: '', amount: '', recurring: false, date: '2024-06-11' });

  const revenue = useMemo(() => business.revenueData.at(-1)?.revenue || 0, [business]);
  const totalExpenses = useMemo(() => expenses.reduce((a, e) => a + e.amount, 0), [expenses]);
  const profit = revenue - totalExpenses;
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  const monthlyComparison = [
    { month: 'Jan', revenue: business.revenueData[0]?.revenue || 0, expenses: Math.round((business.revenueData[0]?.revenue || 0) * 0.55) },
    { month: 'Feb', revenue: business.revenueData[1]?.revenue || 0, expenses: Math.round((business.revenueData[1]?.revenue || 0) * 0.52) },
    { month: 'Mar', revenue: business.revenueData[2]?.revenue || 0, expenses: Math.round((business.revenueData[2]?.revenue || 0) * 0.50) },
    { month: 'Apr', revenue: business.revenueData[3]?.revenue || 0, expenses: Math.round((business.revenueData[3]?.revenue || 0) * 0.48) },
    { month: 'May', revenue: business.revenueData[4]?.revenue || 0, expenses: Math.round((business.revenueData[4]?.revenue || 0) * 0.47) },
    { month: 'Jun', revenue, expenses: totalExpenses },
  ];

  const addExpense = () => {
    if (!form.description || !form.amount) { setToast('Please fill in description and amount.'); return; }
    setExpenses(prev => [{ id: prev.length + 1, ...form, amount: Number(form.amount) }, ...prev]);
    setShowAdd(false);
    setForm({ category: 'Rent', description: '', amount: '', recurring: false, date: '2024-06-11' });
    setToast('Expense added.');
  };

  const deleteExpense = (id: number) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    setToast('Expense removed.');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <TrendingDown size={18} className="text-red-400" /> Expense Tracker
          </h2>
          <p className="text-slate-500 text-sm">Revenue vs expenses · Real profit view for {business.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 border border-slate-700 rounded-lg overflow-hidden text-xs">
            <button onClick={() => setPeriod('month')} className={`px-3 py-1.5 font-medium transition-colors ${period === 'month' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Month</button>
            <button onClick={() => setPeriod('year')}  className={`px-3 py-1.5 font-medium transition-colors ${period === 'year'  ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Year</button>
          </div>
          <button onClick={() => setToast('Report exported. Demo only.')} className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 px-3 py-2 rounded-lg transition-colors">
            <Download size={12} /> Export
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
            <Plus size={14} /> Add Expense
          </button>
        </div>
      </div>

      {/* P&L summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Revenue" value={`$${revenue.toLocaleString()}`} icon={TrendingUp} accent="emerald" />
        <StatCard title="Total Expenses" value={`$${totalExpenses.toLocaleString()}`} icon={TrendingDown} accent="red" />
        <StatCard title="Net Profit" value={`$${profit.toLocaleString()}`} icon={DollarSign} accent={profit >= 0 ? 'blue' : 'red'} />
        <StatCard title="Profit Margin" value={`${margin}%`} icon={PieIcon} accent={margin >= 40 ? 'emerald' : margin >= 20 ? 'amber' : 'red'} trend={margin >= 40 ? 'Healthy' : margin >= 20 ? 'Moderate' : 'Tight'} trendUp={margin >= 30} />
      </div>

      {/* P&L highlight banner */}
      <div className={`border rounded-2xl p-4 flex items-center gap-4 ${profit >= 0 ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-red-500/8 border-red-500/20'}`}>
        <div className={`text-3xl`}>{profit >= 0 ? '📈' : '📉'}</div>
        <div className="flex-1">
          <p className={`font-bold text-sm ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {profit >= 0 ? `You\'re profitable this month — $${profit.toLocaleString()} net profit` : `Expenses exceed revenue by $${Math.abs(profit).toLocaleString()} this month`}
          </p>
          <p className="text-slate-400 text-xs mt-0.5">
            Expenses are {Math.round((totalExpenses / Math.max(revenue, 1)) * 100)}% of revenue · Profit margin: {margin}%
          </p>
        </div>
        {profit >= 0 && <div className="text-emerald-400 font-black text-2xl">${profit.toLocaleString()}</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Expense by category donut */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">By Category</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={byCategory} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                {byCategory.map((c, i) => <Cell key={i} fill={CAT_COLORS[c.name] || '#64748b'} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }} formatter={(v: unknown) => [`$${v}`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {byCategory.map(c => (
              <div key={c.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CAT_COLORS[c.name] || '#64748b' }} />
                <span className="text-slate-400 text-xs flex-1 truncate">{c.name}</span>
                <span className="text-slate-300 text-xs font-medium">${c.value}</span>
                <span className="text-slate-600 text-xs">{Math.round((c.value / totalExpenses) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue vs Expenses chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Revenue vs Expenses — 6 Months</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, fontSize: 11 }} formatter={(v: unknown) => [`$${v}`, '']} />
              <Bar dataKey="revenue"  name="Revenue"  fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense list */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Expense Log — June 2024</h3>
          <p className="text-slate-500 text-xs">{expenses.length} entries · ${totalExpenses.toLocaleString()} total</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[580px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                {['Date', 'Category', 'Description', 'Type', 'Amount', ''].map(h => (
                  <th key={h} className="text-left text-slate-500 text-xs font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                  <td className="px-4 py-3 text-slate-500 text-xs">{e.date}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: CAT_COLORS[e.category] || '#94a3b8' }}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CAT_COLORS[e.category] || '#64748b' }} />
                      {e.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{e.description}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={e.recurring ? 'Active' : 'Completed'} />
                  </td>
                  <td className="px-4 py-3 text-red-400 font-bold text-sm">-${e.amount}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteExpense(e.id)} className="text-slate-600 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-700">
                <td colSpan={4} className="px-4 py-3 text-slate-400 text-sm font-semibold">Total Expenses</td>
                <td className="px-4 py-3 text-red-400 font-black text-base">-${totalExpenses.toLocaleString()}</td>
                <td />
              </tr>
              <tr className="bg-slate-800/40">
                <td colSpan={4} className="px-4 py-3 text-white text-sm font-bold">Net Profit</td>
                <td className={`px-4 py-3 font-black text-base ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>${profit.toLocaleString()}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {showAdd && (
        <Modal title="Add Expense" onClose={() => setShowAdd(false)} icon={<TrendingDown size={15} className="text-red-400" />}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Amount ($) *</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Description *</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Monthly rent, supplier invoice..." className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.recurring} onChange={e => setForm(f => ({ ...f, recurring: e.target.checked }))} className="rounded border-slate-600 bg-slate-800 text-blue-600" />
                  <span className="text-slate-300 text-sm">Recurring monthly</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={addExpense} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">Add Expense</button>
            </div>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
