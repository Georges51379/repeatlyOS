import { AlertTriangle } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import type { BusinessAvailabilityStatus } from '../types/domain';

const KEY_BY_STATUS: Record<Exclude<BusinessAvailabilityStatus, 'normal'>, string> = {
  closed_power_cut: 'availability.closedPowerCut',
  cash_only: 'availability.cashOnly',
  closed_temporary: 'availability.closedTemporary',
};

/** Surfaces the Lebanon-specific manual override from migration
 * 20260914000008 — a scheduled power cut, cash-only moment, or short
 * closure that a recurring weekly `opening_hours` schedule can't express.
 * Renders nothing when the business is in its normal state. */
export default function AvailabilityBanner({
  status,
  note,
}: {
  status: BusinessAvailabilityStatus;
  note?: string | null;
}) {
  const { t } = useI18n();
  if (status === 'normal') return null;

  return (
    <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-4">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <span>
        {t(KEY_BY_STATUS[status])}
        {note ? ` — ${note}` : ''}
      </span>
    </div>
  );
}
