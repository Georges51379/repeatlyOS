import { useState, useMemo } from 'react';
import { Users, Gift, TrendingUp, MessageCircle, Star, Plus, Check, Copy } from 'lucide-react';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import StatCard from '../../components/StatCard';
import { useDemo } from '../../context/DemoContext';

type ReferralLink = { referrerId: number; referredId: number };

const SEED_LINKS: ReferralLink[] = [
  { referrerId: 1, referredId: 3 },
  { referrerId: 1, referredId: 5 },
  { referrerId: 2, referredId: 4 },
  { referrerId: 6, referredId: 7 },
  { referrerId: 1, referredId: 8 },
];

export default function ReferralsPage() {
  const { business } = useDemo();
  const [links, setLinks]   = useState<ReferralLink[]>(SEED_LINKS);
  const [toast, setToast]   = useState('');
  const [copied, setCopied] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]     = useState({ referrerId: '', referredId: '' });

  const leaderboard = useMemo(() => {
    const map: Record<number, { count: number; revenue: number }> = {};
    links.forEach(l => {
      if (!map[l.referrerId]) map[l.referrerId] = { count: 0, revenue: 0 };
      map[l.referrerId].count++;
      const referred = business.customers.find(c => c.id === l.referredId);
      map[l.referrerId].revenue += referred ? business.subscription.price : 0;
    });
    return Object.entries(map)
      .map(([id, stats]) => {
        const c = business.customers.find(c => c.id === Number(id));
        return c ? { ...c, ...stats } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b!.count - a!.count) as (typeof business.customers[0] & { count: number; revenue: number })[];
  }, [links, business]);

  const totalReferrals  = links.length;
  const totalRevenue    = leaderboard.reduce((a, r) => a + r.revenue, 0);
  const topReferrer     = leaderboard[0];

  const addLink = () => {
    if (!form.referrerId || !form.referredId) { setToast('Select both customers.'); return; }
    if (form.referrerId === form.referredId) { setToast('Referrer and referred must be different customers.'); return; }
    setLinks(prev => [...prev, { referrerId: Number(form.referrerId), referredId: Number(form.referredId) }]);
    setShowAdd(false);
    setForm({ referrerId: '', referredId: '' });
    const referrer = business.customers.find(c => c.id === Number(form.referrerId));
    setToast(`Referral recorded. ${referrer?.name} gets credit!`);
  };

  const sendThankYou = (customer: typeof business.customers[0]) => {
    const msg = `Hi ${customer.name.split(' ')[0]}! 🙏 Thank you so much for referring a friend to ${business.name}. Your loyalty means the world to us — enjoy a special gift on your next visit! 💙`;
    const phone = customer.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    setToast(`Thank-you WhatsApp opened for ${customer.name}.`);
  };

  const copyReferralLink = (id: number) => {
    navigator.clipboard.writeText(`https://repeatlyos.app/book/${business.key}?ref=${id}`).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2500);
    setToast('Referral link copied!');
  };

  const medals = ['🥇','🥈','🥉'];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            🤝 Referral Tracker
          </h2>
          <p className="text-slate-500 text-sm">Track who brought who — reward your best ambassadors · {business.name}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
          <Plus size={14} /> Record Referral
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Referrals"  value={totalReferrals}              icon={Users}       accent="blue"   />
        <StatCard title="Referral Revenue" value={`$${totalRevenue}`}          icon={TrendingUp}  accent="emerald"/>
        <StatCard title="Top Referrer"     value={topReferrer?.name?.split(' ')[0] || '—'} icon={Star} accent="amber" />
        <StatCard title="Avg per Referrer" value={leaderboard.length > 0 ? (totalReferrals / leaderboard.length).toFixed(1) : '0'} icon={Gift} accent="purple" />
      </div>

      {/* Leaderboard */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">🏆 Top Referrers</h3>
          <p className="text-slate-500 text-xs">{leaderboard.length} active referrers</p>
        </div>
        <div className="divide-y divide-slate-800/50">
          {leaderboard.map((r, i) => {
            const referredCustomers = links.filter(l => l.referrerId === r.id).map(l => business.customers.find(c => c.id === l.referredId)).filter(Boolean);
            return (
              <div key={r.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-800/20 transition-colors">
                <span className="text-2xl shrink-0 w-8 text-center">{medals[i] || `#${i + 1}`}</span>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600/40 to-purple-600/20 flex items-center justify-center text-white font-bold shrink-0">
                  {r.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{r.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {referredCustomers.slice(0, 3).map(rc => (
                      <span key={rc!.id} className="text-xs bg-slate-800 border border-slate-700 rounded-full px-2 py-0.5 text-slate-400">
                        → {rc!.name.split(' ')[0]}
                      </span>
                    ))}
                    {referredCustomers.length > 3 && <span className="text-slate-600 text-xs">+{referredCustomers.length - 3} more</span>}
                  </div>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-amber-400 font-black">{r.count}</p>
                      <p className="text-slate-600 text-xs">referrals</p>
                    </div>
                    <div className="text-center">
                      <p className="text-emerald-400 font-black">${r.revenue}</p>
                      <p className="text-slate-600 text-xs">revenue</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      onClick={() => copyReferralLink(r.id)}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors ${copied === r.id ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-slate-500 border-slate-700 hover:text-slate-300 hover:bg-slate-800'}`}
                      title="Copy referral link"
                    >
                      {copied === r.id ? <Check size={11} /> : <Copy size={11} />}
                      <span>Link</span>
                    </button>
                    <button
                      onClick={() => sendThankYou(r)}
                      className="flex items-center gap-1 text-xs text-[#25D366] border border-[#25D366]/30 bg-[#25D366]/10 hover:bg-[#25D366]/20 px-2 py-1 rounded-lg transition-colors"
                    >
                      <MessageCircle size={11} /> Thank you
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {leaderboard.length === 0 && (
            <div className="py-14 text-center">
              <p className="text-4xl mb-2">🤝</p>
              <p className="text-slate-500 text-sm">No referrals recorded yet</p>
              <button onClick={() => setShowAdd(true)} className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">+ Record first referral</button>
            </div>
          )}
        </div>
      </div>

      {/* Full referral list */}
      {links.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800">
            <h3 className="text-white font-semibold text-sm">All Referrals</h3>
          </div>
          <div className="divide-y divide-slate-800/50">
            {links.map((link, i) => {
              const referrer = business.customers.find(c => c.id === link.referrerId);
              const referred = business.customers.find(c => c.id === link.referredId);
              if (!referrer || !referred) return null;
              return (
                <div key={i} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">{referrer.name[0]}</div>
                    <span className="text-slate-300 text-sm font-medium">{referrer.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <div className="h-px w-6 bg-slate-700" />
                    <span className="text-xs">referred</span>
                    <div className="h-px w-6 bg-slate-700" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">{referred.name[0]}</div>
                    <span className="text-slate-300 text-sm font-medium">{referred.name}</span>
                  </div>
                  <span className="ml-auto text-emerald-400 text-xs font-medium">+${business.subscription.price}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showAdd && (
        <Modal title="Record Referral" onClose={() => setShowAdd(false)} size="sm" icon={<Users size={15} className="text-blue-400" />}>
          <div className="space-y-3">
            <p className="text-slate-400 text-sm">Who referred a new customer to {business.name}?</p>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Referrer (existing customer)</label>
              <select value={form.referrerId} onChange={e => setForm(f => ({ ...f, referrerId: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                <option value="">Select customer...</option>
                {business.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">New Customer (who was referred)</label>
              <select value={form.referredId} onChange={e => setForm(f => ({ ...f, referredId: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                <option value="">Select customer...</option>
                {business.customers.filter(c => c.id !== Number(form.referrerId)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={addLink} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">Record Referral</button>
            </div>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
