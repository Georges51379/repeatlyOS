-- New feature: Lebanon-specific "Open Now" accuracy. `opening_hours` alone
-- silently lies to a shopper during a scheduled power cut, a cash-only
-- moment (card machine/generator down), or an unplanned short closure —
-- none of which fit a recurring weekly-hours schedule. This is a manual,
-- merchant-set override layered on top of `opening_hours`, not a replacement
-- for it; the storefront/search should show the override when present and
-- fall back to the regular schedule otherwise.

create type public.business_availability_status as enum (
  'normal', 'closed_power_cut', 'cash_only', 'closed_temporary'
);

alter table public.businesses
  add column availability_override public.business_availability_status not null default 'normal',
  add column availability_note text,
  add column availability_updated_at timestamptz;

-- Keep `availability_updated_at` accurate without relying on every caller to
-- set it — matches the spirit of `set_updated_at`, but only touches this
-- specific timestamp so it clearly reflects "when did the override last
-- change", not "when was this row last touched for any reason".
create or replace function public.set_availability_updated_at()
returns trigger
language plpgsql
as $$
begin
  if new.availability_override is distinct from old.availability_override
     or new.availability_note is distinct from old.availability_note then
    new.availability_updated_at = now();
  end if;
  return new;
end;
$$;

create trigger set_business_availability_updated_at
  before update on public.businesses
  for each row execute function public.set_availability_updated_at();
