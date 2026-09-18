import clsx from 'clsx';

// Keyed by a normalized (lowercase, underscores->spaces) form of the status
// so this works for BOTH the legacy demo's Title Case strings ('Confirmed')
// and the real business pages' lowercase enum values ('confirmed',
// 'pending_approval', 'in_progress') without every call site needing to
// reformat its data first.
const variants: Record<string, string> = {
  active: 'bg-emerald-500/12 text-emerald-400 border border-emerald-500/25',
  confirmed: 'bg-emerald-500/12 text-emerald-400 border border-emerald-500/25',
  completed: 'bg-blue-500/12 text-blue-400 border border-blue-500/25',
  paid: 'bg-emerald-500/12 text-emerald-400 border border-emerald-500/25',
  pending: 'bg-amber-500/12 text-amber-400 border border-amber-500/25',
  'expiring soon': 'bg-orange-500/12 text-orange-400 border border-orange-500/25',
  unpaid: 'bg-red-500/12 text-red-400 border border-red-500/25',
  overdue: 'bg-red-500/12 text-red-400 border border-red-500/25',
  cancelled: 'bg-slate-500/12 text-slate-400 border border-slate-500/20',
  canceled: 'bg-slate-500/12 text-slate-400 border border-slate-500/20',
  'no-show': 'bg-slate-500/12 text-slate-400 border border-slate-500/20',
  paused: 'bg-purple-500/12 text-purple-400 border border-purple-500/25',
  partial: 'bg-amber-500/12 text-amber-400 border border-amber-500/25',
  sent: 'bg-emerald-500/12 text-emerald-400 border border-emerald-500/25',
  scheduled: 'bg-blue-500/12 text-blue-400 border border-blue-500/25',
  failed: 'bg-red-500/12 text-red-400 border border-red-500/25',
  'not sent': 'bg-slate-500/12 text-slate-400 border border-slate-500/20',
  issue: 'bg-red-500/12 text-red-400 border border-red-500/25',
  settled: 'bg-emerald-500/12 text-emerald-400 border border-emerald-500/25',
  open: 'bg-emerald-500/12 text-emerald-400 border border-emerald-500/25',
  'low stock': 'bg-amber-500/12 text-amber-400 border border-amber-500/25',
  'out of stock': 'bg-red-500/12 text-red-400 border border-red-500/25',
  'not tracked': 'bg-slate-500/12 text-slate-400 border border-slate-500/20',
  in_stock: 'bg-emerald-500/12 text-emerald-400 border border-emerald-500/25',
  // Real order/booking/business/task/membership status values that don't
  // otherwise match one of the legacy labels above.
  new: 'bg-blue-500/12 text-blue-400 border border-blue-500/25',
  preparing: 'bg-amber-500/12 text-amber-400 border border-amber-500/25',
  ready: 'bg-cyan-500/12 text-cyan-400 border border-cyan-500/25',
  refunded: 'bg-slate-500/12 text-slate-400 border border-slate-500/20',
  draft: 'bg-slate-500/12 text-slate-400 border border-slate-500/20',
  pending_approval: 'bg-amber-500/12 text-amber-400 border border-amber-500/25',
  suspended: 'bg-red-500/12 text-red-400 border border-red-500/25',
  rejected: 'bg-red-500/12 text-red-400 border border-red-500/25',
  archived: 'bg-slate-500/12 text-slate-400 border border-slate-500/20',
  invited: 'bg-blue-500/12 text-blue-400 border border-blue-500/25',
  removed: 'bg-slate-500/12 text-slate-400 border border-slate-500/20',
  expired: 'bg-slate-500/12 text-slate-400 border border-slate-500/20',
  todo: 'bg-slate-500/12 text-slate-400 border border-slate-500/20',
  in_progress: 'bg-blue-500/12 text-blue-400 border border-blue-500/25',
  trialing: 'bg-blue-500/12 text-blue-400 border border-blue-500/25',
  past_due: 'bg-red-500/12 text-red-400 border border-red-500/25',
};

const dots: Record<string, string> = {
  active: 'bg-emerald-400', confirmed: 'bg-emerald-400', completed: 'bg-blue-400',
  paid: 'bg-emerald-400', pending: 'bg-amber-400', 'expiring soon': 'bg-orange-400',
  unpaid: 'bg-red-400', overdue: 'bg-red-400', paused: 'bg-purple-400',
  new: 'bg-blue-400', preparing: 'bg-amber-400', ready: 'bg-cyan-400',
  pending_approval: 'bg-amber-400', suspended: 'bg-red-400', in_progress: 'bg-blue-400',
};

function normalize(status: string): string {
  return status.trim().toLowerCase().replace(/_/g, ' ');
}

/** Turns a raw enum value ('pending_approval') into a readable label
 * ('Pending Approval') for display — the lookup above still matches on the
 * normalized (lowercase, space-separated) form regardless of how the label
 * ends up capitalized. */
function toLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Props { status: string; dot?: boolean; label?: string; }

export default function StatusBadge({ status, dot = true, label }: Props) {
  const key = normalize(status);
  return (
    <span className={clsx('pill', variants[key] ?? 'bg-slate-500/12 text-slate-400 border border-slate-500/20')}>
      {dot && dots[key] && <span className={clsx('w-1.5 h-1.5 rounded-full mr-1.5 shrink-0', dots[key])} />}
      {label ?? toLabel(status)}
    </span>
  );
}
