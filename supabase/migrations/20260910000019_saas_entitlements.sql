-- Phase 8 — SaaS entitlements (RepeatlyOS's own subscription plans for a
-- business to use the platform, per master-prompt §40 — NOT to be confused
-- with a merchant's own customer packages/subscriptions, which already exist
-- as `customer_memberships`). `data/moduleKeys.ts` has said since Phase 2
-- that "plan/entitlement gating... is Phase 8 — not implemented yet"; this
-- migration is that.
--
-- No payment gateway is wired up (out of MVP scope) — a business's plan is
-- assigned/changed by a platform admin, not self-serve checkout. That keeps
-- this phase to "what modules is a business entitled to" rather than
-- "process a card".

create table public.saas_plans (
  key text primary key,
  name text not null,
  price_monthly_usd numeric(10, 2) not null default 0,
  included_modules text[] not null default '{}',
  max_branches int,
  is_default boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Free plan's included_modules must cover every module any business_type's
-- default_modules already grants (see supabase/seed.sql) — otherwise a
-- brand-new business would fail to even finish onboarding once module-write
-- enforcement (below) is in place, since copy_default_modules would be
-- trying to enable modules the business isn't entitled to yet.
insert into public.saas_plans (key, name, price_monthly_usd, included_modules, max_branches, is_default, sort_order)
values
  ('free', 'Free', 0,
   array['products', 'inventory', 'orders', 'customers', 'bookings', 'services', 'analytics', 'staff', 'payments', 'delivery'],
   1, true, 0),
  ('growth', 'Growth', 19,
   array['products', 'inventory', 'orders', 'customers', 'bookings', 'services', 'analytics', 'staff', 'payments', 'delivery',
         'tasks', 'marketing', 'subscriptions'],
   3, false, 1),
  ('pro', 'Pro', 49,
   array['products', 'inventory', 'orders', 'customers', 'bookings', 'services', 'analytics', 'staff', 'payments', 'delivery',
         'tasks', 'marketing', 'subscriptions', 'audit_logs', 'advanced_reports', 'multi_branch'],
   null, false, 2)
on conflict (key) do nothing;

create table public.business_saas_subscriptions (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  plan_key text not null references public.saas_plans (key),
  status text not null default 'active' check (status in ('trialing', 'active', 'past_due', 'canceled')),
  started_at timestamptz not null default now(),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_business_saas_subscriptions_updated_at
  before update on public.business_saas_subscriptions
  for each row execute function public.set_updated_at();

-- Every new business starts on the default (free) plan. Backfilled for any
-- business created before this migration (none exist yet in production, but
-- this keeps the migration correct if that ever changes).
create or replace function public.create_default_saas_subscription()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.business_saas_subscriptions (business_id, plan_key, status)
  select new.id, key, 'active' from public.saas_plans where is_default = true limit 1
  on conflict (business_id) do nothing;
  return new;
end;
$$;

create trigger on_business_created_saas_subscription
  after insert on public.businesses
  for each row execute function public.create_default_saas_subscription();

insert into public.business_saas_subscriptions (business_id, plan_key, status)
select b.id, sp.key, 'active'
from public.businesses b
cross join lateral (select key from public.saas_plans where is_default = true limit 1) sp
where not exists (
  select 1 from public.business_saas_subscriptions s where s.business_id = b.id
);

-- ── enforcement: a business may only *enable* a module included in its
--    current plan (disabling is always allowed; platform admins can always
--    override, e.g. for support). Falls back to the default plan's modules
--    if a business somehow has no subscription row yet, so this doesn't
--    depend on trigger-firing order against copy_default_modules. ─────────
create or replace function public.enforce_module_plan_entitlement()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_included text[];
begin
  if new.enabled = false or public.is_platform_admin() then
    return new;
  end if;

  select sp.included_modules into v_included
  from public.business_saas_subscriptions bs
  join public.saas_plans sp on sp.key = bs.plan_key
  where bs.business_id = new.business_id;

  if v_included is null then
    select included_modules into v_included from public.saas_plans where is_default = true limit 1;
  end if;

  if v_included is null or not (new.module_key = any(v_included)) then
    raise exception 'The "%" module is not included in your current plan. Upgrade to enable it.', new.module_key;
  end if;
  return new;
end;
$$;

create trigger enforce_module_entitlement
  before insert or update on public.business_modules
  for each row execute function public.enforce_module_plan_entitlement();

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.saas_plans enable row level security;
alter table public.business_saas_subscriptions enable row level security;

-- Plans are plain pricing info — readable by anyone, including a
-- prospective merchant who hasn't signed up yet (matches cities_read's
-- public-readability precedent for non-sensitive platform-level data).
create policy saas_plans_read_all on public.saas_plans
  for select using (true);

create policy saas_plans_write_platform_admin on public.saas_plans
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- A business's own subscription is visible to its owner/manager (so they
-- can see what plan/modules they're on) and to platform admins; only a
-- platform admin can change it (no self-serve billing yet).
create policy saas_subscriptions_read on public.business_saas_subscriptions
  for select using (
    public.has_business_role(business_id, array['owner', 'manager']::public.membership_role[])
    or public.is_platform_admin()
  );

create policy saas_subscriptions_write_platform_admin on public.business_saas_subscriptions
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());
