import { useEffect, useState } from 'react';
import { Info, TrendingUp, HeartPulse, Users, Award } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCurrentBusiness } from '../../hooks/useCurrentBusiness';
import type {
  RevenueHeatmapPoint,
  RevenueForecast,
  ChurnRiskCustomer,
  HealthScoreResult,
  ReferralLeaderboardEntry,
} from '../../types/domain';

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

const RISK_STYLE: Record<string, string> = {
  low: 'bg-emerald-500/15 text-emerald-400',
  medium: 'bg-amber-500/15 text-amber-400',
  high: 'bg-red-500/15 text-red-400',
};

// Real-data ports of the legacy mock dashboard's signature analytics — see
// src/pages/dashboard/{Heatmap,Forecast,HealthScore,Referrals}.tsx for the
// demo versions this complements, and
// supabase/migrations/20260914000014_advanced_analytics.sql for the
// functions backing this page. Every number here comes from a real,
// security-invoker Postgres function — RLS still applies underneath, so a
// non-member gets nothing rather than another tenant's data.
export default function Analytics() {
  const { business } = useCurrentBusiness();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [topServices, setTopServices] = useState<TopService[]>([]);
  const [heatmap, setHeatmap] = useState<RevenueHeatmapPoint[]>([]);
  const [forecast, setForecast] = useState<RevenueForecast | null>(null);
  const [churnRisk, setChurnRisk] = useState<ChurnRiskCustomer[]>([]);
  const [health, setHealth] = useState<HealthScoreResult | null>(null);
  const [referrals, setReferrals] = useState<ReferralLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    (async () => {
      const [
        { data: summaryRows },
        { data: topRows },
        { data: heatmapRows },
        { data: forecastRows },
        { data: churnRows },
        { data: healthRows },
        { data: referralRows },
      ] = await Promise.all([
        supabase.rpc('business_analytics_summary', { target_business_id: business.id }),
        supabase.rpc('business_top_services', { target_business_id: business.id, limit_count: 5 }),
        supabase.rpc('business_revenue_heatmap', { target_business_id: business.id, days_back: 90 }),
        supabase.rpc('business_revenue_forecast', { target_business_id: business.id }),
        supabase.rpc('business_customer_churn_risk', { target_business_id: business.id }),
        supabase.rpc('business_health_score', { target_business_id: business.id }),
        supabase.rpc('business_referral_leaderboard', { target_business_id: business.id, limit_count: 5 }),
      ]);
      setSummary((summaryRows?.[0] as Summary) ?? null);
      setTopServices((topRows ?? []) as TopService[]);
      setHeatmap((heatmapRows ?? []) as RevenueHeatmapPoint[]);
      setForecast((forecastRows?.[0] as RevenueForecast) ?? null);
      setChurnRisk(((churnRows ?? []) as ChurnRiskCustomer[]).filter((c) => c.risk_level !== 'low').slice(0, 8));
      setHealth((healthRows?.[0] as HealthScoreResult) ?? null);
      setReferrals((referralRows ?? []) as ReferralLeaderboardEntry[]);
      setLoading(false);
    })();
  }, [business]);

  if (!business) return null;
  if (loading || !summary) return null;

  const maxRevenue = Math.max(1, ...heatmap.map((h) => h.revenue));

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

      {health && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <HeartPulse className="w-4 h-4 text-emerald-400" />
            <p className="text-white font-medium text-sm">Business health score</p>
          </div>
          <div className="flex items-end gap-3 mb-3">
            <p className="text-white text-3xl font-bold">{health.score}</p>
            <p className="text-slate-500 text-xs mb-1">/ 100</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-500">
            <span>Revenue trend: {health.revenue_trend_points}/25</span>
            <span>Completion rate: {health.completion_rate_points}/25</span>
            <span>Repeat customers: {health.repeat_customer_points}/25</span>
            <span>Reviews: {health.review_rating_points}/25</span>
          </div>
        </div>
      )}

      {forecast && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <p className="text-white font-medium text-sm">Next 30 days revenue forecast</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-slate-500 text-xs mb-1">Floor</p>
              <p className="text-white font-semibold">${forecast.floor_case}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">Likely</p>
              <p className="text-white font-semibold">${forecast.likely_case}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">Best case</p>
              <p className="text-white font-semibold">${forecast.best_case}</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-2">Based on the last {forecast.based_on_days} days of activity.</p>
        </div>
      )}

      {heatmap.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
          <p className="text-white font-medium text-sm mb-3">Revenue heatmap (last 90 days)</p>
          <div className="flex flex-wrap gap-1">
            {heatmap.map((h) => (
              <div
                key={h.activity_date}
                title={`${h.activity_date}: $${h.revenue}`}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: `rgba(16,185,129,${0.15 + 0.85 * (h.revenue / maxRevenue)})` }}
              />
            ))}
          </div>
        </div>
      )}

      {churnRisk.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-amber-400" />
            <p className="text-white font-medium text-sm">Customers at risk of churning</p>
          </div>
          <div className="space-y-2">
            {churnRisk.map((c) => (
              <div key={c.customer_id} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{c.full_name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{c.days_since_last_activity}d ago</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${RISK_STYLE[c.risk_level]}`}>{c.risk_level}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {referrals.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-blue-400" />
            <p className="text-white font-medium text-sm">Referral leaderboard</p>
          </div>
          <div className="space-y-2">
            {referrals.map((r, i) => (
              <div key={r.referrer_phone} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">#{i + 1} {r.referrer_phone}</span>
                <span className="text-slate-500">{r.referral_count} referrals</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-2 mb-1">
          <p className="text-slate-500 text-xs">Estimated revenue (completed bookings)</p>
        </div>
        <p className="text-white text-2xl font-semibold">${summary.revenue_estimate.toFixed(2)}</p>
        <div className="flex items-start gap-1.5 mt-2 text-xs text-slate-600">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Estimated from completed bookings' service prices — see the revenue heatmap/forecast above for
            order-based revenue too.
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
