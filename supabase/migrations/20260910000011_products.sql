-- Phase 4 — Commerce, first domain: Products (master-prompt §5/§12).
-- Deliberately NOT building variants/categories as separate tables yet —
-- master-prompt §5 lists ProductCategory/ProductVariant/ProductImage as
-- eventual entities, but no business type in this project's seed data
-- (barber, clothing_store, supermarket, etc.) has been exercised with real
-- product catalogs yet, and building a full variant matrix (size/color
-- combinations, each with independent stock) before a single flat product
-- table has been proven live would be premature — `category` and
-- `image_url` are kept as simple columns for now, upgradeable to real
-- tables later without breaking this one (a category text column can
-- become a foreign key via a follow-up migration once real category
-- management is needed).
--
-- Write gated by master-prompt §7's actual `products.create`/
-- `products.update`/`products.delete` permissions — collapsed to a single
-- `products.manage` check here for the same reason Customers/Services did:
-- one railroad permission per table keeps the RLS policy simple, and nothing
-- in this project yet needs create/update/delete to be independently
-- grantable for the same table. Read is open to any active member (staff
-- need to see the catalog to do their job), same reasoning as Customers/
-- Services/Bookings/Tasks.

create table public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  description text,
  category text,
  price numeric(10, 2) not null,
  sale_price numeric(10, 2),
  sku text,
  image_url text,
  active boolean not null default true,
  marketplace_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_business_id_idx on public.products (business_id);

create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;

create policy products_member_read on public.products
  for select using (
    public.is_business_member(business_id)
    or (active = true and marketplace_visible = true)
  );

create policy products_manage_write on public.products
  for all
  using (public.has_business_permission(business_id, 'products.manage'))
  with check (public.has_business_permission(business_id, 'products.manage'));
