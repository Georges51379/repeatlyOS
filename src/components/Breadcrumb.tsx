import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Home } from 'lucide-react';

// ─── Crumb tree — every dashboard page traces back through /dashboard to /
const CRUMB_MAP: Record<string, { label: string; parent?: string; icon?: string }> = {
  '/':                          { label: 'Home' },
  '/dashboard':                 { label: 'Dashboard',      parent: '/' },
  '/dashboard/calendar':        { label: 'Calendar',       parent: '/dashboard',              icon: '📅' },
  '/dashboard/bookings':        { label: 'Bookings',       parent: '/dashboard',              icon: '📋' },
  '/dashboard/customers':       { label: 'Customers',      parent: '/dashboard',              icon: '👥' },
  '/dashboard/products':        { label: 'Products',       parent: '/dashboard',              icon: '🛍️' },
  '/dashboard/inventory':       { label: 'Inventory',      parent: '/dashboard/products',     icon: '🏭' },
  '/dashboard/packages':        { label: 'Packages',       parent: '/dashboard/customers',    icon: '📦' },
  '/dashboard/subscriptions':   { label: 'Subscriptions',  parent: '/dashboard/customers',    icon: '🔄' },
  '/dashboard/payments':        { label: 'Payments',       parent: '/dashboard',              icon: '💵' },
  '/dashboard/invoices':        { label: 'Invoices',       parent: '/dashboard/payments',     icon: '🧾' },
  '/dashboard/tasks':           { label: 'Staff Tasks',    parent: '/dashboard',              icon: '✅' },
  '/dashboard/staff':           { label: 'Staff',          parent: '/dashboard/tasks',        icon: '⭐' },
  '/dashboard/reminders':       { label: 'Reminders',      parent: '/dashboard',              icon: '💬' },
  '/dashboard/loyalty':         { label: 'Loyalty',        parent: '/dashboard/customers',    icon: '❤️' },
  '/dashboard/reports':         { label: 'Reports',        parent: '/dashboard',              icon: '📊' },
  '/dashboard/activity':        { label: 'Activity Log',   parent: '/dashboard',              icon: '📜' },
  '/dashboard/branches':        { label: 'Multi-Branch',   parent: '/dashboard',              icon: '🏢' },
  '/dashboard/settings':        { label: 'Settings',       parent: '/dashboard',              icon: '⚙️' },
  // New features
  '/dashboard/broadcast':       { label: 'Broadcast',      parent: '/dashboard/reminders',    icon: '📢' },
  '/dashboard/forecast':        { label: 'Forecast',       parent: '/dashboard/reports',      icon: '📈' },
  '/dashboard/commissions':     { label: 'Commissions',    parent: '/dashboard/staff',        icon: '💰' },
  '/dashboard/expenses':        { label: 'Expenses',       parent: '/dashboard/reports',      icon: '📉' },
  '/dashboard/occasions':       { label: 'Occasions',      parent: '/dashboard/customers',    icon: '🎂' },
  '/dashboard/waitlist':        { label: 'Waiting List',   parent: '/dashboard/bookings',     icon: '⏳' },
  '/dashboard/reorder':         { label: 'Smart Reorder',  parent: '/dashboard/inventory',    icon: '⚡' },
  '/dashboard/health':          { label: 'Health Score',   parent: '/dashboard',              icon: '💚' },
  '/dashboard/heatmap':         { label: 'Revenue Heatmap',parent: '/dashboard/reports',      icon: '🔥' },
  '/dashboard/goals':           { label: 'Goals',          parent: '/dashboard',              icon: '🎯' },
  '/dashboard/referrals':       { label: 'Referrals',       parent: '/dashboard/customers',   icon: '🤝' },
  '/dashboard/team':            { label: 'Team & Roles',    parent: '/dashboard/settings',    icon: '🔒' },
  '/dashboard/recurring':       { label: 'Recurring',       parent: '/dashboard/bookings',    icon: '🔄' },
  '/dashboard/scheduler':       { label: 'Scheduler',       parent: '/dashboard/staff',       icon: '📅' },
  '/dashboard/noshows':         { label: 'No-Shows',        parent: '/dashboard/bookings',    icon: '🚫' },
  '/dashboard/partial-payments':{ label: 'Payment Plans',   parent: '/dashboard/payments',    icon: '💳' },
  '/dashboard/enterprise':      { label: 'Enterprise',      parent: '/dashboard',             icon: '🏢' },
};

function buildCrumbs(path: string): { path: string; label: string; icon?: string }[] {
  const crumbs: { path: string; label: string; icon?: string }[] = [];
  let current: string | undefined = path;
  const visited = new Set<string>();
  while (current && CRUMB_MAP[current] && !visited.has(current)) {
    visited.add(current);
    const entry: { label: string; parent?: string; icon?: string } = CRUMB_MAP[current];
    crumbs.unshift({ path: current, label: entry.label, icon: entry.icon });
    current = entry.parent;
  }
  return crumbs;
}

const RELATED: Record<string, { label: string; to: string }[]> = {
  '/dashboard':                 [{ label: '🏠 Home', to: '/' }],
  '/dashboard/bookings':        [{ label: '🏠 Home', to: '/' }, { label: '📅 Calendar', to: '/dashboard/calendar' }],
  '/dashboard/customers':       [{ label: '🏠 Home', to: '/' }, { label: '📦 Packages', to: '/dashboard/packages' }],
  '/dashboard/payments':        [{ label: '🏠 Home', to: '/' }, { label: '🧾 Invoices', to: '/dashboard/invoices' }],
  '/dashboard/inventory':       [{ label: '🏠 Home', to: '/' }, { label: '🛍️ Products', to: '/dashboard/products' }],
  '/dashboard/products':        [{ label: '🏠 Home', to: '/' }, { label: '🏭 Inventory', to: '/dashboard/inventory' }],
  '/dashboard/packages':        [{ label: '🏠 Home', to: '/' }, { label: '🔄 Subscriptions', to: '/dashboard/subscriptions' }],
  '/dashboard/subscriptions':   [{ label: '🏠 Home', to: '/' }, { label: '📦 Packages', to: '/dashboard/packages' }],
  '/dashboard/invoices':        [{ label: '🏠 Home', to: '/' }, { label: '💵 Payments', to: '/dashboard/payments' }],
  '/dashboard/tasks':           [{ label: '🏠 Home', to: '/' }, { label: '⭐ Staff', to: '/dashboard/staff' }],
  '/dashboard/staff':           [{ label: '🏠 Home', to: '/' }, { label: '✅ Tasks', to: '/dashboard/tasks' }],
  '/dashboard/reminders':       [{ label: '🏠 Home', to: '/' }, { label: '👥 Customers', to: '/dashboard/customers' }],
  '/dashboard/loyalty':         [{ label: '🏠 Home', to: '/' }, { label: '📊 Reports', to: '/dashboard/reports' }],
  '/dashboard/reports':         [{ label: '🏠 Home', to: '/' }, { label: '📜 Activity', to: '/dashboard/activity' }],
  '/dashboard/activity':        [{ label: '🏠 Home', to: '/' }, { label: '📊 Reports', to: '/dashboard/reports' }],
  '/dashboard/calendar':        [{ label: '🏠 Home', to: '/' }, { label: '📋 Bookings', to: '/dashboard/bookings' }],
  '/dashboard/branches':        [{ label: '🏠 Home', to: '/' }, { label: '📊 Reports', to: '/dashboard/reports' }],
  '/dashboard/settings':        [{ label: '🏠 Home', to: '/' }],
};

export default function Breadcrumb() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const crumbs = buildCrumbs(path);

  if (crumbs.length === 0) return null;

  // For /dashboard (overview), show a lean "Home" back link only
  if (path === '/dashboard') {
    return (
      <div className="flex items-center justify-between mb-5 -mt-1">
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-all group"
          >
            <Home size={12} className="group-hover:scale-110 transition-transform" />
            <span className="hidden sm:block">Home</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1 text-xs">
            <ChevronRight size={11} className="text-slate-700" />
            <span className="text-white font-semibold">Dashboard</span>
          </nav>
        </div>
        {/* Home link shown as related on overview */}
        <Link to="/" className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-2.5 py-1 rounded-lg transition-all">
          <Home size={11} /> RepeatlyOS Home
        </Link>
      </div>
    );
  }

  const parent = crumbs[crumbs.length - 2];
  const current = crumbs[crumbs.length - 1];
  const related = RELATED[path] || [];

  return (
    <div className="flex items-center justify-between mb-5 -mt-1 gap-3">
      {/* Left side: Back + full trail */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Back button → goes to logical parent */}
        <button
          onClick={() => parent ? navigate(parent.path) : navigate('/')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-all group shrink-0"
          title={`Back to ${parent?.label ?? 'Home'}`}
        >
          <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:block">Back</span>
        </button>

        {/* Full breadcrumb trail — desktop */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1 min-w-0 overflow-x-auto">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            const isHome = crumb.path === '/';
            const isDash = crumb.path === '/dashboard';
            return (
              <span key={crumb.path} className="flex items-center gap-1 shrink-0">
                {i > 0 && <ChevronRight size={11} className="text-slate-700" />}
                {isLast ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    {crumb.icon && <span className="text-sm leading-none">{crumb.icon}</span>}
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    to={crumb.path}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {isHome && <Home size={11} className="shrink-0" />}
                    {!isHome && crumb.icon && <span className="text-sm leading-none">{crumb.icon}</span>}
                    {isHome ? <span>Home</span> : isDash ? <span>Dashboard</span> : <span>{crumb.label}</span>}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>

        {/* Mobile: show "Home / CurrentPage" */}
        <div className="sm:hidden flex items-center gap-1 text-xs min-w-0">
          <Link to="/" className="text-slate-500 hover:text-white transition-colors shrink-0">
            <Home size={11} />
          </Link>
          <ChevronRight size={10} className="text-slate-700 shrink-0" />
          <span className="text-white font-semibold truncate">{current?.icon} {current?.label}</span>
        </div>
      </div>

      {/* Right side: contextual related links */}
      {related.length > 0 && (
        <div className="hidden lg:flex items-center gap-1.5 shrink-0">
          <span className="text-slate-700 text-xs">Go to:</span>
          {related.map(r => (
            <Link
              key={r.to}
              to={r.to}
              className="text-xs text-slate-500 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-2.5 py-1 rounded-lg transition-all whitespace-nowrap"
            >
              {r.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
