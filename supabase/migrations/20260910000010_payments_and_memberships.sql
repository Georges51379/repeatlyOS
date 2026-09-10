-- Phase 3 — final two real domains, closing out the phase before Phase 4.
--
-- 1. `payments`: money collected from a customer, optionally tied to a
--    booking. Read is gated by `finance.view`, not just "any active
--    member" the way Customers/Services/Bookings read access is — money is
--    more sensitive than contact info, and master-prompt §7 explicitly
--    lists finance.view as its own permission (unlike customers/services/
--    bookings, which only got a single combined read policy here because
--    staff plausibly need that data to do their day-to-day job; front-desk
--    staff don't inherently need to see financial records).
--
-- 2. `customer_memberships`: master-prompt §40's "CustomerMembership /
--    CustomerSubscription" — a merchant selling a recurring plan or a
--    session package to their OWN customer. Explicitly NOT the same thing
--    as a future BusinessSaaSSubscription (Phase 8, RepeatlyOS billing a
--    business) — kept in a distinctly-named table for exactly that reason.
--    Read is open to any active member (front-desk staff need to check
--    "does this customer have sessions left" routinely); write (selling or
--    editing a paid plan) is gated by `finance.manage`, since it's
--    fundamentally a financial transaction.

create type public.payment_method as enum ('cash', 'whish', 'omt', 'bank_transfer', 'pay_at_store');
create type public.payment_status as enum ('pending', 'paid', 'partial', 'refunded');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  booking_id uuid references public.bookings (id) on delete set null,
  amount numeric(10, 2) not null,
  method public.payment_method not null default 'cash',
  status public.payment_status not null default 'paid',
  reference text,
  notes text,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_business_id_idx on public.payments (business_id);
create index payments_customer_id_idx on public.payments (customer_id);

create trigger set_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

create policy payments_finance_view_read on public.payments
  for select using (public.has_business_permission(business_id, 'finance.view'));

create policy payments_finance_manage_write on public.payments
  for all
  using (public.has_business_permission(business_id, 'finance.manage'))
  with check (public.has_business_permission(business_id, 'finance.manage'));

create type public.membership_plan_type as enum ('package', 'subscription');
create type public.customer_membership_status as enum ('active', 'expired', 'cancelled', 'paused');

create table public.customer_memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  plan_type public.membership_plan_type not null,
  plan_name text not null,
  price numeric(10, 2),
  billing_interval text,
  sessions_total integer,
  sessions_used integer not null default 0,
  status public.customer_membership_status not null default 'active',
  starts_at date not null default current_date,
  ends_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customer_memberships_business_id_idx on public.customer_memberships (business_id);
create index customer_memberships_customer_id_idx on public.customer_memberships (customer_id);

create trigger set_customer_memberships_updated_at
  before update on public.customer_memberships
  for each row execute function public.set_updated_at();

alter table public.customer_memberships enable row level security;

create policy customer_memberships_member_read on public.customer_memberships
  for select using (public.is_business_member(business_id));

create policy customer_memberships_finance_manage_write on public.customer_memberships
  for all
  using (public.has_business_permission(business_id, 'finance.manage'))
  with check (public.has_business_permission(business_id, 'finance.manage'));
