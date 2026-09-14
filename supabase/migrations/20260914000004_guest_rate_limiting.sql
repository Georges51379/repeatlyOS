-- Closes the MVP gap documented in migration 20260910000014: "no rate
-- limiting or CAPTCHA on these public insert paths — a bad actor could
-- currently spam orders/bookings at any marketplace-visible business...
-- must be revisited... before this is exposed at real scale."
--
-- There is no separate API server to rate-limit at (Supabase is called
-- directly from the client), so the limit is enforced as a BEFORE INSERT
-- trigger on the two guest-writable tables — this runs exactly once per row
-- regardless of which RLS policy admitted the insert, unlike embedding a
-- side effect inside a policy's USING/CHECK expression (which the planner
-- may evaluate more than once).
--
-- Scoped to anonymous traffic only (`auth.uid() is null`) — an authenticated
-- staff member recording a walk-in order/booking from the merchant
-- dashboard is not the abuse surface this closes and must not be throttled.
-- Keyed by phone number rather than IP: IPs are not reliably available to a
-- Postgres trigger from a Supabase client call, and a phone number is
-- already a required part of every guest order/booking.

create table public.guest_submission_log (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('order', 'booking')),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_phone text not null,
  created_at timestamptz not null default now()
);

create index guest_submission_log_phone_created_idx
  on public.guest_submission_log (customer_phone, created_at);

alter table public.guest_submission_log enable row level security;

-- No public policy at all — the enforcement function below is `security
-- definer` and reads/writes it on the caller's behalf; nothing else needs
-- direct access. Platform admins can still inspect it for abuse review.
create policy guest_submission_log_platform_admin_read on public.guest_submission_log
  for select using (public.is_platform_admin());

create or replace function public.enforce_guest_rate_limit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_kind text := tg_argv[0];
  v_window interval := interval '1 hour';
  v_limit int := 8;
  v_recent_count int;
begin
  if auth.uid() is not null then
    return new;
  end if;

  if new.customer_phone is null or length(trim(new.customer_phone)) = 0 then
    raise exception 'A contact phone number is required.';
  end if;

  select count(*) into v_recent_count
  from public.guest_submission_log
  where customer_phone = new.customer_phone
    and created_at > now() - v_window;

  if v_recent_count >= v_limit then
    raise exception 'Too many requests from this phone number recently. Please try again in a bit.';
  end if;

  insert into public.guest_submission_log (kind, business_id, customer_phone)
  values (v_kind, new.business_id, new.customer_phone);

  return new;
end;
$$;

create trigger enforce_guest_rate_limit_orders
  before insert on public.orders
  for each row execute function public.enforce_guest_rate_limit('order');

create trigger enforce_guest_rate_limit_bookings
  before insert on public.bookings
  for each row execute function public.enforce_guest_rate_limit('booking');
