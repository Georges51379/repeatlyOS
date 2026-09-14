-- New feature: a "Verified" badge distinct from ordinary marketplace
-- approval. `status = 'active'` already means a platform/city admin
-- approved the LISTING; `verified` is a separate, explicit signal that the
-- business's real-world identity/documents were actually checked — a
-- shopper landing in a newly-launched city should be able to tell "this
-- listing was approved" apart from "this business was vetted", since the
-- first happens for every business by definition and carries less trust
-- signal on its own.
--
-- Only a platform or city admin can set it (never the business itself,
-- and never via the general `businesses_update_owner_manager_or_admin`
-- write path) — enforced with a dedicated trigger rather than trying to
-- carve an exception into that existing policy's USING/CHECK expression.

alter table public.businesses
  add column verified boolean not null default false,
  add column verified_at timestamptz;

create or replace function public.restrict_verified_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.verified is distinct from old.verified and not public.is_city_admin(old.city_id) then
    raise exception 'Only a platform or city admin can change verified status.';
  end if;

  if new.verified is distinct from old.verified then
    new.verified_at = case when new.verified then now() else null end;
  end if;

  return new;
end;
$$;

create trigger restrict_verified_change_trigger
  before update on public.businesses
  for each row execute function public.restrict_verified_change();
