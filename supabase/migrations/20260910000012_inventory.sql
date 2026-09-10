-- Phase 4 — Inventory (master-prompt §12: current quantity, SKU, low-stock
-- threshold, stock adjustments, inventory history).
--
-- `inventory_movements` is the append-only source of truth (a real ledger,
-- per master-prompt §27's general preference for preserving history over
-- destructive overwrites) — every stock change (restock, sale, correction)
-- is a row here, never edited or deleted. `inventory_items.quantity` is a
-- denormalized running total, maintained ONLY by the
-- `apply_inventory_movement` trigger, never written directly by the
-- application — this guarantees quantity can never drift from the sum of
-- its movements, because there is no code path that sets it any other way.
--
-- Not every product needs inventory tracking (a business without the
-- `inventory` module, or a services-only business, has no reason to);
-- `inventory_items` rows are created lazily (one per product, on demand),
-- not automatically for every product.
--
-- `quantity >= 0` is enforced at the database level — a movement that
-- would take stock negative is rejected outright, not silently allowed.

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  low_stock_threshold integer not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id)
);

create index inventory_items_business_id_idx on public.inventory_items (business_id);

create trigger set_inventory_items_updated_at
  before update on public.inventory_items
  for each row execute function public.set_updated_at();

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items (id) on delete cascade,
  change_amount integer not null,
  reason text not null default 'adjustment',
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index inventory_movements_business_id_idx on public.inventory_movements (business_id);
create index inventory_movements_item_id_idx on public.inventory_movements (inventory_item_id);

-- Sets a transaction-local flag before its internal UPDATE so
-- `reject_direct_quantity_change` (below) can tell "this update came from
-- the movement ledger" apart from "a client PATCHed quantity directly" —
-- without this, the RLS policy on inventory_items would only gate WHICH
-- ROWS can be updated, not WHICH COLUMNS, and a client could set quantity
-- to anything via a normal PATCH regardless of what any movement rows say.
create or replace function public.apply_inventory_movement()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform set_config('repeatlyos.internal_inventory_update', 'true', true);
  update public.inventory_items
  set quantity = quantity + new.change_amount
  where id = new.inventory_item_id;
  perform set_config('repeatlyos.internal_inventory_update', 'false', true);
  return new;
end;
$$;

create trigger on_inventory_movement_insert
  after insert on public.inventory_movements
  for each row execute function public.apply_inventory_movement();

create or replace function public.reject_direct_quantity_change()
returns trigger
language plpgsql
as $$
begin
  if new.quantity is distinct from old.quantity
     and coalesce(current_setting('repeatlyos.internal_inventory_update', true), 'false') <> 'true' then
    raise exception 'quantity can only be changed by inserting an inventory_movements row, not updated directly';
  end if;
  return new;
end;
$$;

create trigger reject_direct_quantity_change_trigger
  before update on public.inventory_items
  for each row execute function public.reject_direct_quantity_change();

alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;

create policy inventory_items_member_read on public.inventory_items
  for select using (public.is_business_member(business_id));

-- Only INSERT (create the tracking row) and UPDATE (change the low-stock
-- threshold) are exposed to `inventory.adjust` — quantity itself is never
-- writable directly (no write path bypasses the movement ledger).
create policy inventory_items_adjust_write on public.inventory_items
  for all
  using (public.has_business_permission(business_id, 'inventory.adjust'))
  with check (public.has_business_permission(business_id, 'inventory.adjust'));

create policy inventory_movements_member_read on public.inventory_movements
  for select using (public.is_business_member(business_id));

-- Insert-only by design (no update/delete policy at all) — a movement,
-- once recorded, is permanent history.
create policy inventory_movements_adjust_insert on public.inventory_movements
  for insert with check (public.has_business_permission(business_id, 'inventory.adjust'));
