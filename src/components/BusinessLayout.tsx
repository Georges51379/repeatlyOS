import { useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  Zap,
  Users,
  KanbanSquare,
  Wrench,
  CalendarClock,
  BarChart3,
  Receipt,
  Package,
  ShoppingBag,
  Warehouse,
  ShoppingCart,
  Settings as SettingsIcon,
  ArrowLeft,
  UserCog,
  Menu,
  X,
} from 'lucide-react';
import { useCurrentBusiness } from '../hooks/useCurrentBusiness';
import { useEnabledModules } from '../hooks/useEnabledModules';
import { useAuth } from '../context/AuthContext';
import Breadcrumbs from './Breadcrumbs';

const NAV_ITEMS = [
  { key: 'products', label: 'Products', icon: ShoppingBag, path: 'products' },
  { key: 'inventory', label: 'Inventory', icon: Warehouse, path: 'inventory' },
  { key: 'orders', label: 'Orders', icon: ShoppingCart, path: 'orders' },
  { key: 'customers', label: 'Customers', icon: Users, path: 'customers' },
  { key: 'services', label: 'Services', icon: Wrench, path: 'services' },
  { key: 'bookings', label: 'Bookings', icon: CalendarClock, path: 'bookings' },
  { key: 'tasks', label: 'Tasks', icon: KanbanSquare, path: 'tasks' },
  { key: 'staff', label: 'Staff', icon: UserCog, path: 'staff' },
  { key: 'subscriptions', label: 'Packages & Subscriptions', icon: Package, path: 'memberships' },
  { key: 'payments', label: 'Payments', icon: Receipt, path: 'payments' },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, path: 'analytics' },
];
const SETTINGS_ITEM = { key: 'settings', label: 'Settings', icon: SettingsIcon, path: 'settings' };

export default function BusinessLayout() {
  const { loading: authLoading } = useAuth();
  const { membership, business } = useCurrentBusiness();
  const { enabled, loading: modulesLoading } = useEnabledModules(business?.id);
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (authLoading) return null;
  // Not a member of this business (or it doesn't exist) — never render
  // anything business-specific for it. This is a UX redirect, not the
  // security boundary: every actual query below is independently enforced
  // by RLS regardless of what this check does.
  if (!membership || !business) return <Navigate to="/app" replace />;

  const currentPath = location.pathname.split('/').pop() ?? '';
  const currentItem = [...NAV_ITEMS, SETTINGS_ITEM].find((i) => i.path === currentPath);

  const navLinks = (
    <>
      {!modulesLoading &&
        NAV_ITEMS.filter((item) => enabled.has(item.key)).map((item) => (
          <NavLink
            key={item.key}
            to={`/app/${business.id}/${item.path}`}
            onClick={() => setMobileNavOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-blue-600/15 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      <NavLink
        to={`/app/${business.id}/settings`}
        onClick={() => setMobileNavOpen(false)}
        className={({ isActive }) =>
          `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            isActive ? 'bg-blue-600/15 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`
        }
      >
        <SettingsIcon className="w-4 h-4" />
        Settings
      </NavLink>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-slate-800 flex-col">
        <div className="p-4 border-b border-slate-800">
          <Link to="/app" className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> My businesses
          </Link>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-400 shrink-0" />
            <span className="text-white font-semibold text-sm truncate">{business.name}</span>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1">{navLinks}</nav>
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileNavOpen(false)} />
          <aside className="relative w-64 bg-slate-950 border-r border-slate-800 flex flex-col animate-drawer-in">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Zap className="w-5 h-5 text-blue-400 shrink-0" />
                <span className="text-white font-semibold text-sm truncate">{business.name}</span>
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
        {/* Topbar: mobile menu trigger + breadcrumb */}
        <div className="border-b border-slate-800 px-4 md:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="md:hidden text-slate-400 hover:text-white p-1 -ml-1"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Breadcrumbs
            items={[
              { label: 'My businesses', to: '/app' },
              { label: business.name, to: `/app/${business.id}/customers` },
              { label: currentItem?.label ?? 'Dashboard' },
            ]}
          />
        </div>
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
