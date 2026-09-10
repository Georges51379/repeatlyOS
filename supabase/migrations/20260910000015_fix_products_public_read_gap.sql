-- Fixes a real bug found while testing Phase 6: `products_member_read`
-- (from Phase 4, migration 20260910000011) checked ONLY the product's own
-- `active`/`marketplace_visible` flags for its public-read clause — never
-- the parent business's `status`/`marketplace_visible`. Confirmed live: a
-- product with marketplace_visible=true on a business still in `draft`
-- (not approved, not marketplace_visible) was publicly readable anyway.
-- This directly contradicts master-prompt §9: "Do not make merchant
-- content publicly visible unless business status and listing status
-- allow it."
--
-- The Phase 4 verification of this policy never actually tested this
-- specific combination (product visible + business not visible), so it
-- passed at the time on a narrower case. `services_public_read` and the
-- new orders/bookings public-insert policies (both from Phase 6, migration
-- 20260910000014) already checked the parent business correctly — this
-- brings `products` in line with that same, correct pattern.

drop policy if exists products_member_read on public.products;

create policy products_member_read on public.products
  for select using (
    public.is_business_member(business_id)
    or (
      active = true
      and marketplace_visible = true
      and exists (
        select 1 from public.businesses b
        where b.id = business_id and b.status = 'active' and b.marketplace_visible = true
      )
    )
  );
