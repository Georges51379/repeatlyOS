-- Phase 3 — third real domain: Services + Bookings (master-prompt §16).
-- Services must exist before Bookings can reference one.
--
-- `staff` stays a plain text field on bookings for now (matching how
-- `tasks.assigned_to` already works) — there's no real Staff/StaffMember
-- table yet (master-prompt §7's staff.* permissions have nothing to point
-- at), and introducing one is a bigger, separate addition, not something
-- to bundle into this migration.
--
-- KNOWN MVP GAP, noted deliberately rather than silently skipped:
-- master-prompt §16 says "Prevent overlapping bookings when applicable."
-- No DB-level exclusion constraint is added here. A real overlap
-- constraint (e.g. a `tstzrange` + `EXCLUDE USING gist`) wants a stable
-- identity to partition by (a real staff/resource id), which doesn't exist
-- yet given `staff` is just text — adding one now would either be toothless
-- (partitioned by a free-text name, easy to defeat with typos/whitespace)
-- or would force premature design of the Staff table. Revisit once a real
-- Staff/StaffMember table exists.

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  description text,
  duration_minutes integer not null default 30,
  price numeric(10, 2),
  active boolean not null default true,
  booking_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index services_business_id_idx on public.services (business_id);

create trigger set_services_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

alter table public.services enable row level security;

create policy services_member_read on public.services
  for select using (public.is_business_member(business_id));

create policy services_manage_write on public.services
  for all
  using (public.has_business_permission(business_id, 'services.manage'))
  with check (public.has_business_permission(business_id, 'services.manage'));

create type public.booking_status as enum ('pending', 'confirmed', 'completed', 'cancelled');

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  service_id uuid references public.services (id) on delete set null,
  staff text,
  scheduled_date date not null,
  start_time time not null,
  end_time time not null,
  status public.booking_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_business_id_idx on public.bookings (business_id);
create index bookings_customer_id_idx on public.bookings (customer_id);
create index bookings_scheduled_date_idx on public.bookings (business_id, scheduled_date);

create trigger set_bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

alter table public.bookings enable row level security;

create policy bookings_member_read on public.bookings
  for select using (public.is_business_member(business_id));

create policy bookings_manage_write on public.bookings
  for all
  using (public.has_business_permission(business_id, 'bookings.manage'))
  with check (public.has_business_permission(business_id, 'bookings.manage'));
