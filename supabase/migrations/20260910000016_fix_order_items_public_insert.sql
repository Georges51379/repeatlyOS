-- Fixes a second real bug found while testing Phase 6 guest checkout:
-- `order_items_public_marketplace_insert`'s WITH CHECK used an inline
-- `exists (select 1 from public.orders o join public.businesses b ...)`
-- subquery. That subquery is itself subject to RLS on `orders` for the
-- CALLING role — and `orders` has no public SELECT policy at all (only a
-- public INSERT policy from this same migration set), so an anonymous
-- caller's subquery saw zero matching rows, even for the order they had
-- just created in a separate request moments earlier. Confirmed live: the
-- guest order insert itself succeeded (its own check only needed to read
-- `businesses`, which DOES have a public-read clause), but adding an
-- order_item to it failed with "new row violates row-level security
-- policy for table order_items" every time.
--
-- Fix: route the check through a `security definer` function instead of a
-- bare subquery — the same pattern every other cross-table RLS check in
-- this project already uses (`is_business_member`, `has_business_permission`,
-- etc.), for exactly this reason: a security definer function reads the
-- referenced tables with its own (elevated) privileges, not the caller's,
-- so it isn't blocked by the caller's own lack of SELECT rights on them.

create or replace function public.order_is_public_marketplace(target_order_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.orders o
    join public.businesses b on b.id = o.business_id
    where o.id = target_order_id and b.status = 'active' and b.marketplace_visible = true
  );
$$;

drop policy if exists order_items_public_marketplace_insert on public.order_items;

create policy order_items_public_marketplace_insert on public.order_items
  for insert
  with check (public.order_is_public_marketplace(order_id));
