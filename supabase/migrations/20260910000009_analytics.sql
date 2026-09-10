-- Phase 3 — fourth real domain: Analytics (master-prompt §34: "Do not
-- calculate every analytics metric in the browser. Create server/
-- database-side aggregation where sensible.")
--
-- Deliberately NOT `security definer` — these are plain `language sql`
-- functions, which default to SECURITY INVOKER (run as the calling role).
-- That means every query inside still goes through the exact same RLS
-- policies as if the caller ran them directly: a non-member of
-- `target_business_id` simply gets zero/empty results (RLS filters the
-- underlying rows to nothing), not an error and not another tenant's
-- numbers. This was a deliberate choice over a plain SQL VIEW, since a
-- view's permission-checking semantics (owner vs. invoker) vary by
-- Postgres version and are easy to get wrong in a way that silently
-- bypasses RLS — a security-invoker function has no such ambiguity, it's
-- the language default.
--
-- "revenue_estimate" is exactly that — an estimate computed from completed
-- bookings' linked service price, NOT a real transaction ledger (no
-- Payments/Orders table exists yet). Labelled as an estimate in the UI too,
-- per master-prompt §34: "Do not claim financial accuracy unless
-- underlying data supports it."

create or replace function public.business_analytics_summary(target_business_id uuid)
returns table (
  total_customers bigint,
  new_customers_30d bigint,
  total_bookings bigint,
  pending_bookings bigint,
  confirmed_bookings bigint,
  completed_bookings bigint,
  cancelled_bookings bigint,
  revenue_estimate numeric,
  tasks_open bigint,
  tasks_completed bigint
)
language sql
stable
as $$
  select
    (select count(*) from public.customers where business_id = target_business_id) as total_customers,
    (select count(*) from public.customers where business_id = target_business_id and created_at >= now() - interval '30 days') as new_customers_30d,
    (select count(*) from public.bookings where business_id = target_business_id) as total_bookings,
    (select count(*) from public.bookings where business_id = target_business_id and status = 'pending') as pending_bookings,
    (select count(*) from public.bookings where business_id = target_business_id and status = 'confirmed') as confirmed_bookings,
    (select count(*) from public.bookings where business_id = target_business_id and status = 'completed') as completed_bookings,
    (select count(*) from public.bookings where business_id = target_business_id and status = 'cancelled') as cancelled_bookings,
    (
      select coalesce(sum(s.price), 0)
      from public.bookings b
      join public.services s on s.id = b.service_id
      where b.business_id = target_business_id and b.status = 'completed'
    ) as revenue_estimate,
    (select count(*) from public.tasks where business_id = target_business_id and board_column in ('todo', 'in_progress', 'issue')) as tasks_open,
    (select count(*) from public.tasks where business_id = target_business_id and board_column = 'completed') as tasks_completed;
$$;

create or replace function public.business_top_services(target_business_id uuid, limit_count int default 5)
returns table (service_name text, booking_count bigint)
language sql
stable
as $$
  select s.name as service_name, count(b.id) as booking_count
  from public.services s
  left join public.bookings b on b.service_id = s.id and b.business_id = target_business_id
  where s.business_id = target_business_id
  group by s.id, s.name
  order by booking_count desc, s.name asc
  limit limit_count;
$$;
