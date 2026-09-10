-- Phase 4 — final Commerce domain: Orders (master-prompt §12/§18).
--
-- "Cart" (master-prompt §18) is deliberately NOT built here: a cart is a
-- consumer-marketplace concept (add to cart, check out), and no consumer-
-- facing marketplace exists yet (Phase 6) — there is nothing to shop from.
-- Building cart scaffolding now would be fake UI with no real shopping flow
-- behind it. What's needed on the merchant-dashboard side today is real
-- order entry/management (a merchant recording a walk-in or phone order),
-- which is what this migration builds.
--
-- `order_items` SNAPSHOTS `product_name` and `unit_price` at order time,
-- rather than only storing `product_id` and looking up the product's
-- CURRENT name/price — per master-prompt §27 ("preserve historical
-- financial/order records"), an order placed today must still show
-- accurate historical pricing even if the product is renamed, repriced, or
-- deleted later. `product_id` itself is nullable with `on delete set null`
-- for the same reason: deleting a product must never delete or corrupt
-- past order history.
--
-- Deliberately NOT auto-decrementing inventory when an order is placed —
-- that needs a real decision about which status transition triggers it,
-- how cancellation/refund reverses it, and what happens for products with
-- no inventory tracking at all. Left as a manual step (adjust stock via
-- the Inventory page) for this first cut rather than guessing at that
-- workflow now; revisit once real order fulfillment patterns are clearer.

create type public.order_status as enum (
  'new', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled', 'refunded'
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  status public.order_status not null default 'new',
  delivery_method text not null default 'pickup',
  delivery_address text,
  total_amount numeric(10, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_business_id_idx on public.orders (business_id);
create index orders_customer_id_idx on public.orders (customer_id);

create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  unit_price numeric(10, 2) not null,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items (order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy orders_member_read on public.orders
  for select using (public.is_business_member(business_id));

create policy orders_manage_write on public.orders
  for all
  using (public.has_business_permission(business_id, 'orders.manage'))
  with check (public.has_business_permission(business_id, 'orders.manage'));

-- order_items has no business_id of its own — authorization is checked via
-- the parent order's business_id, keeping tenant isolation anchored to one
-- place rather than duplicating business_id onto every line-item table.
create policy order_items_member_read on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and public.is_business_member(o.business_id)
    )
  );

create policy order_items_manage_write on public.order_items
  for all
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and public.has_business_permission(o.business_id, 'orders.manage')
    )
  )
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and public.has_business_permission(o.business_id, 'orders.manage')
    )
  );
