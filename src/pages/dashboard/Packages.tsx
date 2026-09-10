import { useState, useEffect } from 'react';
import { Package, TrendingDown, Clock, AlertTriangle, Plus, Search, RefreshCw, CheckCircle } from 'lucide-react';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { useDemo } from '../../context/DemoContext';

type Pkg = { id:number; customer:string; packageName:string; total:number; used:number; remaining:number; expiry:string; status:string; price:number; };

export default function PackagesPage() {
  const { business } = useDemo();
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [confirmRenew, setConfirmRenew] = useState<Pkg | null>(null);
  const [form, setForm] = useState({ customer: '', packageId: 0, expiry: '' });

  const build = (): Pkg[] => [
    ...business.packages.map((p, i) => ({
      id: i + 1,
      customer: business.customers[i % business.customers.length]?.name || 'Customer',
      packageName: p.name, total: p.sessions,
      used: [Math.floor(p.sessions * 0.6), Math.floor(p.sessions * 0.25), Math.floor(p.sessions * 0.8)][i % 3],
      remaining: [Math.ceil(p.sessions * 0.4), Math.ceil(p.sessions * 0.75), Math.ceil(p.sessions * 0.2)][i % 3],
      expiry: ['2024-07-15', '2024-06-30', '2024-08-01'][i % 3],
      status: i % 3 === 1 ? 'Expiring Soon' : i % 3 === 2 ? 'Low Sessions' : 'Active',
      price: p.price,
    })),
    ...business.packages.slice(0,2).map((p,i) => ({
      id: i + business.packages.length + 1,
      customer: business.customers[(i + 3) % business.customers.length]?.name || 'Customer',
      packageName: p.name, total: p.sessions,
      used: Math.floor(p.sessions * 0.5), remaining: Math.ceil(p.sessions * 0.5),
      expiry: '2024-07-30', status: 'Active', price: p.price,
    })),
  ];

  const [packages, setPackages] = useState<Pkg[]>(build);
  useEffect(() => { setPackages(build()); }, [business.key]);

  const filtered = packages.filter(p =>
    search === '' || p.customer.toLowerCase().includes(search.toLowerCase()) || p.packageName.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    active: packages.filter(p => p.status === 'Active').length,
    used: packages.reduce((a, p) => a + p.used, 0),
    remaining: packages.reduce((a, p) => a + p.remaining, 0),
    expiring: packages.filter(p => p.status === 'Expiring Soon').length,
  };

  const consume = (id: number) => {
    setPackages(prev => prev.map(p => {
      if (p.id !== id) return p;
      if (p.remaining <= 0) { setToast('No sessions remaining in this package.'); return p; }
      const upd = { ...p, used: p.used + 1, remaining: p.remaining - 1 };
      if (upd.remaining === 0) upd.status = 'Expiring Soon';
      else if (upd.remaining <= Math.ceil(p.total * 0.25)) upd.status = 'Low Sessions';
      setToast(`Session consumed for ${p.customer}. ${upd.remaining} session${upd.remaining !== 1 ? 's' : ''} remaining.`);
      return upd;
    }));
  };

  const doRenew = () => {
    if (!confirmRenew) return;
    setPackages(prev => prev.map(p => p.id === confirmRenew.id ? { ...p, used: 0, remaining: p.total, status: 'Active', expiry: '2024-08-31' } : p));
    setToast(`Package renewed for ${confirmRenew.customer}. Sessions reset to ${confirmRenew.total}.`);
    setConfirmRenew(null);
  };

  const addPackage = () => {
    if (!form.customer || !form.packageId) { setToast('Select a customer and package.'); return; }
    const pkg = business.packages.find(p => p.sessions === form.packageId);
    if (!pkg) return;
    const newPkg: Pkg = { id: packages.length + 1, customer: form.customer, packageName: pkg.name, total: pkg.sessions, used: 0, remaining: pkg.sessions, expiry: form.expiry || '2024-08-31', status: 'Active', price: pkg.price };
    setPackages(prev => [newPkg, ...prev]);
    setShowAdd(false);
    setForm({ customer: '', packageId: 0, expiry: '' });
    setToast(`Package assigned to ${form.customer}.`);
  };

  const statusColor = (s: string) => s === 'Active' ? 'bg-emerald-500' : s === 'Expiring Soon' ? 'bg-amber-500' : s === 'Low Sessions' ? 'bg-orange-500' : 'bg-red-500';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg">Packages</h2>
          <p className="text-slate-500 text-sm">Session balance tracking · {business.name}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
          <Plus size={14} /> Assign Package
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Active Packages" value={stats.active} icon={Package} accent="blue" />
        <StatCard title="Sessions Used" value={stats.used} icon={TrendingDown} accent="purple" />
        <StatCard title="Sessions Remaining" value={stats.remaining} icon={Clock} accent="emerald" />
        <StatCard title="Expiring Soon" value={stats.expiring} icon={AlertTriangle} accent="amber" />
      </div>

      <div className="relative max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer or package..." className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Package Tracker</h3>
          <p className="text-slate-500 text-xs">{filtered.length} packages</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                {['Customer','Package','Sessions Left','Progress','Expiry','Status','Actions'].map(h => (
                  <th key={h} className="text-left text-slate-500 text-xs font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const pct = p.total > 0 ? (p.remaining / p.total) * 100 : 0;
                return (
                  <tr key={p.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">{p.customer[0]}</div>
                        <span className="text-slate-200 text-sm font-medium">{p.customer}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{p.packageName}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${p.remaining === 0 ? 'text-red-400' : p.remaining <= Math.ceil(p.total * 0.25) ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {p.remaining}
                      </span>
                      <span className="text-slate-600 text-xs"> / {p.total}</span>
                    </td>
                    <td className="px-4 py-3 w-36">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-700 rounded-full h-2">
                          <div className={`h-2 rounded-full transition-all ${statusColor(p.status)}`} style={{ width: `${Math.max(3, pct)}%` }} />
                        </div>
                        <span className="text-slate-500 text-xs w-8">{Math.round(pct)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{p.expiry}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => consume(p.id)}
                          disabled={p.remaining === 0}
                          className="flex items-center gap-1 text-xs bg-blue-600/15 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                          title="Mark 1 session as used"
                        >
                          <CheckCircle size={11} /> Use 1
                        </button>
                        <button
                          onClick={() => setConfirmRenew(p)}
                          className="flex items-center gap-1 text-xs bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 px-2.5 py-1.5 rounded-lg transition-colors font-medium"
                        >
                          <RefreshCw size={11} /> Renew
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-16 text-center">
                  <Package size={32} className="text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No packages found</p>
                  <button onClick={() => setSearch('')} className="mt-2 text-xs text-blue-400 hover:text-blue-300">Clear search</button>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renew Confirmation */}
      {confirmRenew && (
        <Modal title="Renew Package" onClose={() => setConfirmRenew(null)} size="sm" icon={<RefreshCw size={15} className="text-emerald-400" />}>
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-emerald-400 font-semibold text-sm">{confirmRenew.customer}</p>
              <p className="text-slate-300 text-sm mt-0.5">{confirmRenew.packageName}</p>
              <p className="text-slate-500 text-xs mt-1">Will reset to {confirmRenew.total} sessions · New expiry: Aug 31, 2024</p>
            </div>
            <p className="text-slate-400 text-sm">Renewing will reset the session count and extend the expiry date. The payment is expected separately.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmRenew(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={doRenew} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">Confirm Renewal</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Assign Package Modal */}
      {showAdd && (
        <Modal title="Assign Package" onClose={() => setShowAdd(false)} icon={<Package size={15} className="text-blue-400" />}>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Customer *</label>
              <select value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                <option value="">Select customer...</option>
                {business.customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Package *</label>
              <div className="space-y-2">
                {business.packages.map(p => (
                  <button key={p.name} onClick={() => setForm(f => ({ ...f, packageId: p.sessions }))} className={`w-full text-left p-3 rounded-xl border transition-colors ${form.packageId === p.sessions ? 'border-blue-500 bg-blue-600/10' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-200 text-sm font-medium">{p.name}</p>
                        <p className="text-slate-500 text-xs">{p.sessions} sessions · {p.description}</p>
                      </div>
                      <p className="text-blue-400 font-bold">${p.price}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Expiry Date</label>
              <input type="date" value={form.expiry} onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={addPackage} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">Assign Package</button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
