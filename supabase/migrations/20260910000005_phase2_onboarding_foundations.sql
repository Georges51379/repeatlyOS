-- Phase 2 foundations: auto-populate a new business's modules from its
-- business type's defaults, and separate "open for merchant registration"
-- from "public consumer marketplace is live" for a city (master-prompt §8
-- lists `active` and `marketplaceEnabled` as distinct fields — a merchant
-- should be able to register in a city before that city's public storefront
-- exists, per master-prompt §54: "A merchant should gain value from
-- RepeatlyOS even if the city marketplace generates zero orders").

-- Batroun is the first launch city (master-prompt §51) — open it for
-- merchant registration now. Its public consumer marketplace
-- (marketplace_enabled) stays off until Phase 6 actually builds it.
update public.cities set active = true where slug = 'batroun';

create or replace function public.copy_default_modules()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  module_key text;
  default_keys text[];
begin
  if new.business_type_key is null then
    return new;
  end if;

  select default_modules into default_keys
  from public.business_types
  where key = new.business_type_key;

  if default_keys is null then
    return new;
  end if;

  foreach module_key in array default_keys loop
    insert into public.business_modules (business_id, module_key, enabled)
    values (new.id, module_key, true)
    on conflict (business_id, module_key) do nothing;
  end loop;

  return new;
end;
$$;

drop trigger if exists on_business_created_copy_modules on public.businesses;

create trigger on_business_created_copy_modules
  after insert on public.businesses
  for each row execute function public.copy_default_modules();
