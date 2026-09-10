-- Phase 6 — City Marketplace, foundations. Before any public-facing page
-- can exist, the database needs to actually allow a member of the public
-- (no session, or a session with no membership on this business) to:
--   1. See businesses/products/services that are meant to be public.
--   2. Place an order or book a service without already being staff.
--
-- Neither was possible before this migration. `orders`/`bookings` INSERT
-- was gated entirely by `orders.manage`/`bookings.manage` — correct for the
-- merchant dashboard, but it meant an anonymous shopper had no path to
-- create an order at all. This migration ADDS narrowly-scoped permissive
-- policies alongside the existing ones (Postgres RLS OR's multiple
-- permissive policies for the same command together) rather than modifying
-- anything already built and verified in Phases 1-4 — the merchant-side
-- behavior is untouched.
--
-- Guest checkout, not a consumer account system: master-prompt's own
-- Lebanon-specific framing (cash/WhatsApp-first, not account-first) and
-- "don't overbuild" guidance both point away from building a full
-- CUSTOMER auth identity for a first marketplace cut. `customer_name`/
-- `customer_phone` capture who placed the order/booking without requiring
-- sign-up; a merchant can manually link it to a real `customers` row later
-- from their dashboard if they want to. `customer_id` stays nullable and
-- untouched by this migration.

alter table public.orders add column customer_name text;
alter table public.orders add column customer_phone text;
alter table public.bookings add column customer_name text;
alter table public.bookings add column customer_phone text;

-- ── public read: products/services need a marketplace-visible clause,
--    the same pattern `businesses` already uses ─────────────────────────
-- (products already had this from Phase 4 — services didn't yet, since no
-- marketplace existed to need it.)
create policy services_public_read on public.services
  for select using (
    active = true
    and booking_enabled = true
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.status = 'active' and b.marketplace_visible = true
    )
  );

-- ── public write: place an order at a marketplace-visible business ─────
create policy orders_public_marketplace_insert on public.orders
  for insert
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.status = 'active' and b.marketplace_visible = true
    )
  );

create policy order_items_public_marketplace_insert on public.order_items
  for insert
  with check (
    exists (
      select 1 from public.orders o
      join public.businesses b on b.id = o.business_id
      where o.id = order_id and b.status = 'active' and b.marketplace_visible = true
    )
  );

-- ── public write: book a service at a marketplace-visible business ─────
create policy bookings_public_marketplace_insert on public.bookings
  for insert
  with check (
    exists (
      select 1 from public.businesses b
      join public.services s on s.business_id = b.id
      where s.id = service_id
        and b.id = business_id
        and b.status = 'active' and b.marketplace_visible = true
        and s.active = true and s.booking_enabled = true
    )
  );

-- NOTE (deliberate MVP gap, not silently skipped): no rate limiting or
-- CAPTCHA on these public insert paths — a bad actor could currently spam
-- orders/bookings at any marketplace-visible business. Acceptable for an
-- initial single-city launch, but must be revisited in Phase 9 hardening
-- before this is exposed at real scale.

-- ── public stock status, WITHOUT exposing the real quantity ─────────────
-- Master-prompt §15: consumers may see "In stock"/"Low stock"/"Out of
-- stock", never the exact number, unless the merchant explicitly allows
-- it (not implemented — nothing does today). `inventory_items` has no
-- public read policy at all (correctly — it's real operational data), so
-- this function is `security definer` specifically to read it on the
-- caller's behalf while returning only a coarse status string. It
-- independently re-checks that the product is actually public
-- (active + marketplace_visible + its business is active +
-- marketplace_visible) rather than trusting the caller's claim about
-- which product_id to check.
create or replace function public.product_stock_status(target_product_id uuid)
returns text
language sql
stable
security definer set search_path = public
as $$
  select case
    when i.quantity is null then 'not_tracked'
    when i.quantity = 0 then 'out_of_stock'
    when i.quantity <= i.low_stock_threshold then 'low_stock'
    else 'in_stock'
  end
  from public.products p
  left join public.inventory_items i on i.product_id = p.id
  where p.id = target_product_id
    and p.active = true
    and p.marketplace_visible = true
    and exists (
      select 1 from public.businesses b
      where b.id = p.business_id and b.status = 'active' and b.marketplace_visible = true
    );
$$;
