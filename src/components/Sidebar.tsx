import { NavLink } from 'react-router-dom';
import {
  X, LayoutDashboard, Calendar, Users, Package, RefreshCw, CreditCard,
  CheckSquare, Bell, BarChart3, Settings, Zap, CalendarDays, FileText,
  Heart, Star, Activity, Building2, ShoppingBag, Warehouse, Home as HomeIcon,
  MessageCircle, TrendingUp, DollarSign, Gift, Clock, AlertTriangle,
  Target, Flame, Users2, Activity as ActivityIcon, Shield, Repeat,
  CalendarCheck, UserX, CreditCard as CardIcon, Building
} from 'lucide-react';
import clsx from 'clsx';
import { useDemo } from '../context/DemoContext';
import { HealthScoreBadge } from '../pages/dashboard/HealthScore';

const groups = [
  {
    label: 'Operations',
    items: [
      { label: 'Overview',          to: '/dashboard',                icon: LayoutDashboard, end: true },
      { label: 'Calendar',          to: '/dashboard/calendar',       icon: CalendarDays },
      { label: 'Bookings',          to: '/dashboard/bookings',       icon: Calendar },
      { label: 'Recurring',         to: '/dashboard/recurring',      icon: Repeat },
      { label: 'Waiting List',      to: '/dashboard/waitlist',       icon: Clock },
      { label: 'No-Shows',          to: '/dashboard/noshows',        icon: UserX },
    ],
  },
  {
    label: 'Customers',
    items: [
      { label: 'Customers',         to: '/dashboard/customers',      icon: Users },
      { label: 'Packages',          to: '/dashboard/packages',       icon: Package },
      { label: 'Subscriptions',     to: '/dashboard/subscriptions',  icon: RefreshCw },
      { label: 'Loyalty',           to: '/dashboard/loyalty',        icon: Heart },
      { label: 'Occasions',         to: '/dashboard/occasions',      icon: Gift },
      { label: 'Referrals',         to: '/dashboard/referrals',      icon: Users2 },
    ],
  },
  {
    label: 'Stock',
    items: [
      { label: 'Products',          to: '/dashboard/products',       icon: ShoppingBag },
      { label: 'Inventory',         to: '/dashboard/inventory',      icon: Warehouse },
      { label: 'Smart Reorder',     to: '/dashboard/reorder',        icon: AlertTriangle },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Payments',          to: '/dashboard/payments',       icon: CreditCard },
      { label: 'Invoices',          to: '/dashboard/invoices',       icon: FileText },
      { label: 'Payment Plans',     to: '/dashboard/partial-payments', icon: CardIcon },
      { label: 'Expenses',          to: '/dashboard/expenses',       icon: DollarSign },
      { label: 'Forecast',          to: '/dashboard/forecast',       icon: TrendingUp },
    ],
  },
  {
    label: 'Team',
    items: [
      { label: 'Staff Tasks',       to: '/dashboard/tasks',          icon: CheckSquare },
      { label: 'Staff',             to: '/dashboard/staff',          icon: Star },
      { label: 'Scheduler',         to: '/dashboard/scheduler',      icon: CalendarCheck },
      { label: 'Commissions',       to: '/dashboard/commissions',    icon: DollarSign },
      { label: 'Reminders',         to: '/dashboard/reminders',      icon: Bell },
      { label: 'Broadcast',         to: '/dashboard/broadcast',      icon: MessageCircle },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { label: '💚 Health Score',   to: '/dashboard/health',         icon: ActivityIcon },
      { label: '🔥 Heatmap',        to: '/dashboard/heatmap',        icon: Flame },
      { label: '🎯 Goals',          to: '/dashboard/goals',          icon: Target },
      { label: 'Reports',           to: '/dashboard/reports',        icon: BarChart3 },
      { label: 'Activity Log',      to: '/dashboard/activity',       icon: Activity },
    ],
  },
  {
    label: 'Enterprise',
    items: [
      { label: 'Team & Roles',      to: '/dashboard/team',           icon: Shield },
      { label: 'Announcements',     to: '/dashboard/enterprise',     icon: Bell },
      { label: 'Multi-Branch',      to: '/dashboard/branches',       icon: Building2 },
      { label: 'Enterprise Tools',  to: '/dashboard/enterprise',     icon: Building },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Settings',          to: '/dashboard/settings',       icon: Settings },
    ],
  },
];

interface SidebarProps { open: boolean; onClose: () => void; }

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { business, sidebarCollapsed } = useDemo();

  const collapsed = sidebarCollapsed;

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] lg:hidden animate-fade" onClick={onClose} />}
      <aside className={clsx(
        'fixed top-0 left-0 h-full bg-slate-950 border-r border-slate-800/80 z-40 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        collapsed ? 'w-14' : 'w-60'
      )}>
        {/* Logo */}
        <div className={clsx('flex items-center h-14 border-b border-slate-800 shrink-0', collapsed ? 'justify-center px-0' : 'justify-between px-4')}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center"><Zap size={12} className="text-white"/></div>
              <span className="text-white font-bold text-sm">RepeatlyOS</span>
            </div>
          )}
          {collapsed && <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center"><Zap size={14} className="text-white"/></div>}
          {!collapsed && <button className="lg:hidden text-slate-500 hover:text-slate-300 rounded-lg p-1 transition-colors" onClick={onClose}><X size={16}/></button>}
        </div>

        {/* Business + Health Score */}
        {!collapsed && (
          <div className="px-3 py-2.5 border-b border-slate-800/80">
            <div key={business.key} className="flex items-center gap-2.5 bg-slate-900 rounded-lg px-3 py-2 animate-fade">
              <span className="text-lg">{business.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-slate-200 text-xs font-semibold truncate">{business.name}</p>
                <p className="text-slate-500 text-xs truncate">{business.category}</p>
              </div>
              <HealthScoreBadge />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse"/>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2 space-y-3.5">
          {groups.map(g => (
            <div key={g.label}>
              {!collapsed && <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest px-3 mb-1">{g.label}</p>}
              {g.items.map(({ label, to, icon: Icon, end }) => (
                <NavLink key={`${to}-${label}`} to={to} end={end} onClick={onClose}
                  className={({ isActive }) => clsx(
                    'group relative flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-all rounded-lg mb-0.5 overflow-hidden',
                    collapsed ? 'justify-center px-0 py-2.5' : '',
                    isActive ? 'bg-blue-600/15 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 hover:translate-x-0.5'
                  )}
                  title={collapsed ? label : undefined}
                >
                  {({ isActive }) => (<>
                    {!collapsed && <span className={clsx('absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full bg-blue-500 transition-all duration-200', isActive ? 'h-4/5 opacity-100' : 'h-0 opacity-0')}/>}
                    <Icon size={13} className={clsx('transition-transform shrink-0', isActive ? 'scale-110' : 'group-hover:scale-110')}/>
                    {!collapsed && label}
                  </>)}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Home */}
        <div className={clsx('pb-1 border-t border-slate-800/60 pt-2', collapsed ? 'px-0' : 'px-2')}>
          <NavLink to="/" end onClick={onClose}
            className={({ isActive }) => clsx('group relative flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-all rounded-lg overflow-hidden', collapsed ? 'justify-center' : '', isActive ? 'bg-blue-600/15 text-blue-400' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60')}
            title={collapsed ? 'Home' : undefined}
          >
            {({ isActive }) => (<>
              {!collapsed && <span className={clsx('absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full bg-blue-500 transition-all duration-200', isActive ? 'h-4/5 opacity-100' : 'h-0 opacity-0')}/>}
              <HomeIcon size={13} className="group-hover:scale-110 transition-transform"/>
              {!collapsed && 'Back to Home (/)'}
            </>)}
          </NavLink>
        </div>

        {!collapsed && (
          <div className="px-3 py-2.5 border-t border-slate-800">
            <div className="bg-slate-900 rounded-lg px-3 py-2 text-center border border-slate-800">
              <p className="text-xs text-slate-600 flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60"/> Frontend demo · No backend
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
