-- New feature: a shopper can add products from MULTIPLE businesses in the
-- same city to one cart and check out once. This does not merge the orders
-- themselves — each business still gets its own `orders` row (so its own
-- dashboard, RLS boundary, and inventory/loyalty triggers all keep working
-- completely unchanged) — it only links those orders under one
-- `delivery_groups` row so the city/business side can coordinate a single
-- delivery run instead of the shopper paying for and waiting on N separate
-- deliveries.
--
-- Deliberately NOT a real courier/dispatch integration — no actual delivery
-- partner API is wired up here (that needs a specific provider chosen,
-- which is a business decision, not a code one). This is the data model a
-- future dispatch feature (or a manual "who's delivering this batch today"
-- admin view) builds on.

create type public.delivery_group_status as enum ('pending', 'assigned', 'delivered', 'cancelled');

create table public.delivery_groups (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id) on delete cascade,
  customer_name text,
  customer_phone text not null,
  delivery_address text,
  status public.delivery_group_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index delivery_groups_city_id_idx on public.delivery_groups (city_id);

create trigger set_delivery_groups_updated_at
  before update on public.delivery_groups
  for each row execute function public.set_updated_at();

alter table public.orders
  add column delivery_group_id uuid references public.delivery_groups (id) on delete set null;

create index orders_delivery_group_id_idx on public.orders (delivery_group_id);

alter table public.delivery_groups enable row level security;

-- Guest checkout creates the group before/alongside the per-business orders
-- that reference it — same "anonymous but not a free-for-all" posture as
-- migration 20260910000014's order/booking insert policies. There is no
-- business_id to scope this to (a group can span several businesses by
-- design), so the actual abuse surface stays gated at the `orders` insert
-- rate limit (migration 20260914000004), not here.
create policy delivery_groups_public_insert on public.delivery_groups
  for insert with check (true);

-- Read: a platform admin, a city admin for that city, or a member of ANY
-- business that has an order in this group (so each participating merchant
-- can see the shared delivery context, e.g. the other stops on the same
-- run) — matching `order_items_member_read`'s pattern of anchoring
-- authorization through a join to a table that already enforces it.
create policy delivery_groups_read on public.delivery_groups
  for select using (
    public.is_platform_admin()
    or public.is_city_admin(city_id)
    or exists (
      select 1 from public.orders o
      where o.delivery_group_id = delivery_groups.id and public.is_business_member(o.business_id)
    )
  );

create policy delivery_groups_update on public.delivery_groups
  for update
  using (
    public.is_platform_admin()
    or public.is_city_admin(city_id)
    or exists (
      select 1 from public.orders o
      where o.delivery_group_id = delivery_groups.id
        and public.has_business_permission(o.business_id, 'orders.manage')
    )
  )
  with check (
    public.is_platform_admin()
    or public.is_city_admin(city_id)
    or exists (
      select 1 from public.orders o
      where o.delivery_group_id = delivery_groups.id
        and public.has_business_permission(o.business_id, 'orders.manage')
    )
  );
