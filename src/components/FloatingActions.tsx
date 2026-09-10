import { useState } from 'react';
import { Plus, Calendar, Users, MessageCircle, DollarSign, TrendingUp, X, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const actions = [
  { icon: Calendar,     label: 'New Booking',    to: '/dashboard/bookings',    color: 'bg-blue-600 shadow-blue-500/30' },
  { icon: MessageCircle,label: 'Broadcast',       to: '/dashboard/broadcast',   color: 'bg-green-600 shadow-green-500/30' },
  { icon: DollarSign,   label: 'Record Payment', to: '/dashboard/payments',    color: 'bg-emerald-600 shadow-emerald-500/30' },
  { icon: TrendingUp,   label: 'View Forecast',  to: '/dashboard/forecast',    color: 'bg-purple-600 shadow-purple-500/30' },
  { icon: Users,        label: 'Customers',      to: '/dashboard/customers',   color: 'bg-slate-600 shadow-slate-500/20' },
  { icon: Zap,          label: 'Smart Reorder',  to: '/dashboard/reorder',     color: 'bg-amber-600 shadow-amber-500/30' },
];

export default function FloatingActions() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-6 right-5 z-30 lg:hidden flex flex-col items-end gap-2">
      {open && (
        <>
          <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />
          {actions.map((a, i) => (
            <Link
              key={a.label}
              to={a.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 ${a.color} text-white px-3.5 py-2.5 rounded-2xl shadow-lg text-xs font-semibold animate-in`}
              style={{ animationDelay: `${(actions.length - i) * 40}ms` }}
            >
              <a.icon size={14} />
              {a.label}
            </Link>
          ))}
        </>
      )}
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-[52px] h-[52px] flex items-center justify-center rounded-full shadow-2xl shadow-blue-500/30 transition-all duration-200 ${open ? 'bg-slate-700 rotate-45' : 'bg-blue-600 hover:bg-blue-500 hover:scale-105'}`}
      >
        {open ? <X size={22} className="text-white" /> : <Plus size={24} className="text-white" />}
      </button>
    </div>
  );
}
