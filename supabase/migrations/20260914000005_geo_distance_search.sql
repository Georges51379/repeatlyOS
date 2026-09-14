-- Closes the smart-search limitation flagged in src/lib/smartSearch.ts:
-- "no PostGIS / lat-lng radius search exists... 'nearby' is purely the
-- region-based city fallback... not geographic coordinate distance."
--
-- A plain haversine SQL function is used instead of enabling the PostGIS
-- extension — with only two launch cities and a marketplace scoped to
-- Lebanon (a country roughly 200km end to end), the accuracy difference
-- between a spherical-law-of-cosines/haversine approximation and PostGIS's
-- geography type is irrelevant, and it avoids taking on an extra extension
-- dependency for a single distance calculation. Revisit if/when the catalog
-- grows large enough that this needs a spatial index rather than a function
-- evaluated per row.
--
-- Returns kilometers. `immutable` + plain `sql` so it can be used in an
-- `order by` / `where` clause efficiently.
create or replace function public.distance_km(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
)
returns double precision
language sql
immutable
parallel safe
as $$
  select 6371 * acos(
    least(1.0, greatest(-1.0,
      cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lng2) - radians(lng1))
      + sin(radians(lat1)) * sin(radians(lat2))
    ))
  )
$$;

-- Public-facing "products within N km of a point" search — mirrors
-- `product_stock_status`'s pattern of a `security definer` function that
-- independently re-checks marketplace visibility rather than trusting the
-- caller, so this can be called directly from the anonymous marketplace
-- client via `supabase.rpc(...)`.
create or replace function public.products_near(
  origin_lat double precision,
  origin_lng double precision,
  radius_km double precision default 25,
  result_limit int default 24
)
returns table (
  id uuid,
  name text,
  price numeric,
  sale_price numeric,
  business_id uuid,
  business_name text,
  business_slug text,
  city_id uuid,
  distance_km double precision
)
language sql
stable
security definer set search_path = public
as $$
  select
    p.id, p.name, p.price, p.sale_price,
    b.id as business_id, b.name as business_name, b.slug as business_slug, b.city_id,
    public.distance_km(origin_lat, origin_lng, b.lat, b.lng) as distance_km
  from public.products p
  join public.businesses b on b.id = p.business_id
  where p.active = true
    and p.marketplace_visible = true
    and b.status = 'active'
    and b.marketplace_visible = true
    and b.lat is not null
    and b.lng is not null
    and public.distance_km(origin_lat, origin_lng, b.lat, b.lng) <= radius_km
  order by distance_km asc
  limit result_limit
$$;
