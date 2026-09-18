import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
}

/** The title + subtitle + primary action button row every business
 * dashboard page repeats with slightly different markup — pulled into one
 * component so that row looks and behaves identically everywhere. */
export default function PageHeader({ title, subtitle, actionLabel, actionIcon: Icon, onAction }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
      <div>
        <h1 className="text-white font-semibold text-lg">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all press focus-ring shadow-glow-blue"
        >
          {Icon && <Icon className="w-4 h-4" />}
          {actionLabel}
        </button>
      )}
    </div>
  );
}
