import { BadgeCheck } from 'lucide-react';
import { useI18n } from '../lib/i18n';

export default function VerifiedBadge() {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
      <BadgeCheck className="w-3.5 h-3.5" />
      {t('storefront.verified')}
    </span>
  );
}
