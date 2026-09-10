# RepeatlyOS Security Model

## Where tenant isolation is actually enforced

**In Postgres Row Level Security policies**
(`supabase/migrations/20260910000002_rls_policies.sql`), not in frontend
code. This is the direct answer to master-prompt §6/§26: *"Never rely only on
frontend filtering. Tenant isolation MUST be enforced server-side."*

Concretely: with Supabase, the browser talks to PostgREST using the
project's public anon key plus the signed-in user's JWT. There is no custom
Express/Nest server to add an `if (business.id !== req.user.businessId)`
check to — Postgres itself is the boundary, and it enforces it via `USING`
and `WITH CHECK` clauses on every policy, evaluated by the database for
every single row of every single query, regardless of what the client asked
for. A malicious client editing request parameters (the exact attack
described in master-prompt §26 — "Business A owner manually changes URL:
`/api/businesses/BUSINESS_B_ID/products`") gains nothing: the RLS policy on
`businesses`/`business_memberships`/etc. re-evaluates `auth.uid()` from the
verified JWT on every request, not from anything the client supplies.

The helper functions (`is_business_member`, `has_business_role`,
`has_business_permission`, `is_city_admin`, `is_platform_admin`) are
`security definer` so they can consult `business_memberships`/`city_admins`/
`platform_admins` regardless of whether the calling user has direct SELECT
rights on those tables — this is what lets the RLS policies stay simple
one-line `using (...)` clauses instead of duplicating the same subquery in
every policy.

## Role/permission model implemented in Phase 1

- `PLATFORM_SUPER_ADMIN` → row in `platform_admins`. **There is deliberately
  no INSERT policy on this table.** Granting platform-admin status must be
  done directly in the Supabase SQL editor by a trusted operator:
  ```sql
  insert into public.platform_admins (user_id)
  values ('<the auth.users.id you want to promote>');
  ```
  This is intentional friction — it should never be possible to grant
  yourself platform admin through the app.
- `CITY_ADMIN` → row in `city_admins` (user_id, city_id). Also only
  writable by an existing platform admin (via RLS policy
  `city_admins_platform_write`).
- `BUSINESS_OWNER` / `BUSINESS_MANAGER` / `BUSINESS_STAFF` → the `role`
  column on `business_memberships`. The row that's auto-created when a
  business is inserted (`on_business_created` trigger) is always `owner`,
  for the user who created it.
- Fine-grained permissions (`products.create`, `orders.manage`, etc. — the
  vocabulary from master-prompt §7) → `business_memberships.permissions
  text[]`, checked by `has_business_permission()`. An `owner` implicitly
  passes every permission check regardless of the array contents; a
  `manager`/`staff` only passes for permissions explicitly listed on their
  membership row.
- `CUSTOMER` — not modeled yet; today every authenticated user is a
  potential merchant/staff account. A distinct consumer-facing identity
  (needed for the city marketplace, Phase 6) is out of scope for Phase 1.

## Client-side helpers are UX only

`src/lib/authz.ts` (`getMembership`, `hasBusinessRole`,
`hasBusinessPermission`) exist to drive what the UI shows — e.g., hiding a
"Staff" nav item from a user who isn't an owner/manager. **These are
convenience functions only.** Removing them or bypassing them client-side
changes nothing about what data a user can actually read or write, because
every read/write still goes through Supabase's PostgREST layer, which
re-checks the RLS policies above on every request. This is the master-prompt
§26 principle applied concretely: authorization must hold even against a
client that ignores the UI entirely.

## What is explicitly NOT covered yet

- No rate limiting configured (master-prompt §26) — revisit in Phase 9
  hardening; Supabase has some platform-level protections by default but
  nothing custom has been configured or verified here.
- No file upload flows exist yet, so upload validation (MIME/size/extension,
  master-prompt §30) has nothing to apply to yet — will be added alongside
  Supabase Storage bucket configuration when logo/product-image upload is
  built.
- No automated tenant-isolation tests exist yet (master-prompt §37) — there
  is no live Supabase project to test against. Once one exists, the first
  test to write is exactly the one master-prompt §37 calls "most important":
  create two businesses under two different users, and assert user A's
  Supabase session can never SELECT/UPDATE a row belonging to business B's
  memberships/products/orders/etc.
- Audit log writes (`audit_logs` insert policy) are permitted from the
  client today, self-attributed (`actor_user_id = auth.uid()`). This is
  weaker than a trusted server writing audit rows itself (a compromised
  client session could choose not to write an audit entry, or write a
  self-serving one), but there is no application server to do this from in
  the current stack. If audit integrity becomes important before a custom
  backend exists, consider moving audit writes into Postgres triggers on the
  tables being audited (so they can't be skipped by the client at all)
  rather than relying on the client to call an insert.
