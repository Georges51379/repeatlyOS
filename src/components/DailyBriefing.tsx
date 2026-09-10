import { useState, useEffect } from 'react';
import { X, ChevronRight, MessageCircle, DollarSign, Calendar, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDemo } from '../context/DemoContext';

function getGreeting(name: string) {
  const h = new Date().getHours();
  if (h < 12) return `Good morning, ${name}! ☀️`;
  if (h < 17) return `Good afternoon, ${name}! 👋`;
  return `Good evening, ${name}! 🌙`;
}

export default function DailyBriefing() {
  const { business } = useDemo();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const key = `briefing-${new Date().toDateString()}-${business.key}`;
    if (!sessionStorage.getItem(key)) {
      setTimeout(() => setVisible(true), 400);
    }
  }, [business.key]);

  const dismiss = () => {
    setDismissed(true);
    const key = `briefing-${new Date().toDateString()}-${business.key}`;
    sessionStorage.setItem(key, '1');
  };

  if (dismissed || !visible) return null;

  const todayBookings   = business.bookings.filter(b => b.date === '2024-06-11');
  const expiring        = business.customers.filter(c => c.status === 'Expiring Soon');
  const overdue         = business.customers.filter(c => c.balance < 0);
  const todayBirthdays  = business.customers.slice(0, 1); // simulated
  const lowStock        = business.products.filter(p => p.stock <= p.lowStockAt);

  // AI-style generated action tip
  const tips = [
    expiring.length > 0    && { icon: MessageCircle, text: `${expiring[0].name} hasn't renewed yet — send a reminder before the week ends.`, to: '/dashboard/broadcast', color: 'text-amber-400' },
    overdue.length > 0     && { icon: DollarSign,    text: `${overdue.length} customer${overdue.length > 1 ? 's' : ''} owe${overdue.length === 1 ? 's' : ''} money — best time to collect is during their next visit.`, to: '/dashboard/payments', color: 'text-red-400' },
    lowStock.length > 0    && { icon: Zap,           text: `${lowStock[0].name} is running low — consider restocking today.`, to: '/dashboard/reorder', color: 'text-orange-400' },
    todayBookings.length > 0 && { icon: Calendar,   text: `${todayBookings.length} booking${todayBookings.length > 1 ? 's' : ''} today — make sure your team is briefed.`, to: '/dashboard/bookings', color: 'text-blue-400' },
  ].filter(Boolean);
  const tip = tips[0];

  const items = [
    todayBookings.length > 0 && { emoji: '📅', label: `${todayBookings.length} booking${todayBookings.length > 1 ? 's' : ''} today`, to: '/dashboard/bookings' },
    overdue.length > 0       && { emoji: '💸', label: `${overdue.length} unpaid customer${overdue.length > 1 ? 's' : ''}`, to: '/dashboard/payments' },
    expiring.length > 0      && { emoji: '⏰', label: `${expiring.length} expiring this week`, to: '/dashboard/subscriptions' },
    todayBirthdays.length > 0 && { emoji: '🎂', label: `Birthday today — ${todayBirthdays[0].name.split(' ')[0]}`, to: '/dashboard/occasions' },
    lowStock.length > 0      && { emoji: '📦', label: `${lowStock.length} low-stock item${lowStock.length > 1 ? 's' : ''}`, to: '/dashboard/reorder' },
  ].filter(Boolean) as { emoji: string; label: string; to: string }[];

  return (
    <div className={`relative overflow-hidden bg-gradient-to-r from-blue-600/15 via-purple-600/8 to-transparent border border-blue-500/25 rounded-2xl p-5 mb-2 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}`}>
      {/* Ambient orb */}
      <div className="absolute right-0 top-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <button onClick={dismiss} className="absolute top-3 right-3 text-slate-600 hover:text-slate-400 hover:bg-slate-800 rounded-lg p-1 transition-colors">
        <X size={14} />
      </button>

      <div className="flex items-start gap-4">
        <div className="text-4xl shrink-0 animate-bounce-slow">👋</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-base mb-0.5">{getGreeting(business.name.split(' ')[0])}</h3>
          <p className="text-slate-400 text-sm mb-4">Here's your daily snapshot for <strong className="text-white">{business.name}</strong></p>

          {/* Digest items */}
          {items.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {items.map(item => (
                <Link key={item.to} to={item.to} className="flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-medium transition-all hover:scale-[1.02]">
                  <span>{item.emoji}</span>
                  <span>{item.label}</span>
                  <ChevronRight size={11} className="text-slate-600" />
                </Link>
              ))}
            </div>
          )}

          {/* Smart action tip */}
          {tip && (
            <Link to={(tip as { to: string }).to} className="flex items-start gap-2.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 transition-colors group">
              <div className="w-6 h-6 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0 mt-0.5">
                <Zap size={12} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-500 text-xs font-medium mb-0.5">💡 Suggested action</p>
                <p className="text-slate-200 text-sm leading-snug">{(tip as { text: string }).text}</p>
              </div>
              <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 shrink-0 mt-1 transition-colors" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
