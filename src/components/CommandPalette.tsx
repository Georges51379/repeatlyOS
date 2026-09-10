import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Calendar, Package, CreditCard, Bell, X, Star, Compass, ShoppingBag } from 'lucide-react';
import { useDemo } from '../context/DemoContext';

const pageShortcuts = [
  { label: 'Overview',              sub: 'Dashboard home',                      route: '/dashboard' },
  { label: 'Calendar',              sub: 'Week / month / day view',             route: '/dashboard/calendar' },
  { label: 'Products',              sub: 'Manage catalog and pricing',           route: '/dashboard/products' },
  { label: 'Inventory Management',  sub: 'Stock ledger, purchase orders',        route: '/dashboard/inventory' },
  { label: 'Invoices',              sub: 'Billing & invoice history',            route: '/dashboard/invoices' },
  { label: 'Staff Performance',     sub: 'Team metrics',                         route: '/dashboard/staff' },
  { label: 'Loyalty & Retention',   sub: 'Customer health scores',               route: '/dashboard/loyalty' },
  { label: 'Activity Log',          sub: 'Full event history',                   route: '/dashboard/activity' },
  { label: 'Multi-Branch',          sub: 'Enterprise view',                      route: '/dashboard/branches' },
  { label: 'Settings',              sub: 'Business configuration',               route: '/dashboard/settings' },
  { label: 'WhatsApp Broadcast',    sub: 'Send to customer segments',            route: '/dashboard/broadcast' },
  { label: 'Revenue Forecast',      sub: '30-day revenue projection',            route: '/dashboard/forecast' },
  { label: 'Commission Tracker',    sub: 'Staff payroll calculations',           route: '/dashboard/commissions' },
  { label: 'Expense Tracker',       sub: 'P&L and profit view',                 route: '/dashboard/expenses' },
  { label: 'Birthdays & Occasions', sub: 'Birthday and anniversary reminders',  route: '/dashboard/occasions' },
  { label: 'Waiting List',          sub: 'Convert cancellations to bookings',   route: '/dashboard/waitlist' },
  { label: 'Smart Reorder',         sub: 'Auto-detect low stock and order',     route: '/dashboard/reorder' },
  { label: 'Health Score',          sub: 'Live 0-100 business score',           route: '/dashboard/health' },
  { label: 'Revenue Heatmap',       sub: 'Busiest days at a glance',            route: '/dashboard/heatmap' },
  { label: 'Goal Tracker',          sub: 'Monthly targets with progress rings', route: '/dashboard/goals' },
  { label: 'Referral Tracker',      sub: 'Who brought who — reward ambassadors',route: '/dashboard/referrals' },
];

const getResults = (business: ReturnType<typeof useDemo>['business'], q: string) => {
  const query = q.toLowerCase().trim();
  if (!query) return [];
  const results: { label: string; sub: string; icon: typeof Users; route: string; category: string }[] = [];

  business.customers.forEach(c => {
    if (c.name.toLowerCase().includes(query) || c.phone.includes(query)) {
      results.push({ label: c.name, sub: `${c.type} · ${c.status}`, icon: Users, route: '/dashboard/customers', category: 'Customer' });
    }
  });
  business.bookings.forEach(b => {
    if (b.customer.toLowerCase().includes(query) || b.service.toLowerCase().includes(query)) {
      results.push({ label: `${b.service} — ${b.customer}`, sub: `${b.date} ${b.time} · ${b.status}`, icon: Calendar, route: '/dashboard/bookings', category: 'Booking' });
    }
  });
  business.packages.forEach(p => {
    if (p.name.toLowerCase().includes(query)) {
      results.push({ label: p.name, sub: `$${p.price} · ${p.sessions} sessions`, icon: Package, route: '/dashboard/packages', category: 'Package' });
    }
  });
  business.products.forEach(p => {
    if (p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)) {
      results.push({ label: p.name, sub: `$${p.price} · ${p.stock} ${p.unit} in stock`, icon: ShoppingBag, route: '/dashboard/products', category: 'Product' });
    }
  });
  business.payments.forEach(p => {
    if (p.customer.toLowerCase().includes(query) || p.ref.toLowerCase().includes(query)) {
      results.push({ label: `${p.ref} — ${p.customer}`, sub: `$${p.amount} · ${p.status}`, icon: CreditCard, route: '/dashboard/payments', category: 'Payment' });
    }
  });
  business.staff.forEach(s => {
    if (s.toLowerCase().includes(query)) {
      results.push({ label: s, sub: 'Staff member', icon: Star, route: '/dashboard/staff', category: 'Staff' });
    }
  });

  const staticReminders = [
    { label: 'Renewal reminders due', sub: 'Expiring subscriptions this week', icon: Bell, route: '/dashboard/reminders', category: 'Reminder' },
    { label: 'Unpaid payment alerts', sub: 'Customers with overdue balances', icon: Bell, route: '/dashboard/reminders', category: 'Reminder' },
  ];
  staticReminders.forEach(r => {
    if (r.label.toLowerCase().includes(query) || r.sub.toLowerCase().includes(query)) results.push(r);
  });

  pageShortcuts.forEach(p => {
    if (p.label.toLowerCase().includes(query) || p.sub.toLowerCase().includes(query)) {
      results.push({ label: p.label, sub: p.sub, icon: Compass, route: p.route, category: 'Page' });
    }
  });

  return results.slice(0, 8);
};

const categoryColors: Record<string, string> = {
  Customer: 'bg-blue-500/15 text-blue-400',
  Booking: 'bg-emerald-500/15 text-emerald-400',
  Package: 'bg-purple-500/15 text-purple-400',
  Product: 'bg-orange-500/15 text-orange-400',
  Payment: 'bg-amber-500/15 text-amber-400',
  Reminder: 'bg-red-500/15 text-red-400',
  Staff: 'bg-cyan-500/15 text-cyan-400',
  Page: 'bg-slate-500/15 text-slate-400',
};


export default function CommandPalette() {
  const { commandOpen, setCommandOpen, business } = useDemo();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (commandOpen) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [commandOpen]);

  if (!commandOpen) return null;

  const results = getResults(business, query);

  const go = (route: string) => { navigate(route); setCommandOpen(false); };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCommandOpen(false)} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800">
          <Search size={16} className="text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search customers, bookings, packages..."
            className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm focus:outline-none"
          />
          <div className="flex items-center gap-1">
            <kbd className="text-slate-600 text-xs bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5">⌘K</kbd>
            <button onClick={() => setCommandOpen(false)} className="text-slate-500 hover:text-slate-300 ml-1"><X size={14} /></button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto scrollbar-thin">
          {!query && (
            <div className="px-4 py-8 text-center">
              <Search size={24} className="text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Search across all your data</p>
              <p className="text-slate-600 text-xs mt-1">Customers, bookings, packages, payments, reminders</p>
            </div>
          )}
          {query && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-slate-500 text-sm">No results for "<span className="text-slate-400">{query}</span>"</p>
            </div>
          )}
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => go(r.route)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                <r.icon size={13} className="text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 text-sm truncate">{r.label}</p>
                <p className="text-slate-500 text-xs truncate">{r.sub}</p>
              </div>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${categoryColors[r.category]}`}>{r.category}</span>
            </button>
          ))}
        </div>

        <div className="px-4 py-2.5 border-t border-slate-800 flex items-center gap-4">
          <span className="text-xs text-slate-600">↑↓ navigate</span>
          <span className="text-xs text-slate-600">↵ open</span>
          <span className="text-xs text-slate-600">esc close</span>
          <span className="text-xs text-slate-500 ml-auto">{business.name}</span>
        </div>
      </div>
    </div>
  );
}
