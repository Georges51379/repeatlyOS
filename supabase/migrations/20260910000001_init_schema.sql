-- RepeatlyOS Phase 1 — Foundations schema
-- City -> Business -> BusinessMembership -> Users, plus module system foundation.
-- Run this file, then 20260910000002_rls_policies.sql, in the Supabase SQL editor
-- (or `supabase db push` if using the CLI), in filename order.

create extension if not exists "pgcrypto";

-- ── updated_at helper ────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── profiles (1:1 with auth.users) ──────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── platform + city admins ──────────────────────────────────────────────────
create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  display_name text,
  country text not null default 'Lebanon',
  region text,
  active boolean not null default false,
  marketplace_enabled boolean not null default false,
  logo_url text,
  cover_image_url text,
  description text,
  seo_title text,
  seo_description text,
  custom_domain text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_cities_updated_at
  before update on public.cities
  for each row execute function public.set_updated_at();

create table public.city_admins (
  user_id uuid not null references auth.users (id) on delete cascade,
  city_id uuid not null references public.cities (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, city_id)
);

-- ── business type templates (configuration, not hardcoded enums in app code) ─
-- Master-prompt §10: business templates must be data, not `if type === 'barber'`.
create table public.business_types (
  key text primary key,
  label text not null,
  default_modules text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ── businesses (tenants) ─────────────────────────────────────────────────────
create type public.business_status as enum (
  'draft', 'pending_approval', 'active', 'suspended', 'rejected', 'archived'
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id),
  business_type_key text references public.business_types (key),
  name text not null,
  slug text not null,
  description text,
  logo_url text,
  cover_image_url text,
  category text,
  status public.business_status not null default 'draft',
  marketplace_visible boolean not null default false,
  phone text,
  whatsapp text,
  email text,
  address text,
  lat double precision,
  lng double precision,
  opening_hours jsonb not null default '{}'::jsonb,
  social_links jsonb not null default '{}'::jsonb,
  delivery_config jsonb not null default
    '{"pickup": true, "merchantDelivery": false, "deliveryFee": 0, "deliveryAreas": []}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_id, slug)
);

create index businesses_city_id_idx on public.businesses (city_id);
create index businesses_status_idx on public.businesses (status);
create index businesses_business_type_key_idx on public.businesses (business_type_key);

create trigger set_businesses_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

-- ── business memberships (replaces a single "role" string on the user) ──────
create type public.membership_role as enum ('owner', 'manager', 'staff');
create type public.membership_status as enum ('invited', 'active', 'removed');

create table public.business_memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.membership_role not null default 'staff',
  permissions text[] not null default '{}',
  status public.membership_status not null default 'active',
  invited_email text,
  invited_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create index memberships_user_id_idx on public.business_memberships (user_id);
create index memberships_business_id_idx on public.business_memberships (business_id);

create trigger set_memberships_updated_at
  before update on public.business_memberships
  for each row execute function public.set_updated_at();

-- Whoever creates a business becomes its owner automatically.
create or replace function public.handle_new_business()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.business_memberships (business_id, user_id, role, status, accepted_at)
  values (new.id, auth.uid(), 'owner', 'active', now())
  on conflict (business_id, user_id) do nothing;
  return new;
end;
$$;

create trigger on_business_created
  after insert on public.businesses
  for each row execute function public.handle_new_business();

-- ── module system foundation (master-prompt §11/§23) ────────────────────────
-- A module is "on" for a business only when this row says so. Plan/entitlement
-- gating (master-prompt §23) is layered on top of this table in a later phase,
-- not implemented yet — Phase 1 only establishes that module state is
-- database-backed and per-business, not a client-side checkbox.
create table public.business_modules (
  business_id uuid not null references public.businesses (id) on delete cascade,
  module_key text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, module_key)
);

create trigger set_business_modules_updated_at
  before update on public.business_modules
  for each row execute function public.set_updated_at();

-- ── audit log (master-prompt §24) ───────────────────────────────────────────
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id),
  business_id uuid references public.businesses (id),
  city_id uuid references public.cities (id),
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_business_id_idx on public.audit_logs (business_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at);
