-- Ports the legacy mock-dashboard's signature analytics (revenue heatmap,
-- revenue forecast, customer churn risk, health score, referral leaderboard
-- — see src/pages/dashboard/{Heatmap,Forecast,HealthScore,Referrals}.tsx for
-- the demo versions this replaces) onto real data, following
-- `business_analytics_summary`'s established pattern from migration
-- 20260910000009: plain `language sql` functions (SECURITY INVOKER, not
-- DEFINER) so RLS still applies to every query inside — a non-member gets
-- empty results, never another tenant's numbers, with no separate
-- authorization check needed in the function body.
--
-- Revenue here is real (orders.total_amount + completed bookings' service
-- price), not the bookings-only estimate the original function used, now
-- that Orders/Payments actually exist.

-- ── Revenue heatmap: one row per day with any activity, for the last N days.
create or replace function public.business_revenue_heatmap(target_business_id uuid, days_back int default 365)
returns table (activity_date date, revenue numeric)
language sql
stable
as $$
  with order_revenue as (
    select created_at::date as d, sum(total_amount) as amt
    from public.orders
    where business_id = target_business_id
      and status = 'completed'
      and created_at >= now() - (days_back || ' days')::interval
    group by 1
  ),
  booking_revenue as (
    select b.scheduled_date as d, sum(s.price) as amt
    from public.bookings b
    join public.services s on s.id = b.service_id
    where b.business_id = target_business_id
      and b.status = 'completed'
      and b.scheduled_date >= (now() - (days_back || ' days')::interval)::date
    group by 1
  )
  select d as activity_date, sum(amt) as revenue
  from (
    select * from order_revenue
    union all
    select * from booking_revenue
  ) combined
  group by d
  order by d;
$$;

-- ── Revenue forecast: floor/likely/best-case next-30-day projection from
-- trailing 90-day daily average and its variance — a plain statistical
-- projection, not a machine-learning model, and explicitly not presented as
-- more precise than that in the UI that consumes it.
create or replace function public.business_revenue_forecast(target_business_id uuid)
returns table (floor_case numeric, likely_case numeric, best_case numeric, based_on_days int)
language sql
stable
as $$
  with daily as (
    select activity_date, revenue
    from public.business_revenue_heatmap(target_business_id, 90)
  ),
  stats as (
    select
      coalesce(avg(revenue), 0) as avg_daily,
      coalesce(stddev_pop(revenue), 0) as stddev_daily,
      count(*) as sample_days
    from daily
  )
  select
    round(greatest(0, (avg_daily - stddev_daily)) * 30, 2) as floor_case,
    round(avg_daily * 30, 2) as likely_case,
    round((avg_daily + stddev_daily) * 30, 2) as best_case,
    sample_days::int as based_on_days
  from stats;
$$;

-- ── Customer churn risk: days since a customer's last order/booking versus
-- their own historical average gap between visits (falls back to a fixed
-- 45-day threshold for a customer with only one visit, since there's no
-- personal average to compare against yet).
create or replace function public.business_customer_churn_risk(target_business_id uuid)
returns table (
  customer_id uuid,
  full_name text,
  last_activity_at timestamptz,
  days_since_last_activity int,
  risk_level text
)
language sql
stable
as $$
  with activity as (
    select customer_id, created_at as at from public.orders
    where business_id = target_business_id and customer_id is not null and status = 'completed'
    union all
    select customer_id, (scheduled_date + start_time)::timestamptz as at from public.bookings
    where business_id = target_business_id and customer_id is not null and status = 'completed'
  ),
  per_customer as (
    select
      customer_id,
      max(at) as last_activity_at,
      count(*) as visit_count,
      case when count(*) > 1
        then (max(at) - min(at)) / greatest(count(*) - 1, 1)
        else interval '45 days'
      end as avg_gap
    from activity
    group by customer_id
  )
  select
    c.id as customer_id,
    c.full_name,
    pc.last_activity_at,
    extract(day from now() - pc.last_activity_at)::int as days_since_last_activity,
    case
      when now() - pc.last_activity_at > pc.avg_gap * 2 then 'high'
      when now() - pc.last_activity_at > pc.avg_gap * 1.25 then 'medium'
      else 'low'
    end as risk_level
  from per_customer pc
  join public.customers c on c.id = pc.customer_id
  where c.business_id = target_business_id
  order by days_since_last_activity desc;
$$;

-- ── Health score: a transparent, documented 0-100 composite — not a black
-- box. Four equally-weighted components (25 points each):
--   1. Revenue trend: this 30 days vs. the previous 30 days.
--   2. Completion rate: completed vs. cancelled orders+bookings.
--   3. Repeat-customer rate: customers with 2+ completed visits ever.
--   4. Average review rating (migration 20260914000013), scaled to 25.
create or replace function public.business_health_score(target_business_id uuid)
returns table (
  score int,
  revenue_trend_points numeric,
  completion_rate_points numeric,
  repeat_customer_points numeric,
  review_rating_points numeric
)
language sql
stable
as $$
  with revenue_this AS (
    select coalesce(sum(revenue), 0) as amt from public.business_revenue_heatmap(target_business_id, 30)
  ),
  revenue_prev AS (
    select coalesce(sum(revenue), 0) as amt
    from (
      select activity_date, revenue from public.business_revenue_heatmap(target_business_id, 60)
      except
      select activity_date, revenue from public.business_revenue_heatmap(target_business_id, 30)
    ) x
  ),
  completion as (
    select
      count(*) filter (where status = 'completed') as completed_n,
      count(*) filter (where status in ('cancelled', 'refunded')) as cancelled_n
    from (
      select status::text from public.orders where business_id = target_business_id
      union all
      select status::text from public.bookings where business_id = target_business_id
    ) x
  ),
  repeat_rate as (
    select
      count(*) filter (where visits >= 2)::numeric / greatest(count(*), 1) as ratio
    from (
      select customer_id, count(*) as visits
      from (
        select customer_id from public.orders where business_id = target_business_id and status = 'completed' and customer_id is not null
        union all
        select customer_id from public.bookings where business_id = target_business_id and status = 'completed' and customer_id is not null
      ) v
      group by customer_id
    ) per_cust
  ),
  reviews_avg as (
    select coalesce(avg(rating), 0) as avg_rating from public.reviews where business_id = target_business_id
  )
  select
    least(100, greatest(0, round(
      revenue_pts + completion_pts + repeat_pts + review_pts
    )))::int as score,
    round(revenue_pts, 1), round(completion_pts, 1), round(repeat_pts, 1), round(review_pts, 1)
  from (
    select
      case
        when (select amt from revenue_prev) = 0 and (select amt from revenue_this) = 0 then 12.5
        when (select amt from revenue_prev) = 0 then 25
        else least(25, greatest(0, 12.5 + 12.5 * (((select amt from revenue_this) - (select amt from revenue_prev)) / (select amt from revenue_prev))))
      end as revenue_pts,
      case when (select completed_n + cancelled_n from completion) = 0 then 12.5
        else 25 * (select completed_n from completion)::numeric / (select completed_n + cancelled_n from completion)
      end as completion_pts,
      25 * (select ratio from repeat_rate) as repeat_pts,
      5 * (select avg_rating from reviews_avg) as review_pts
  ) x;
$$;

-- ── Referrals: a customer refers another by sharing their own phone number
-- at checkout; both are tracked so the business can see who's driving
-- repeat business, and (optionally, decided per-business, not enforced
-- here) reward the referrer.
create table public.customer_referrals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  referrer_phone text not null,
  referred_phone text not null,
  order_id uuid references public.orders (id) on delete set null,
  created_at timestamptz not null default now(),
  check (referrer_phone <> referred_phone)
);

create index customer_referrals_business_id_idx on public.customer_referrals (business_id);

alter table public.customer_referrals enable row level security;

create policy customer_referrals_member_read on public.customer_referrals
  for select using (public.is_business_member(business_id));

-- Guest checkout can record "referred by phone X" the same anonymous way it
-- already records the order itself.
create policy customer_referrals_public_insert on public.customer_referrals
  for insert
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.status = 'active' and b.marketplace_visible = true
    )
  );

create or replace function public.business_referral_leaderboard(target_business_id uuid, limit_count int default 10)
returns table (referrer_phone text, referral_count bigint)
language sql
stable
as $$
  select referrer_phone, count(*) as referral_count
  from public.customer_referrals
  where business_id = target_business_id
  group by referrer_phone
  order by referral_count desc
  limit limit_count;
$$;
