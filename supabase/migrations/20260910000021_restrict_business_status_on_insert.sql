-- Fix: `20260910000018_restrict_business_status_change.sql` blocked a
-- business owner from self-changing status on UPDATE, but never touched
-- INSERT — and `businesses_insert_authenticated` only checks
-- `auth.uid() is not null`, with no constraint on which status value is
-- allowed. So any authenticated user could self-register a business with
-- `status: 'active', marketplace_visible: true` directly in the initial
-- insert, completely bypassing admin approval — a more direct version of
-- the same gap the Phase 7 fix closed for updates.
--
-- Found live while verifying the faceted-search migration (2026-09-10):
-- a plain test merchant created a business with `status: 'active'` and it
-- was accepted as-is.
--
-- `Onboarding.tsx` (the only legitimate creation path) always sends
-- `status: 'pending_approval'`, so this only matters as defense-in-depth
-- against a direct API call — but that's exactly the kind of gap this
-- project has been finding via live testing rather than assuming the
-- policy comment's intent was actually enforced.
create or replace function public.enforce_business_status_on_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_city_admin(new.city_id) and new.status not in ('draft', 'pending_approval') then
    raise exception 'A new business must start as draft or pending_approval; only a city or platform admin may create one with another status.';
  end if;
  return new;
end;
$$;

create trigger enforce_business_status_insert
  before insert on public.businesses
  for each row execute function public.enforce_business_status_on_insert();
