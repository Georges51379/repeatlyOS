-- Replaces the code/link-based activation flow (migration 20260910000023's
-- signup_requests + admin-generate-invite's one-time code) with a unified,
-- self-service "type your email, click Verify, register/use your passkey"
-- flow for all three roles (platform admin, city admin, business owner) —
-- explicitly requested (2026-09-17) to replace a flow the user found
-- unprofessional and dated. No code is ever shown to or typed by anyone;
-- see supabase/functions/verify-login for how a real session is
-- established invisibly using Supabase's own OTP primitive.
--
-- `signup_requests` (business owners) already supported this model as-is —
-- a row keyed by email with a status this migration doesn't need to
-- change. City admins had no equivalent: `city_admins` is keyed by a real
-- `user_id`, which doesn't exist yet the first time someone is granted the
-- role by email alone. `city_admin_invites` is that missing piece — once
-- someone successfully verifies through it, a real `city_admins` row is
-- created (by the Edge Function) and the invite row's job for
-- AUTHENTICATION is done; it stays around as the record of "who a platform
-- admin decided should have this role" and can be deactivated later
-- without touching the real grant.

create table public.city_admin_invites (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id) on delete cascade,
  email text not null,
  active boolean not null default true,
  -- Always true at creation — only a platform admin can insert a row here
  -- at all (see policy below), so "created" and "verified by a platform
  -- admin" are the same event today. Kept as its own column (rather than
  -- folded into `active`) so a future self-request flow (someone asking to
  -- become a city admin, rather than being unilaterally granted it) has
  -- somewhere to record "submitted but not yet reviewed" without
  -- overloading `active`, which is about a already-approved grant being
  -- currently enabled vs. suspended.
  verified boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_id, email)
);

create index city_admin_invites_email_idx on public.city_admin_invites (email);

create trigger set_city_admin_invites_updated_at
  before update on public.city_admin_invites
  for each row execute function public.set_updated_at();

alter table public.city_admin_invites enable row level security;

-- No public/authenticated select policy at all — matching resolves through
-- the verify-login Edge Function's service-role client, never a direct
-- client query. This is deliberate: exposing "which emails are invited as
-- city admins" to any authenticated user, even filtered, is unnecessary
-- surface area for a table only ever read server-side.
create policy city_admin_invites_platform_admin_manage on public.city_admin_invites
  for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ── Basic rate limiting for the verify-login Edge Function ────────────────
-- Same reasoning as migration 20260914000004's guest_submission_log: no
-- separate API server to rate-limit at, so the Edge Function itself checks
-- this table before proceeding and logs every attempt (success or
-- failure) — logging failures too is what actually prevents brute-forcing
-- emails against this endpoint, not just successes.
create table public.auth_verify_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  context text not null check (context in ('platform_admin', 'city_admin', 'business_owner')),
  created_at timestamptz not null default now()
);

create index auth_verify_attempts_email_created_idx on public.auth_verify_attempts (email, created_at);

alter table public.auth_verify_attempts enable row level security;

-- No client policy at all — written and read exclusively by the
-- Edge Function's service-role client, which bypasses RLS entirely.
create policy auth_verify_attempts_platform_admin_read on public.auth_verify_attempts
  for select using (public.is_platform_admin());
