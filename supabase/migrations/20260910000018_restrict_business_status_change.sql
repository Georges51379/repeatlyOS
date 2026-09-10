-- Fix: businesses_update_owner_manager_or_admin (Phase 1) let ANY owner or
-- manager change `status` alongside every other column, since RLS policies
-- gate rows, not individual columns. That meant a business owner could just
-- set their own `pending_approval`/`suspended` row back to `active`
-- themselves, completely bypassing the Phase 7 admin approval/suspension
-- workflow.
--
-- Found live during Phase 7 verification (2026-09-10): a plain business
-- owner test user successfully self-suspended (and could equally have
-- self-approved) their own business via a direct PATCH.
--
-- A self-referencing subquery inside an RLS WITH CHECK to compare old vs.
-- new status has its own same-statement visibility subtleties (see prior
-- migrations' notes on RLS/RETURNING timing), so this is enforced instead
-- as a BEFORE UPDATE trigger, which gets OLD/NEW directly with no such
-- ambiguity — the same approach already used to guard
-- inventory_items.quantity against direct client writes.
create or replace function public.enforce_business_status_change_authorization()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status and not public.is_city_admin(old.city_id) then
    raise exception 'Only a city or platform admin may change a business''s status';
  end if;
  return new;
end;
$$;

create trigger enforce_business_status_change
  before update on public.businesses
  for each row execute function public.enforce_business_status_change_authorization();
