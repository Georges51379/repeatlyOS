-- pgTAP tests for the actual tenant-isolation enforcement point (RLS) —
-- see docs/REPEATLYOS_PROGRESS.md for the one-off MANUAL verification this
-- automates: "two real businesses... confirming a user cannot list, read,
-- or update another tenant's business/memberships." That was run once by
-- hand against a live project; this is the automated version so it runs on
-- every change instead of only when someone remembers to check by hand.
--
-- Impersonation technique: Supabase's PostgREST layer sets `role` to
-- `authenticated` and the `request.jwt.claims` GUC to the caller's decoded
-- JWT before running a query, which is what `auth.uid()` reads from. This
-- reproduces that directly in SQL — no real JWT needed, since RLS itself
-- doesn't care how those settings got set, only what they say.
--
-- Businesses are inserted WHILE impersonating their intended owner
-- (rather than as the unimpersonated test-runner role) deliberately: the
-- `on_business_created` trigger (migration 20260910000001) inserts an
-- owner membership row using `auth.uid()`, which is null with no
-- impersonation active — that would violate business_memberships.user_id's
-- NOT NULL constraint and abort the insert. Impersonating the owner first
-- makes the trigger do exactly what it does in production, and means this
-- test never has to duplicate that trigger's own membership-creation logic.
--
-- HOW TO RUN: `supabase test db` (Docker Desktop required). Not executable
-- in the environment this was written in — reviewed carefully, not run.
-- The single riskiest line below is the `auth.users` insert: Supabase's
-- auth schema has evolved NOT NULL columns across versions beyond what's
-- listed here — if this specific insert fails on a real run, add whatever
-- column it complains about with a placeholder value, the rest of the file
-- does not depend on its exact shape.

begin;
select plan(5);

insert into public.cities (id, name, slug, country, active, marketplace_enabled)
values ('a1111111-1111-1111-1111-111111111111', 'Isolation City', 'isolation-city-pgtap', 'Lebanon', true, true);

insert into auth.users (id, email, aud, role) values
  ('b1111111-1111-1111-1111-111111111111', 'owner-a@pgtap.test', 'authenticated', 'authenticated'),
  ('b2222222-2222-2222-2222-222222222222', 'owner-b@pgtap.test', 'authenticated', 'authenticated');

-- ── Create Business A while impersonating its owner ─────────────────────
set local role authenticated;
set local request.jwt.claims = '{"sub": "b1111111-1111-1111-1111-111111111111", "role": "authenticated"}';

insert into public.businesses (id, city_id, name, slug, status, marketplace_visible)
values ('c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Business A', 'business-a-pgtap', 'active', false);

insert into public.customers (id, business_id, full_name)
values ('d1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Customer of A');

-- ── Create Business B while impersonating ITS owner ─────────────────────
set local request.jwt.claims = '{"sub": "b2222222-2222-2222-2222-222222222222", "role": "authenticated"}';

insert into public.businesses (id, city_id, name, slug, status, marketplace_visible)
values ('c2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'Business B', 'business-b-pgtap', 'active', false);

-- ── Still impersonating Business B's owner: try to reach Business A ─────
select is(
  (select count(*)::int from public.customers where business_id = 'c1111111-1111-1111-1111-111111111111'),
  0,
  'Business B owner cannot read Business A''s customers (marketplace_visible = false, not a member)'
);

select is(
  (select count(*)::int from public.orders where business_id = 'c1111111-1111-1111-1111-111111111111'),
  0,
  'Business B owner cannot read Business A''s orders'
);

-- A malicious client editing the id in the request gains nothing — the
-- UPDATE runs without error, but RLS's USING clause excludes Business A's
-- row from what Business B's owner can even see as a target, so it quietly
-- matches zero rows rather than erroring. (Not a throws_ok case — this is
-- the actual, correct Postgres RLS behavior for an UPDATE whose USING
-- clause excludes every row the query would otherwise touch.)
update public.businesses set name = 'Hijacked' where id = 'c1111111-1111-1111-1111-111111111111';
select is(
  (select name from public.businesses where id = 'c1111111-1111-1111-1111-111111111111'),
  'Business A',
  'Business A''s name is unchanged after Business B owner''s update attempt (0 rows matched, not an error)'
);

-- ── Impersonate Business A's own owner — sanity check the isolation isn't
--    just "nobody can read anything" ─────────────────────────────────────
set local request.jwt.claims = '{"sub": "b1111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select is(
  (select count(*)::int from public.customers where business_id = 'c1111111-1111-1111-1111-111111111111'),
  1,
  'Business A''s own owner CAN read Business A''s customers'
);

-- ── Anonymous (no session at all) ────────────────────────────────────────
reset request.jwt.claims;
set local role anon;

select is(
  (select count(*)::int from public.businesses where id = 'c1111111-1111-1111-1111-111111111111'),
  0,
  'an anonymous caller cannot see a non-marketplace-visible business at all'
);

select * from finish();
rollback;
