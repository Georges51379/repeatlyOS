import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';
import { Zap, Users, KanbanSquare, Settings as SettingsIcon, ArrowLeft } from 'lucide-react';
import { useCurrentBusiness } from '../hooks/useCurrentBusiness';
import { useEnabledModules } from '../hooks/useEnabledModules';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { key: 'customers', label: 'Customers', icon: Users, path: 'customers' },
  { key: 'tasks', label: 'Tasks', icon: KanbanSquare, path: 'tasks' },
];

export default function BusinessLayout() {
  const { loading: authLoading } = useAuth();
  const { membership, business } = useCurrentBusiness();
  const { enabled, loading: modulesLoading } = useEnabledModules(business?.id);

  if (authLoading) return null;
  // Not a member of this business (or it doesn't exist) — never render
  // anything business-specific for it. This is a UX redirect, not the
  // security boundary: every actual query below is independently enforced
  // by RLS regardless of what this check does.
  if (!membership || !business) return <Navigate to="/app" replace />;

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <aside className="w-56 shrink-0 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <Link to="/app" className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> My businesses
          </Link>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-400 shrink-0" />
            <span className="text-white font-semibold text-sm truncate">{business.name}</span>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {!modulesLoading &&
            NAV_ITEMS.filter((item) => enabled.has(item.key)).map((item) => (
              <NavLink
                key={item.key}
                to={`/app/${business.id}/${item.path}`}
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
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-blue-600/15 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <SettingsIcon className="w-4 h-4" />
            Settings
          </NavLink>
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
