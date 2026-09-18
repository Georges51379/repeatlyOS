import { useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  ClipboardCheck,
  Store,
  Building2,
  Users,
  SlidersHorizontal,
  ArrowLeft,
  Menu,
  X,
  Command as CommandIcon,
} from 'lucide-react';
import { useAdminRoles } from '../hooks/useAdminRoles';
import Breadcrumbs from './Breadcrumbs';
import CommandK, { useCommandPaletteState, type Command } from './CommandK';

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, path: '' },
  { key: 'approvals', label: 'Approvals', icon: ClipboardCheck, path: 'approvals' },
  { key: 'businesses', label: 'Businesses', icon: Store, path: 'businesses' },
  { key: 'cities', label: 'Cities', icon: Building2, path: 'cities' },
  { key: 'city-admins', label: 'City Admins', icon: Users, path: 'city-admins' },
  { key: 'settings', label: 'Settings', icon: SlidersHorizontal, path: 'settings' },
];

// A real dashboard shell for the platform admin area — previously a single
// long page with no navigation between its ~7 sections at all. Mirrors
// BusinessLayout's sidebar/breadcrumb/mobile-drawer pattern for
// consistency across every "dashboard" surface in the app (2026-09-18,
// explicit user feedback that this area felt unfinished next to the
// merchant dashboard).
export default function PlatformAdminLayout() {
  const { isPlatformAdmin, loading: rolesLoading } = useAdminRoles();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const palette = useCommandPaletteState();

  const paletteCommands = useMemo<Command[]>(
    () => [
      ...NAV_ITEMS.map((item) => ({
        id: item.key,
        label: item.label,
        group: 'Go to',
        icon: item.icon,
        to: `/platform-admin/${item.path}`,
      })),
      { id: 'my-account', label: 'My account', group: 'Account', icon: ArrowLeft, to: '/app' },
    ],
    [],
  );

  if (rolesLoading) return null;
  if (!isPlatformAdmin) return <Navigate to="/app" replace />;

  const currentSegment = location.pathname.replace(/^\/platform-admin\/?/, '').split('/')[0] ?? '';
  const currentItem = NAV_ITEMS.find((i) => i.path === currentSegment) ?? NAV_ITEMS[0];

  const navLinks = (
    <>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.key}
          to={`/platform-admin/${item.path}`}
          end={item.path === ''}
          onClick={() => setMobileNavOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-blue-600/15 text-blue-300 font-medium shadow-[inset_2px_0_0_0_theme(colors.blue.500)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`
          }
        >
          <item.icon className="w-4 h-4" />
          {item.label}
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <aside className="hidden md:flex w-56 shrink-0 border-r border-slate-800 flex-col">
        <div className="p-4 border-b border-slate-800">
          <Link to="/app" className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> My account
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
            <span className="text-white font-semibold text-sm truncate">Platform Admin</span>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1">{navLinks}</nav>
      </aside>

      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileNavOpen(false)} />
          <aside className="relative w-64 bg-slate-950 border-r border-slate-800 flex flex-col animate-drawer-in">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                <span className="text-white font-semibold text-sm">Platform Admin</span>
              </div>
              <button onClick={() => setMobileNavOpen(false)} className="text-slate-500 hover:text-slate-300 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">{navLinks}</nav>
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="border-b border-slate-800 px-4 md:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="md:hidden text-slate-400 hover:text-white p-1 -ml-1"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Breadcrumbs items={[{ label: 'Platform Admin', to: '/platform-admin' }, { label: currentItem.label }]} />
          <button
            onClick={palette.openPalette}
            className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-lg px-2.5 py-1.5 transition-colors"
          >
            <CommandIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline text-[10px] border border-slate-700 rounded px-1 py-0.5 ml-0.5">⌘K</kbd>
          </button>
        </div>
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <CommandK commands={paletteCommands} open={palette.open} onClose={palette.onClose} />
    </div>
  );
}
