-- Phase 8 (scoped 2026-09-10) — structured product search, part 1: faceted
-- attributes. Today's marketplace search (`Search.tsx`, migration
-- 20260910000014) only does an ILIKE against `products.name`, so a query
-- like "Nike Kobe basketball shoes, size 43, black" can only match if that
-- whole phrase happens to sit inside the product's name string. This adds
-- real structured attributes a merchant can tag a product with (brand,
-- size, color, edition, ...) and that a shopper can filter by.
--
-- Free-form key/value pairs rather than fixed columns (brand/size/color/…)
-- deliberately — different business types need different facets (shoes:
-- size/color/brand; a bakery: flavor/weight), matching the
-- business-templates-as-configuration pattern already used for
-- `business_types.default_modules`. One row per (product, key): a product
-- is a specific variant here, not a size/color matrix — consistent with
-- this codebase's deliberately simple (no variant-matrix) product model.

create table public.product_attributes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  key text not null,
  value text not null,
  created_at timestamptz not null default now(),
  unique (product_id, key)
);

create index product_attributes_key_value_idx on public.product_attributes (key, value);

alter table public.product_attributes enable row level security;

-- Read: deliberately just re-checks visibility of the parent `products` row
-- rather than re-deriving the member-or-public-marketplace rule here. The
-- subquery below is itself subject to RLS for the calling role (same as
-- every other cross-table RLS check in this project), so it only matches
-- when `products_member_read` would already let this caller see that
-- product — meaning this policy automatically stays correct if that rule
-- ever changes (e.g. the Phase 6 fix that added the parent-business check),
-- instead of a second copy of that logic silently drifting out of sync.
create policy product_attributes_read on public.product_attributes
  for select using (
    exists (select 1 from public.products p where p.id = product_attributes.product_id)
  );

-- Write: only an owner/manager of the product's own business.
create policy product_attributes_write on public.product_attributes
  for all
  using (
    exists (
      select 1 from public.products p
      where p.id = product_attributes.product_id
        and public.has_business_role(p.business_id, array['owner', 'manager']::public.membership_role[])
    )
  )
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_attributes.product_id
        and public.has_business_role(p.business_id, array['owner', 'manager']::public.membership_role[])
    )
  );
