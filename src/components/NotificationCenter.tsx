import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, RefreshCw, CreditCard, Calendar, AlertTriangle, Package, X } from 'lucide-react';
import { useDemo } from '../context/DemoContext';

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { business } = useDemo();

  const alerts = [
    { icon: RefreshCw, color: 'text-amber-400 bg-amber-500/10', title: `${business.kpis.expiringThisWeek} subscriptions expiring this week`, sub: 'Send renewal reminders now', route: '/dashboard/subscriptions' },
    { icon: CreditCard, color: 'text-red-400 bg-red-500/10', title: `${business.kpis.unpaidCustomers} unpaid customers need follow-up`, sub: 'Total overdue balance outstanding', route: '/dashboard/payments' },
    { icon: Calendar, color: 'text-blue-400 bg-blue-500/10', title: '5 bookings waiting confirmation', sub: 'Review and confirm pending bookings', route: '/dashboard/bookings' },
    { icon: AlertTriangle, color: 'text-red-400 bg-red-500/10', title: '3 tasks reported issues', sub: 'Staff flagged problems — review now', route: '/dashboard/tasks' },
    { icon: Package, color: 'text-purple-400 bg-purple-500/10', title: '8 package balances below 2 sessions', sub: 'Upsell opportunity — contact customers', route: '/dashboard/packages' },
  ];

  const go = (route: string) => { navigate(route); setOpen(false); };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
      >
        <Bell size={17} />
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-950" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-2 z-40 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div>
                <p className="text-white font-semibold text-sm">Notifications</p>
                <p className="text-slate-500 text-xs">{alerts.length} alerts requiring attention</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300"><X size={14} /></button>
            </div>
            <div className="divide-y divide-slate-800">
              {alerts.map((a, i) => (
                <button
                  key={i}
                  onClick={() => go(a.route)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-800 transition-colors text-left"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.color}`}>
                    <a.icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-xs font-medium leading-snug">{a.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{a.sub}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-600">Demo notifications — no real-time backend</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
