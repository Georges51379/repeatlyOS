import clsx from 'clsx';

const variants: Record<string, string> = {
  Active:          'bg-emerald-500/12 text-emerald-400 border border-emerald-500/25 ring-0',
  Confirmed:       'bg-emerald-500/12 text-emerald-400 border border-emerald-500/25',
  Completed:       'bg-blue-500/12 text-blue-400 border border-blue-500/25',
  Paid:            'bg-emerald-500/12 text-emerald-400 border border-emerald-500/25',
  Pending:         'bg-amber-500/12 text-amber-400 border border-amber-500/25',
  'Expiring Soon': 'bg-orange-500/12 text-orange-400 border border-orange-500/25',
  Unpaid:          'bg-red-500/12 text-red-400 border border-red-500/25',
  Overdue:         'bg-red-500/12 text-red-400 border border-red-500/25',
  Cancelled:       'bg-slate-500/12 text-slate-400 border border-slate-500/20',
  'No-show':       'bg-slate-500/12 text-slate-400 border border-slate-500/20',
  Paused:          'bg-purple-500/12 text-purple-400 border border-purple-500/25',
  Partial:         'bg-amber-500/12 text-amber-400 border border-amber-500/25',
  Sent:            'bg-emerald-500/12 text-emerald-400 border border-emerald-500/25',
  Scheduled:       'bg-blue-500/12 text-blue-400 border border-blue-500/25',
  Failed:          'bg-red-500/12 text-red-400 border border-red-500/25',
  'Not Sent':      'bg-slate-500/12 text-slate-400 border border-slate-500/20',
  Issue:           'bg-red-500/12 text-red-400 border border-red-500/25',
  Settled:         'bg-emerald-500/12 text-emerald-400 border border-emerald-500/25',
  Open:            'bg-emerald-500/12 text-emerald-400 border border-emerald-500/25',
  'Low Stock':     'bg-amber-500/12 text-amber-400 border border-amber-500/25',
  'Out of Stock':  'bg-red-500/12 text-red-400 border border-red-500/25',
};

const dots: Record<string, string> = {
  Active: 'bg-emerald-400', Confirmed: 'bg-emerald-400', Completed: 'bg-blue-400',
  Paid: 'bg-emerald-400', Pending: 'bg-amber-400', 'Expiring Soon': 'bg-orange-400',
  Unpaid: 'bg-red-400', Overdue: 'bg-red-400', Paused: 'bg-purple-400',
};

interface Props { status: string; dot?: boolean; }

export default function StatusBadge({ status, dot = false }: Props) {
  return (
    <span className={clsx('pill', variants[status] ?? 'bg-slate-500/12 text-slate-400 border border-slate-500/20')}>
      {dot && dots[status] && (
        <span className={clsx('w-1.5 h-1.5 rounded-full mr-1.5 shrink-0', dots[status])} />
      )}
      {status}
    </span>
  );
}
