-- Fixes a real bug found by testing Phase 1 end-to-end against a live
-- project (not caught by build/typecheck, since it's a runtime Postgres
-- behavior, not a TypeScript one):
--
-- `INSERT ... RETURNING` re-evaluates the table's SELECT policy against the
-- just-inserted row, and — unlike UPDATE/DELETE, which silently omit a row
-- that fails that check — INSERT raises "new row violates row-level
-- security policy" if it fails. `businesses_read`'s SELECT policy depended
-- on `is_business_member(id)`, which depends on a row the `on_business_created`
-- AFTER INSERT trigger creates in a *different* table
-- (`business_memberships`). Whether that trigger-created row is visible to
-- the RETURNING-clause's policy check within the very same statement is not
-- guaranteed by Postgres — confirmed by testing: a bare `INSERT` (no
-- `Prefer: return=representation`) succeeded, while `INSERT ... RETURNING`
-- failed with exactly this error, isolating the cause to that visibility
-- check rather than the INSERT's own WITH CHECK.
--
-- Fix: add `created_by`, populated at insert time from the same row being
-- inserted (no cross-table dependency, no trigger-timing race), and let the
-- SELECT policy trust it directly.

alter table public.businesses
  add column created_by uuid references auth.users (id) default auth.uid();

drop policy if exists businesses_read on public.businesses;

create policy businesses_read on public.businesses
  for select using (
    created_by = auth.uid()
    or public.is_business_member(id)
    or public.is_city_admin(city_id)
    or (status = 'active' and marketplace_visible = true)
  );
