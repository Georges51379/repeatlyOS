-- Closes the MVP gap documented in migration 20260910000013: "Deliberately
-- NOT auto-decrementing inventory when an order is placed... needs a real
-- decision about which status transition triggers it, how cancellation/
-- refund reverses it, and what happens for products with no inventory
-- tracking at all." Decision made here:
--
--   * Stock is reserved (decremented) the moment an order LINE ITEM is
--     recorded — both the merchant "record a walk-in order" flow and the
--     public guest-checkout flow insert order_items immediately after the
--     order itself, so this covers both without depending on status.
--   * A product with no `inventory_items` row at all is untracked, exactly
--     as `product_stock_status` already treats it — the decrement is a
--     no-op for it (nothing to skip loudly, there's simply no ledger to
--     write to).
--   * Going negative is impossible by construction: it reuses the existing
--     `apply_inventory_movement` trigger and the `quantity >= 0` check on
--     `inventory_items`, which already reject a movement that would
--     overdraw stock. That rejection raises inside the order_items INSERT
--     transaction, so an over-sold item fails the whole order instead of
--     silently accepting it — the frontend needs to surface that failure as
--     "out of stock", it is not swallowed here.
--   * Reversal on cancel/refund: a compensating movement (+quantity) is
--     recorded when an order's status moves to 'cancelled' or 'refunded'.
--     `orders.inventory_restocked` guards against compensating twice if a
--     row is (incorrectly) moved between those two terminal states more
--     than once.

alter table public.orders
  add column inventory_restocked boolean not null default false;

create or replace function public.decrement_inventory_for_order_item()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_item_id uuid;
begin
  if new.product_id is null then
    return new;
  end if;

  select id into v_item_id from public.inventory_items where product_id = new.product_id;
  if v_item_id is null then
    return new; -- product isn't inventory-tracked; nothing to reserve
  end if;

  insert into public.inventory_movements (business_id, inventory_item_id, change_amount, reason, created_by)
  select o.business_id, v_item_id, -new.quantity, 'order_placed',
    case when auth.uid() is not null then auth.uid() else null end
  from public.orders o where o.id = new.order_id;

  return new;
end;
$$;

create trigger on_order_item_insert_decrement_inventory
  after insert on public.order_items
  for each row execute function public.decrement_inventory_for_order_item();

create or replace function public.restock_inventory_on_order_cancel()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status not in ('cancelled', 'refunded') then
    return new;
  end if;
  if old.status = new.status or new.inventory_restocked then
    return new;
  end if;

  insert into public.inventory_movements (business_id, inventory_item_id, change_amount, reason, created_by)
  select
    new.business_id,
    i.id,
    oi.quantity,
    case when new.status = 'refunded' then 'order_refunded' else 'order_cancelled' end,
    case when auth.uid() is not null then auth.uid() else null end
  from public.order_items oi
  join public.inventory_items i on i.product_id = oi.product_id
  where oi.order_id = new.id;

  new.inventory_restocked = true;
  return new;
end;
$$;

create trigger on_order_status_restock_inventory
  before update on public.orders
  for each row execute function public.restock_inventory_on_order_cancel();
