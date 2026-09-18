import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Store, CheckCircle2, Clock3, ShoppingCart, CalendarClock, ClipboardCheck } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import PageHeader from '../../../components/PageHeader';
import StatCard from '../../../components/StatCard';
import { SkeletonCard } from '../../../components/Skeletons';

interface Counts {
  cities: number;
  businesses: number;
  activeBusinesses: number;
  pendingApproval: number;
  pendingSignups: number;
  orders: number;
  bookings: number;
}

async function countAll(table: string) {
  const { count: n } = await supabase.from(table).select('*', { count: 'exact', head: true });
  return n ?? 0;
}

async function countBusinessesByStatus(status: string) {
  const { count: n } = await supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', status);
  return n ?? 0;
}

async function countByStatus(table: string, status: string) {
  const { count: n } = await supabase.from(table).select('*', { count: 'exact', head: true }).eq('status', status);
  return n ?? 0;
}

export default function Overview() {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    (async () => {
      const [cities, businesses, activeBusinesses, pendingApproval, pendingSignups, orders, bookings] = await Promise.all([
        countAll('cities'),
        countAll('businesses'),
        countBusinessesByStatus('active'),
        countBusinessesByStatus('pending_approval'),
        countByStatus('signup_requests', 'pending'),
        countAll('orders'),
        countAll('bookings'),
      ]);
      setCounts({ cities, businesses, activeBusinesses, pendingApproval, pendingSignups, orders, bookings });
    })();
  }, []);

  const pendingTotal = (counts?.pendingApproval ?? 0) + (counts?.pendingSignups ?? 0);

  return (
    <div className="max-w-4xl">
      <PageHeader title="Overview" subtitle="Network-wide status across every city and business." />

      {pendingTotal > 0 && counts && (
        <Link
          to="/platform-admin/approvals"
          className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 hover:bg-amber-500/15 transition-colors"
        >
          <ClipboardCheck className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-200">
            <span className="font-semibold">{pendingTotal}</span> item{pendingTotal === 1 ? '' : 's'} waiting on your review
            — {counts.pendingSignups} signup request{counts.pendingSignups === 1 ? '' : 's'}, {counts.pendingApproval} business
            approval{counts.pendingApproval === 1 ? '' : 's'}.
          </p>
        </Link>
      )}

      {counts ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard title="Cities" value={counts.cities} icon={Building2} accent="blue" />
          <StatCard title="Businesses" value={counts.businesses} icon={Store} accent="purple" />
          <StatCard title="Active businesses" value={counts.activeBusinesses} icon={CheckCircle2} accent="emerald" />
          <StatCard title="Pending approval" value={counts.pendingApproval} icon={Clock3} accent="amber" />
          <StatCard title="Orders" value={counts.orders} icon={ShoppingCart} accent="cyan" />
          <StatCard title="Bookings" value={counts.bookings} icon={CalendarClock} accent="orange" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      <p className="text-xs text-slate-600 mt-6">
        MRR/churn aren't shown here — there's no payment gateway, so a plan is assigned manually from Businesses rather
        than through real billing history. Showing a computed "revenue" number without real transactions behind it
        would be misleading.
      </p>
    </div>
  );
}
