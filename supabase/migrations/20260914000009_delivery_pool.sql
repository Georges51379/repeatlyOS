-- New feature: a shared, city-scoped delivery pool. Most small Lebanese
-- shops don't run their own delivery fleet — this models several nearby
-- businesses opting into a shared rider/courier pool per city so they can
-- coordinate delivery capacity, rather than each needing its own courier
-- relationship before it can offer delivery at all.
--
-- Deliberately just the opt-in/coordination record, not a real courier
-- integration (same scope boundary as `delivery_groups` in the previous
-- migration) — actually dispatching a rider needs a specific local courier
-- or in-house rider roster, which is an operational decision per city, not
-- something to hardcode here.

create table public.delivery_pool_members (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  coverage_note text,
  active boolean not null default true,
  joined_at timestamptz not null default now(),
  unique (city_id, business_id)
);

create index delivery_pool_members_city_id_idx on public.delivery_pool_members (city_id);

alter table public.delivery_pool_members enable row level security;

-- Public read: a shopper-facing "delivered via the {city} shared pool" badge
-- needs to be readable without auth, same as any other marketplace-visible
-- business fact — but only for the business's own active membership row,
-- not to browse the whole pool's business list at once (kept to a per-
-- business lookup rather than a bulk directory).
create policy delivery_pool_members_public_read on public.delivery_pool_members
  for select using (
    active = true
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.status = 'active' and b.marketplace_visible = true
    )
  );

create policy delivery_pool_members_member_read on public.delivery_pool_members
  for select using (public.is_business_member(business_id) or public.is_city_admin(city_id));

create policy delivery_pool_members_manage_write on public.delivery_pool_members
  for all
  using (
    public.has_business_role(business_id, array['owner', 'manager']::public.membership_role[])
    or public.is_city_admin(city_id)
  )
  with check (
    public.has_business_role(business_id, array['owner', 'manager']::public.membership_role[])
    or public.is_city_admin(city_id)
  );
