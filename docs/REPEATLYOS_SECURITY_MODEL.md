# RepeatlyOS Security Model

## Authentication

- **Email/password** (`supabase.auth.signUp` / `signInWithPassword`) —
  required for a user's first credential; Supabase hashes and stores
  passwords itself (never handled or stored by RepeatlyOS code).
- **Passkeys (WebAuthn)** — added 2026-09-10, Supabase Auth beta feature.
  `signInWithPasskey()` is fully passwordless; cross-device sign-in (scanning
  a QR code with a phone to authenticate a browser session) is the browser's
  native WebAuthn "hybrid transport" behavior, not something RepeatlyOS
  implements. A passkey cannot be a brand-new account's first credential —
  Supabase requires an existing confirmed user before one can be registered
  (`registerPasskey()`, from `/account/security`). See
  `docs/REPEATLYOS_MIGRATION_PLAN.md` → "Passkey/WebAuthn Login" for the full
  writeup, dashboard configuration required, and the explicit caveat that
  this is unverified beta functionality with no live project to test against.

## Data Encryption

**At rest and in transit — already true today, no code required.** Supabase
encrypts everything stored on disk with AES-256 (tables, indexes,
write-ahead logs, backups, and Storage objects alike), protected by
project-specific keys that are themselves guarded by FIPS 140-2 compliant
HSMs; this cannot be disabled. Every connection (browser ↔ Supabase API,
Supabase API ↔ Postgres) is TLS 1.2+. This is the industry-standard meaning
of "the database is encrypted" and is what SOC2/HIPAA/PCI-DSS baseline
requirements for encryption at rest/in transit actually ask for — RepeatlyOS
gets it for free from the platform, for every row in every table, today.
(Source: [Security at Supabase](https://supabase.com/security).)

**What that does NOT cover:** anyone with legitimate database access (the
project owner, anyone holding the service-role key, Supabase itself at the
infrastructure level) can still read plaintext values when querying the
database directly — at-rest encryption protects against disk/backup theft,
not against a compromised credential or an authorized-but-malicious insider.
Closing that gap requires **column/application-level encryption** on top of
platform encryption, and that has a real, unavoidable cost: an encrypted
column stops being usable in search, filtering, sorting, joins, or RLS
predicates (short of decrypting every row on every query, which defeats the
purpose and kills performance) — and the master prompt itself requires
public, searchable, SEO-indexed marketplace listings (city pages, business
storefronts, product/service search — §14, §17, §35). Product names, prices,
categories, city/business names, and anything else meant to be publicly
findable **cannot** be column-encrypted without breaking those requirements;
they are not secrets to begin with.

The approach adopted going forward, matching how real multi-tenant
marketplace platforms handle this: rely on platform-level encryption
(already on) for everything, and add column-level encryption (e.g. Postgres
`pgcrypto`, or a dedicated searchable-encryption layer for fields that must
still support exact-match lookups) only for a short, deliberate list of
genuinely sensitive fields that are never searched, filtered, or publicly
displayed — customer phone numbers/exact addresses, payment reference
numbers, and similar PII. No such fields exist yet in the Phase 1 schema
(Customer/Payment tables are Phase 3/4) — this is the policy to apply when
those tables are designed, not something retrofitted onto `cities`/
`businesses` now, since none of the Phase 1 tables hold sensitive PII in the
first place (they're either public marketplace configuration or membership
metadata already protected by RLS).

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
