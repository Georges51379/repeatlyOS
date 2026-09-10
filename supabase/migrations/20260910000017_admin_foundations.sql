-- Phase 7 — Administration foundations. Most of the RLS groundwork already
-- exists from Phase 1 (`platform_admins`, `city_admins`, and
-- `is_city_admin()` already treats a platform admin as passing every
-- city-admin check) — what's missing is:
--   1. A way for a platform admin to find a user to grant city_admin to.
--   2. Real audit logging for the most sensitive admin action (business
--      approval/suspension/rejection) — `audit_logs` has existed since
--      Phase 1 but nothing has ever written to it until now.

-- ── profiles.email, so platform admins can look up a user to grant
--    city_admin to without needing a raw user_id ────────────────────────
-- `profiles` already grants platform admins full read access
-- (profiles_select_own: id = auth.uid() OR is_platform_admin()) — it just
-- never stored email. Backfilled from auth.users for any existing profile,
-- and the signup trigger updated to populate it going forward.
alter table public.profiles add column email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

-- ── audit logging for business status transitions ──────────────────────
-- Master-prompt §24 lists "business approved"/"business suspended" among
-- the actions that must be audited. Implemented as a trigger (not a
-- client-side insert call) so it fires no matter which UI path changed
-- the status, and can't be silently skipped by a client that chooses not
-- to log it.
create or replace function public.audit_business_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into public.audit_logs (actor_user_id, business_id, city_id, action, entity_type, entity_id, metadata)
    values (
      auth.uid(),
      new.id,
      new.city_id,
      'business_status_changed',
      'business',
      new.id::text,
      jsonb_build_object('from', old.status, 'to', new.status)
    );
  end if;
  return new;
end;
$$;

create trigger on_business_status_change
  after update on public.businesses
  for each row execute function public.audit_business_status_change();
