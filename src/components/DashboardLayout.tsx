import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useDemo } from '../context/DemoContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Breadcrumb from './Breadcrumb';
import WalkthroughPanel from './WalkthroughPanel';
import CommandPalette from './CommandPalette';
import DemoWelcome from './DemoWelcome';
import KeyboardShortcuts from './KeyboardShortcuts';
import FloatingActions from './FloatingActions';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/calendar': 'Calendar',
  '/dashboard/bookings': 'Bookings',
  '/dashboard/customers': 'Customers',
  '/dashboard/products': 'Products',
  '/dashboard/inventory': 'Inventory Management',
  '/dashboard/packages': 'Packages',
  '/dashboard/subscriptions': 'Subscriptions',
  '/dashboard/payments': 'Payments',
  '/dashboard/invoices': 'Invoices',
  '/dashboard/tasks': 'Staff Tasks',
  '/dashboard/staff': 'Staff Performance',
  '/dashboard/reminders': 'Reminders',
  '/dashboard/loyalty': 'Loyalty & Retention',
  '/dashboard/reports': 'Reports',
  '/dashboard/activity': 'Activity Log',
  '/dashboard/branches': 'Multi-Branch',
  '/dashboard/settings': 'Settings',
  '/dashboard/broadcast': 'WhatsApp Broadcast',
  '/dashboard/forecast': 'Revenue Forecast',
  '/dashboard/commissions': 'Commission Tracker',
  '/dashboard/expenses': 'Expense Tracker',
  '/dashboard/occasions': 'Birthdays & Occasions',
  '/dashboard/waitlist': 'Waiting List',
  '/dashboard/reorder': 'Smart Reorder Alerts',
  '/dashboard/health': '💚 Business Health Score',
  '/dashboard/heatmap': '🔥 Revenue Heatmap',
  '/dashboard/goals': '🎯 Goal Tracker',
  '/dashboard/referrals': '🤝 Referral Tracker',
  '/dashboard/team': '🔒 Team & Roles',
  '/dashboard/recurring': '🔄 Recurring Bookings',
  '/dashboard/scheduler': '📅 Staff Scheduler',
  '/dashboard/noshows': '🚫 No-Show Tracker',
  '/dashboard/partial-payments': '💳 Payment Plans',
  '/dashboard/enterprise': '🏢 Enterprise Tools',
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const location = useLocation();
  const { sidebarCollapsed } = useDemo();

  useEffect(() => {
    const on  = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  const title = pageTitles[location.pathname] || 'Dashboard';

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-14' : 'lg:ml-60'}`}>
        <Topbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 p-4 lg:p-5 overflow-x-hidden">
          {isOffline && (
            <div className="mb-3 bg-amber-500/15 border border-amber-500/30 rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-amber-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              You're offline — RepeatlyOS is running from cache. Changes will sync when reconnected.
            </div>
          )}
          <Breadcrumb />
          <Outlet />
        </main>
      </div>
      <WalkthroughPanel />
      <CommandPalette />
      <DemoWelcome />
      <KeyboardShortcuts />
      <FloatingActions />
    </div>
  );
}
