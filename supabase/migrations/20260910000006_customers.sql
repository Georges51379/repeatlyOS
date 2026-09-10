-- Phase 3 — first real dashboard domain migrated off DemoContext's hardcoded
-- arrays onto a real, tenant-aware, RLS-protected table. Customers first
-- (per docs/REPEATLYOS_MIGRATION_PLAN.md — most self-contained; Bookings/
-- Tasks reference Services/Staff, which don't exist as real tables yet).
--
-- This is also the first table whose RLS uses the *permission* system
-- (`has_business_permission`) rather than just role checks — owners pass
-- automatically (has_business_permission's existing behavior), managers/
-- staff need `customers.view`/`customers.manage` explicitly granted on
-- their membership row. Read access is broader (any active member, so
-- staff can always see customers to do their job) but write is
-- permission-gated, matching master-prompt §7's permission vocabulary.

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  address text,
  notes text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_business_id_idx on public.customers (business_id);

create trigger set_customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

alter table public.customers enable row level security;

-- Read: any active member of the business (staff need to see customers to
-- do their job — read access isn't restricted by the customers.view
-- permission the way write is, to avoid every staff page needing a
-- separate grant just to function day-to-day).
create policy customers_member_read on public.customers
  for select using (public.is_business_member(business_id));

-- Write: gated by the customers.manage permission. Owners pass
-- automatically (has_business_permission already treats role='owner' as
-- passing every permission check); managers/staff need it explicitly
-- granted via business_memberships.permissions.
create policy customers_manage_write on public.customers
  for all
  using (public.has_business_permission(business_id, 'customers.manage'))
  with check (public.has_business_permission(business_id, 'customers.manage'));
