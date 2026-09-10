-- RepeatlyOS Phase 1 — Row Level Security (the actual tenant-isolation
-- enforcement point, per master-prompt §6/§26: "Never rely only on frontend
-- filtering. Tenant isolation MUST be enforced server-side.")
--
-- With Supabase there is no custom API server — Postgres itself is the
-- server-side boundary. Every table below has RLS enabled; there is no path
-- for Business A to read or write Business B's rows, authenticated or not,
-- regardless of what the client sends.

-- ── helper functions (security definer so they can read tables the calling
--    user may not have direct SELECT rights on, without that becoming a hole
--    in the RLS they enforce) ──────────────────────────────────────────────

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins where user_id = auth.uid()
  );
$$;

create or replace function public.is_city_admin(target_city_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select
    exists (
      select 1 from public.city_admins
      where user_id = auth.uid() and city_id = target_city_id
    )
    or public.is_platform_admin();
$$;

create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select
    exists (
      select 1 from public.business_memberships
      where business_id = target_business_id
        and user_id = auth.uid()
        and status = 'active'
    )
    or public.is_platform_admin();
$$;

create or replace function public.has_business_role(target_business_id uuid, allowed_roles public.membership_role[])
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select
    exists (
      select 1 from public.business_memberships
      where business_id = target_business_id
        and user_id = auth.uid()
        and status = 'active'
        and role = any(allowed_roles)
    )
    or public.is_platform_admin();
$$;

create or replace function public.has_business_permission(target_business_id uuid, permission text)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select
    exists (
      select 1 from public.business_memberships
      where business_id = target_business_id
        and user_id = auth.uid()
        and status = 'active'
        and (role = 'owner' or permission = any(permissions))
    )
    or public.is_platform_admin();
$$;

create or replace function public.business_city_id(target_business_id uuid)
returns uuid
language sql
stable
security definer set search_path = public
as $$
  select city_id from public.businesses where id = target_business_id;
$$;

-- ── enable RLS everywhere ────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.cities enable row level security;
alter table public.city_admins enable row level security;
alter table public.business_types enable row level security;
alter table public.businesses enable row level security;
alter table public.business_memberships enable row level security;
alter table public.business_modules enable row level security;
alter table public.platform_admins enable row level security;
alter table public.audit_logs enable row level security;

-- ── profiles: a user manages only their own profile row ─────────────────
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_platform_admin());

create policy profiles_insert_own on public.profiles
  for insert with check (id = auth.uid());

create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ── cities: public can read active cities; only platform admins write ────
create policy cities_public_read on public.cities
  for select using (active = true or public.is_platform_admin() or public.is_city_admin(id));

create policy cities_platform_admin_write on public.cities
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ── city_admins: platform admin manages; a city admin can see their own row ─
create policy city_admins_read on public.city_admins
  for select using (user_id = auth.uid() or public.is_platform_admin());

create policy city_admins_platform_write on public.city_admins
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ── business_types: public read (it's shared configuration, not secret);
--    only platform admins can add/edit templates ─────────────────────────
create policy business_types_public_read on public.business_types
  for select using (true);

create policy business_types_platform_admin_write on public.business_types
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ── businesses: the core tenant-isolation boundary ───────────────────────
-- Read: a member of the business, an admin of its city, a platform admin,
-- or anyone at all if the listing is marketplace-visible and approved.
create policy businesses_read on public.businesses
  for select using (
    public.is_business_member(id)
    or public.is_city_admin(city_id)
    or (status = 'active' and marketplace_visible = true)
  );

-- Create: any authenticated user may create a business (this is merchant
-- self-registration, master-prompt §9) — the on_business_created trigger
-- immediately makes them its owner, so they can manage what they created but
-- nothing else.
create policy businesses_insert_authenticated on public.businesses
  for insert with check (auth.uid() is not null);

-- Update: only an owner/manager of that specific business, or an admin of
-- its city (for approvals/suspensions), or a platform admin.
create policy businesses_update_owner_manager_or_admin on public.businesses
  for update
  using (
    public.has_business_role(id, array['owner', 'manager']::public.membership_role[])
    or public.is_city_admin(city_id)
  )
  with check (
    public.has_business_role(id, array['owner', 'manager']::public.membership_role[])
    or public.is_city_admin(city_id)
  );

-- Delete: intentionally not granted to anyone but platform admins — see
-- master-prompt §28 (prefer archiving over destructive deletion).
create policy businesses_delete_platform_admin_only on public.businesses
  for delete using (public.is_platform_admin());

-- ── business_memberships ──────────────────────────────────────────────────
-- Read: your own membership row, any member of the same business (so staff
-- can see their coworkers), or the relevant city/platform admin.
create policy memberships_read on public.business_memberships
  for select using (
    user_id = auth.uid()
    or public.is_business_member(business_id)
    or public.is_city_admin(public.business_city_id(business_id))
  );

-- Write (insert/update/delete): only an owner or manager of that business.
-- This is how staff are invited/promoted/removed (master-prompt §7 — Business
-- Owner has full permissions, Managers get configurable permissions).
create policy memberships_owner_manager_write on public.business_memberships
  for all
  using (public.has_business_role(business_id, array['owner', 'manager']::public.membership_role[]))
  with check (public.has_business_role(business_id, array['owner', 'manager']::public.membership_role[]));

-- ── business_modules ───────────────────────────────────────────────────────
create policy modules_member_read on public.business_modules
  for select using (public.is_business_member(business_id));

-- Only the owner toggles modules for now (master-prompt §11 — later phases
-- add plan-entitlement gating on top of this same table).
create policy modules_owner_write on public.business_modules
  for all
  using (public.has_business_role(business_id, array['owner']::public.membership_role[]))
  with check (public.has_business_role(business_id, array['owner']::public.membership_role[]));

-- ── platform_admins: readable only by platform admins themselves ─────────
-- (There is deliberately no INSERT policy — granting platform-admin status
-- must be done by a trusted operator directly in the SQL editor, never
-- through the app. See docs/REPEATLYOS_SECURITY_MODEL.md.)
create policy platform_admins_self_read on public.platform_admins
  for select using (public.is_platform_admin());

-- ── audit_logs ─────────────────────────────────────────────────────────────
create policy audit_read on public.audit_logs
  for select using (
    (business_id is not null and public.is_business_member(business_id))
    or (city_id is not null and public.is_city_admin(city_id))
    or public.is_platform_admin()
  );

-- Insert only as yourself, and only tied to a business you actually belong
-- to (or untied, for platform-level events) — prevents forging audit entries
-- as another user or against a business you have no membership in.
create policy audit_insert_self on public.audit_logs
  for insert with check (
    actor_user_id = auth.uid()
    and (business_id is null or public.is_business_member(business_id))
  );
