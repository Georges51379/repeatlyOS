import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCurrentBusiness } from '../../hooks/useCurrentBusiness';

interface Summary {
  total_customers: number;
  new_customers_30d: number;
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  revenue_estimate: number;
  tasks_open: number;
  tasks_completed: number;
}

interface TopService {
  service_name: string;
  booking_count: number;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <p className="text-slate-500 text-xs mb-1">{label}</p>
      <p className="text-white text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function Analytics() {
  const { business } = useCurrentBusiness();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [topServices, setTopServices] = useState<TopService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    (async () => {
      const [{ data: summaryRows }, { data: topRows }] = await Promise.all([
        supabase.rpc('business_analytics_summary', { target_business_id: business.id }),
        supabase.rpc('business_top_services', { target_business_id: business.id, limit_count: 5 }),
      ]);
      setSummary((summaryRows?.[0] as Summary) ?? null);
      setTopServices((topRows ?? []) as TopService[]);
      setLoading(false);
    })();
  }, [business]);

  if (!business) return null;
  if (loading || !summary) return null;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-white font-semibold text-lg">Analytics</h1>
        <p className="text-slate-500 text-sm">{business.name}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total customers" value={summary.total_customers} />
        <StatCard label="New (30 days)" value={summary.new_customers_30d} />
        <StatCard label="Total bookings" value={summary.total_bookings} />
        <StatCard label="Pending bookings" value={summary.pending_bookings} />
        <StatCard label="Completed bookings" value={summary.completed_bookings} />
        <StatCard label="Cancelled bookings" value={summary.cancelled_bookings} />
        <StatCard label="Open tasks" value={summary.tasks_open} />
        <StatCard label="Completed tasks" value={summary.tasks_completed} />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-2 mb-1">
          <p className="text-slate-500 text-xs">Estimated revenue (completed bookings)</p>
        </div>
        <p className="text-white text-2xl font-semibold">${summary.revenue_estimate.toFixed(2)}</p>
        <div className="flex items-start gap-1.5 mt-2 text-xs text-slate-600">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Estimated from completed bookings' service prices — not a real transaction ledger. Payments/invoicing
            isn't built yet.
          </span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p className="text-white font-medium text-sm mb-3">Top services by bookings</p>
        {topServices.length === 0 ? (
          <p className="text-slate-500 text-sm">No services yet.</p>
        ) : (
          <div className="space-y-2">
            {topServices.map((s) => (
              <div key={s.service_name} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{s.service_name}</span>
                <span className="text-slate-500">{s.booking_count} bookings</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
