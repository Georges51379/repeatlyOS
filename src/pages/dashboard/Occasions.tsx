import { useState, useMemo } from 'react';
import { Gift, MessageCircle, Copy, Check } from 'lucide-react';
import Toast from '../../components/Toast';
import { useDemo } from '../../context/DemoContext';

type Occasion = { id: number; customer: string; phone: string; type: 'Birthday' | 'Anniversary'; date: string; daysUntil: number; sent: boolean };

const BDAY_MSG = (name: string, business: string) =>
  `🎂 Happy Birthday ${name.split(' ')[0]}! Wishing you a wonderful day. As our gift to you, enjoy a special treat on your next visit. — ${business} 🎉`;

const ANNIV_MSG = (name: string, business: string) =>
  `🌟 Hi ${name.split(' ')[0]}! It's your anniversary with us and we couldn't be more grateful. Thank you for being a loyal customer. See you soon! — ${business} 💙`;

export default function OccasionsPage() {
  const { business } = useDemo();
  const [toast, setToast] = useState('');
  const [copied, setCopied] = useState<number | null>(null);
  const [sent, setSent] = useState<number[]>([]);

  // Generate occasions from customers (simulated dates)
  const occasions = useMemo((): Occasion[] => {
    return business.customers.map((c, i) => {
      const dayOffsets = [0, 2, 5, 8, 12, 15, 18, 22, 25, 28];
      const daysUntil = dayOffsets[i % dayOffsets.length];
      const type: 'Birthday' | 'Anniversary' = i % 3 === 0 ? 'Anniversary' : 'Birthday';
      const d = new Date('2024-06-11');
      d.setDate(d.getDate() + daysUntil);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { id: c.id, customer: c.name, phone: c.phone, type, date: dateStr, daysUntil, sent: false };
    }).sort((a, b) => a.daysUntil - b.daysUntil);
  }, [business.customers]);

  const upcoming = occasions.filter(o => o.daysUntil <= 7);
  const thisMonth = occasions.filter(o => o.daysUntil <= 30);
  const todayList = occasions.filter(o => o.daysUntil === 0);

  const buildMsg = (o: Occasion) => o.type === 'Birthday' ? BDAY_MSG(o.customer, business.name) : ANNIV_MSG(o.customer, business.name);

  const openWA = (o: Occasion) => {
    const phone = o.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(buildMsg(o))}`, '_blank');
    setSent(p => [...p, o.id]);
    setToast(`WhatsApp opened for ${o.customer}'s ${o.type.toLowerCase()}.`);
  };

  const copyMsg = (o: Occasion) => {
    navigator.clipboard.writeText(buildMsg(o)).catch(() => {});
    setCopied(o.id);
    setTimeout(() => setCopied(null), 2000);
    setToast('Message copied!');
  };

  const urgencyBadge = (days: number) =>
    days === 0 ? { label: '🎉 TODAY!', cls: 'bg-pink-500 text-white animate-pulse' } :
    days === 1 ? { label: '⏰ Tomorrow', cls: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' } :
    days <= 7  ? { label: `📅 In ${days} days`, cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/25' } :
    { label: `In ${days} days`, cls: 'bg-slate-800 text-slate-500 border border-slate-700' };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Gift size={18} className="text-pink-400" /> Birthdays & Occasions
          </h2>
          <p className="text-slate-500 text-sm">Never miss a customer moment · {business.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-pink-500/10 border border-pink-500/20 rounded-lg px-3 py-1.5">
            <Gift size={13} className="text-pink-400" />
            <span className="text-pink-400 text-xs font-medium">{todayList.length > 0 ? `${todayList.length} occasion${todayList.length > 1 ? 's' : ''} today!` : `${upcoming.length} this week`}</span>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Today's Occasions", value: todayList.length, icon: '🎉', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
          { label: 'This Week',         value: upcoming.length, icon: '📅', color: 'text-blue-400',  bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'This Month',        value: thisMonth.length, icon: '📆', color: 'text-purple-400',bg: 'bg-purple-500/10 border-purple-500/20' },
          { label: 'Messages Sent',     value: sent.length, icon: '✅', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map(s => (
          <div key={s.label} className={`border rounded-2xl p-4 ${s.bg}`}>
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Today's occasions highlight */}
      {todayList.length > 0 && (
        <div className="bg-gradient-to-r from-pink-600/15 via-purple-600/10 to-transparent border border-pink-500/25 rounded-2xl p-5">
          <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <span className="text-xl">🎂</span> Celebrate Today!
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {todayList.map(o => (
              <div key={o.id} className="bg-slate-900/80 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 font-black text-lg shrink-0">
                  {o.customer[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{o.customer}</p>
                  <p className="text-pink-400 text-xs">{o.type === 'Birthday' ? '🎂 Birthday' : '🌟 Anniversary'} — Today!</p>
                </div>
                <button onClick={() => openWA(o)} className="bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0">
                  <MessageCircle size={12} /> Send
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full upcoming list */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">All Upcoming Occasions</h3>
          <p className="text-slate-500 text-xs">{occasions.length} total · sorted by date</p>
        </div>
        <div className="divide-y divide-slate-800/50">
          {occasions.map(o => {
            const badge = urgencyBadge(o.daysUntil);
            const isSent = sent.includes(o.id);
            return (
              <div key={o.id} className={`flex items-center gap-4 px-5 py-3.5 hover:bg-slate-800/20 transition-colors border-l-2 ${o.daysUntil === 0 ? 'border-l-pink-500' : o.daysUntil <= 3 ? 'border-l-amber-500' : 'border-l-transparent'}`}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center text-white font-bold shrink-0">
                  {o.customer[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-slate-200 font-semibold text-sm">{o.customer}</p>
                    <span className="text-lg">{o.type === 'Birthday' ? '🎂' : '🌟'}</span>
                  </div>
                  <p className="text-slate-500 text-xs">{o.type} · {o.date} · {o.phone}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${badge.cls}`}>{badge.label}</span>
                {isSent ? (
                  <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium shrink-0">
                    <Check size={12} /> Sent
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => copyMsg(o)} className={`p-1.5 rounded-lg border transition-colors ${copied === o.id ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-slate-500 border-slate-700 hover:text-slate-300 hover:bg-slate-800'}`}>
                      {copied === o.id ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                    <button onClick={() => openWA(o)} className="flex items-center gap-1 text-xs bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] font-medium px-2.5 py-1.5 rounded-lg transition-colors">
                      <MessageCircle size={11} /> WhatsApp
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Message preview box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-white font-semibold text-sm mb-3">Message Templates</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { type: 'Birthday', msg: BDAY_MSG('Customer', business.name), icon: '🎂', color: 'border-pink-500/20 bg-pink-500/5' },
            { type: 'Anniversary', msg: ANNIV_MSG('Customer', business.name), icon: '🌟', color: 'border-purple-500/20 bg-purple-500/5' },
          ].map(t => (
            <div key={t.type} className={`border rounded-xl p-3.5 ${t.color}`}>
              <p className="text-slate-400 text-xs font-semibold mb-2">{t.icon} {t.type} Template</p>
              <p className="text-slate-300 text-sm leading-relaxed">{t.msg}</p>
            </div>
          ))}
        </div>
        <p className="text-slate-600 text-xs mt-3">Customer names are automatically inserted when you send · Demo only</p>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
