import { Link } from 'react-router-dom';

interface EmptyStateProps {
  type: 'bookings' | 'customers' | 'payments' | 'tasks' | 'products' | 'staff' | 'reminders' | 'invoices' | 'packages' | 'subscriptions' | 'generic';
  search?: string;
  onClear?: () => void;
  createLabel?: string;
  createTo?: string;
  onCreate?: () => void;
}

const CONFIGS = {
  bookings: {
    emoji: '📅',
    title: 'No bookings yet',
    sub: 'Your calendar is empty. Create your first booking to get started.',
    cta: 'Create first booking',
    tip: '💡 Tip: Recurring bookings auto-create entries for repeat customers.',
    tipTo: '/dashboard/recurring',
  },
  customers: {
    emoji: '👥',
    title: 'No customers found',
    sub: 'Your customer list is empty. Add your first customer or import from CSV.',
    cta: 'Add first customer',
    tip: '💡 Tip: Use tags to segment customers by VIP, Corporate, or Seasonal.',
    tipTo: '/dashboard/customers',
  },
  payments: {
    emoji: '💵',
    title: 'No payments recorded',
    sub: 'No payment entries match your current filters.',
    cta: 'Record payment',
    tip: '💡 Tip: Use Payment Plans for customers who pay in installments.',
    tipTo: '/dashboard/partial-payments',
  },
  tasks: {
    emoji: '✅',
    title: 'Board is clear',
    sub: 'No tasks in this column. Your team is all caught up!',
    cta: 'Add task',
    tip: '💡 Tip: Use the Issue column to flag problems that need attention.',
    tipTo: '/dashboard/tasks',
  },
  products: {
    emoji: '🛍️',
    title: 'No products yet',
    sub: 'Add products to sell alongside your services — supplements, supplies, merchandise.',
    cta: 'Add first product',
    tip: '💡 Tip: Set a low-stock threshold so Smart Reorder alerts you automatically.',
    tipTo: '/dashboard/reorder',
  },
  staff: {
    emoji: '⭐',
    title: 'No staff members',
    sub: 'Add your team to assign bookings, track commissions, and manage shifts.',
    cta: 'Add staff member',
    tip: '💡 Tip: Link staff accounts to roles for proper access control.',
    tipTo: '/dashboard/team',
  },
  reminders: {
    emoji: '💬',
    title: 'All reminders sent',
    sub: 'No pending reminders in this view. Great communication record!',
    cta: 'View all',
    tip: '💡 Tip: Use Broadcast to send bulk messages to customer segments.',
    tipTo: '/dashboard/broadcast',
  },
  invoices: {
    emoji: '🧾',
    title: 'No invoices yet',
    sub: 'Invoices are generated from payments. Record a payment to see it here.',
    cta: 'Go to Payments',
    tip: '💡 Tip: Every invoice has a QR code your customer can scan to pay.',
    tipTo: '/dashboard/payments',
  },
  packages: {
    emoji: '📦',
    title: 'No active packages',
    sub: 'No session packages assigned yet. Assign a package to a customer to start tracking.',
    cta: 'Assign package',
    tip: '💡 Tip: Packages with 2 or fewer sessions trigger a renewal reminder automatically.',
    tipTo: '/dashboard/packages',
  },
  subscriptions: {
    emoji: '🔄',
    title: 'No subscriptions',
    sub: 'No active subscriptions. Subscription customers generate predictable monthly revenue.',
    cta: 'View customers',
    tip: '💡 Tip: Set renewal reminders 7 days before expiry to maximize retention.',
    tipTo: '/dashboard/reminders',
  },
  generic: {
    emoji: '🔍',
    title: 'Nothing here',
    sub: 'No results match your current filters or search.',
    cta: 'Clear filters',
    tip: '',
    tipTo: '',
  },
};

export default function EmptyState({ type, search, onClear, createLabel, createTo, onCreate }: EmptyStateProps) {
  const cfg = CONFIGS[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Animated emoji */}
      <div className="relative mb-4">
        <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-4xl animate-bounce-slow shadow-lg">
          {cfg.emoji}
        </div>
        {/* Decorative rings */}
        <div className="absolute inset-0 rounded-2xl border-2 border-slate-700/30 scale-110 animate-pulse" />
        <div className="absolute inset-0 rounded-2xl border border-slate-700/20 scale-125" />
      </div>

      <h3 className="text-white font-bold text-base mb-1">
        {search ? `No results for "${search}"` : cfg.title}
      </h3>
      <p className="text-slate-500 text-sm max-w-xs leading-relaxed mb-5">
        {search ? 'Try a different search term or clear your filters to see all entries.' : cfg.sub}
      </p>

      {/* Actions */}
      <div className="flex flex-col items-center gap-2">
        {(onClear || search) && (
          <button onClick={onClear} className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 px-4 py-2 rounded-xl transition-all">
            ✕ Clear filters
          </button>
        )}
        {onCreate && (
          <button onClick={onCreate} className="text-xs text-white bg-blue-600 hover:bg-blue-500 font-semibold px-5 py-2.5 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-blue-500/20">
            {createLabel || cfg.cta}
          </button>
        )}
        {createTo && !onCreate && (
          <Link to={createTo} className="text-xs text-white bg-blue-600 hover:bg-blue-500 font-semibold px-5 py-2.5 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-blue-500/20">
            {createLabel || cfg.cta}
          </Link>
        )}
      </div>

      {/* Contextual tip */}
      {cfg.tip && (
        <Link to={cfg.tipTo} className="mt-5 flex items-center gap-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 transition-all max-w-xs group">
          <span className="text-sm">{cfg.tip.slice(0, 2)}</span>
          <p className="text-slate-500 text-xs text-left group-hover:text-slate-300 transition-colors">{cfg.tip.slice(3)}</p>
        </Link>
      )}
    </div>
  );
}
