import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface Crumb {
  label: string;
  to?: string;
}

interface Props {
  items: Crumb[];
}

/** Generic, explicit breadcrumb trail — each layout (BusinessLayout,
 * PlatformAdminLayout, CityAdminDashboard) builds its own `items` array
 * from context it already has (the current business/city name, which nav
 * item matches the active route), rather than this component trying to
 * infer meaning from the raw URL. The last item is never a link — it's
 * "you are here," matching standard breadcrumb convention. Distinct from
 * the older src/components/Breadcrumb.tsx, which is hardcoded to the
 * legacy /dashboard demo's routes only and left untouched. */
export default function Breadcrumbs({ items }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 flex-wrap">
      <Home className="w-3.5 h-3.5 shrink-0" />
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3 h-3 text-slate-700 shrink-0" />}
            {item.to && !isLast ? (
              <Link to={item.to} className="hover:text-slate-300 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-slate-300 font-medium' : ''}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
