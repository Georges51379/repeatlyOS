import { useMemo } from 'react';
import { Calendar, Package, RefreshCw, DollarSign, AlertCircle, Star, UserPlus } from 'lucide-react';

interface Booking { date: string; service: string; status: string; amount: number; staff: string; }
interface Customer {
  name: string;
  type: string;
  plan: string;
  status: string;
  balance: number;
  lastVisit: string;
}

interface Props {
  customer: Customer;
  bookings: Booking[];
}

interface Event {
  date: string;
  type: 'joined' | 'booking' | 'package' | 'subscription' | 'payment_issue' | 'payment_ok' | 'status_change' | 'referral';
  title: string;
  desc: string;
  icon: typeof Calendar;
  color: string;
  bg: string;
  dot: string;
}

const iconMap = {
  joined:         { icon: UserPlus,    color: 'text-blue-400',    bg: 'bg-blue-500/15 border-blue-500/25',    dot: 'bg-blue-400' },
  booking:        { icon: Calendar,    color: 'text-purple-400',  bg: 'bg-purple-500/15 border-purple-500/25', dot: 'bg-purple-400' },
  package:        { icon: Package,     color: 'text-orange-400',  bg: 'bg-orange-500/15 border-orange-500/25',dot: 'bg-orange-400' },
  subscription:   { icon: RefreshCw,   color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/25',dot: 'bg-emerald-400' },
  payment_issue:  { icon: AlertCircle, color: 'text-red-400',     bg: 'bg-red-500/15 border-red-500/25',       dot: 'bg-red-400' },
  payment_ok:     { icon: DollarSign,  color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/25',dot: 'bg-emerald-400' },
  status_change:  { icon: Star,        color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/25',   dot: 'bg-amber-400' },
  referral:       { icon: UserPlus,    color: 'text-cyan-400',    bg: 'bg-cyan-500/15 border-cyan-500/25',     dot: 'bg-cyan-400' },
};

export default function CustomerJourney({ customer, bookings }: Props) {
  const events = useMemo((): Event[] => {
    const list: Event[] = [];

    // Joined event
    list.push({ date: '2024-01-15', type: 'joined', title: 'Joined as a customer', desc: `Welcome to the family! First visit recorded.`, ...iconMap.joined });

    // Package/subscription purchase
    if (customer.type === 'Package') {
      list.push({ date: '2024-01-16', type: 'package', title: `Purchased ${customer.plan}`, desc: 'Package activated — session balance set.', ...iconMap.package });
    } else if (customer.type === 'Subscription') {
      list.push({ date: '2024-01-16', type: 'subscription', title: `Subscribed to ${customer.plan}`, desc: 'Monthly subscription started.', ...iconMap.subscription });
    }

    // Bookings
    bookings.forEach(b => {
      list.push({
        date: b.date,
        type: 'booking',
        title: b.status === 'Completed' ? `Completed — ${b.service}` : `Booking — ${b.service}`,
        desc: `${b.staff} · ${b.status} · $${b.amount}`,
        ...iconMap.booking,
        dot: b.status === 'Completed' ? 'bg-emerald-400' : b.status === 'Cancelled' ? 'bg-red-400' : 'bg-purple-400',
      });
    });

    // Payment status events
    if (customer.balance < 0) {
      list.push({ date: '2024-05-01', type: 'payment_issue', title: 'Payment overdue', desc: `Outstanding balance: $${Math.abs(customer.balance)}`, ...iconMap.payment_issue });
    } else {
      list.push({ date: '2024-05-15', type: 'payment_ok', title: 'Payment settled', desc: 'Account balance cleared — all good!', ...iconMap.payment_ok });
    }

    // Status change events
    if (customer.status === 'Expiring Soon') {
      list.push({ date: '2024-06-08', type: 'status_change', title: 'Subscription expiring', desc: 'Renewal reminder sent via WhatsApp.', ...iconMap.status_change });
    } else if (customer.status === 'Active') {
      list.push({ date: '2024-04-01', type: 'status_change', title: 'Subscription renewed', desc: 'Auto-renewed for another month. Thank you! 🎉', ...iconMap.status_change });
    }

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [customer, bookings]);

  const grouped = useMemo(() => {
    const map: Record<string, Event[]> = {};
    events.forEach(e => {
      const month = e.date.slice(0, 7);
      if (!map[month]) map[month] = [];
      map[month].push(e);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [events]);

  return (
    <div className="space-y-1">
      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">Customer Journey</p>

      {grouped.map(([month, evts]) => {
        const [y, m] = month.split('-');
        const label  = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return (
          <div key={month}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-slate-600 text-xs font-medium">{label}</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>
            <div className="space-y-2 pl-2 mb-4">
              {evts.map((e, i) => {
                const Icon = e.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    {/* Timeline dot + line */}
                    <div className="flex flex-col items-center shrink-0 mt-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${e.dot} ring-2 ring-slate-950`} />
                      {i < evts.length - 1 && <div className="w-px flex-1 bg-slate-800 my-1 min-h-[20px]" />}
                    </div>
                    {/* Card */}
                    <div className={`flex-1 flex items-start gap-2.5 border rounded-xl px-3 py-2.5 mb-1 ${e.bg}`}>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${e.bg}`}>
                        <Icon size={12} className={e.color} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold ${e.color}`}>{e.title}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{e.desc}</p>
                        <p className="text-slate-700 text-xs mt-0.5 font-mono">{e.date}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {events.length === 0 && (
        <div className="text-center py-6 text-slate-600 text-sm">No journey events yet.</div>
      )}
    </div>
  );
}
