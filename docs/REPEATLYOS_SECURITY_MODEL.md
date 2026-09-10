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

The approach adopted, matching how real multi-tenant marketplace platforms
handle this: rely on platform-level encryption (already on) for everything,
and add column-level encryption only for a short, deliberate list of
genuinely sensitive fields that are never searched, filtered, joined on, or
publicly displayed. **Confirmed with the user (2026-09-10, reaffirmed
2026-09-10 after a follow-up request to encrypt "all" data):** this scoped
approach is the accepted policy. Blanket table/column encryption was tried
in reasoning through it a second time and rejected again, concretely, not
just in principle — see "Why this can't be blanket" below, which uses the
tenant-isolation test actually run against the live project as evidence.

### Field-level encryption: implemented pattern (2026-09-10)

`business_memberships.invited_email` (a pending staff invitee's email
address) is the first real sensitive field in the schema, and is now
genuinely encrypted at the column level — not just at the platform level:

- `supabase/migrations/20260910000004_field_level_encryption.sql`:
  - A symmetric key generated once and stored in Supabase Vault
    (`vault.secrets`), itself only readable by `postgres`/`service_role`.
  - `encrypt_pii(text)` / `decrypt_pii(text)`: `pgcrypto`-based (`pgp_sym_*`),
    `security definer` functions in the `public` schema with **EXECUTE
    revoked from `anon` and `authenticated`, granted only to
    `service_role`**. A browser calling `supabase.rpc('decrypt_pii', ...)`
    with a normal user session gets a permission-denied error; only a
    trusted server context holding the service_role key can ever decrypt.
  - `encrypt_invited_email_trigger`: a `BEFORE INSERT OR UPDATE` trigger that
    transparently encrypts `invited_email` the moment it's written, via
    *any* path (a plain owner/manager REST insert, a future admin tool,
    anything) — so there is no write path that can accidentally store this
    field in plaintext. Idempotent against re-saves (detects already-
    encrypted values by attempting to decrypt them first).
- `supabase/functions/decrypt-invite-email/index.ts` (Edge Function): the
  "decrypted for frontend" half. It re-runs the read **as the caller**
  (their own JWT against the normal REST API — RLS decides if they're even
  allowed to see this row, reusing the exact same `memberships_read` policy
  enforced everywhere else, not a re-implementation of that logic), and only
  if that succeeds does it call `decrypt_pii` via a service-role client to
  return the plaintext. **Not deployed or verified yet** — deploying an Edge
  Function requires either the Supabase CLI (`supabase functions deploy
  decrypt-invite-email`) or the Dashboard's Edge Functions UI (paste the
  file directly), neither of which this assistant has access to. See
  Migration Plan for deployment steps.

This is the concrete template to reuse for every future genuinely-sensitive
field (customer phone/address, payment references, etc. in Phase 3/4):
ciphertext column + auto-encrypt trigger + one Edge Function per read path
that needs plaintext, gated by RLS-based authorization it doesn't
reimplement.

### Why this can't be blanket — using the test we actually ran as evidence

The master-prompt §37 tenant-isolation test (two businesses, confirm A can
never read/mutate B's data) was run for real against the live project on
2026-09-10 and passed — see `docs/REPEATLYOS_PROGRESS.md`. It passed
*because* Postgres could evaluate `businesses_read`'s policy — specifically
`city_id`, `status`, and `marketplace_visible` — in plaintext, at query time,
for every row, to decide what's visible to whom. If those columns were
encrypted, Postgres could not evaluate `city_id = target_city_id` or
`status = 'active'` against ciphertext at all without decrypting first — and
the only way to make decryption available to a query deciding *who can see
what* would be to hand the decryption key to the very role RLS is supposed
to be restricting, which defeats the mechanism entirely (the decryption
step itself would need to already know the authorization answer, which is
what RLS exists to compute). This is not a performance inconvenience to
work around later; it is a structural contradiction between "encrypt the
column RLS reads" and "let RLS decide who can read it." The same argument
applies to `slug`, `name`, `category`, `business_type_key`, and anything
else the public marketplace search/SEO pages (master-prompt §14/§17/§35)
need to read in plaintext to function at all.

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

## SQL injection

Structurally prevented today, not just "we're careful": every current data
access path is either PostgREST (Supabase's autogenerated REST API, which
builds parameterized queries from URL/query-string filters — it does not
construct SQL from string concatenation) or `supabase-js`'s query builder
(`.eq()`, `.select()`, etc., which compiles to the same parameterized REST
calls). There is no raw SQL string-building anywhere in this codebase, and no
`pg`/database driver used directly from application code.

**Hard rule for future work** (Phase 6 marketplace search, and any future
Postgres function taking free-text input): never build a query by
concatenating user input into a SQL string. Use parameterized filters
(`.ilike()`, `.textSearch()`, `$1`-style placeholders inside `plpgsql`
functions) exclusively. If a future search feature ever needs dynamic SQL
inside a Postgres function (e.g. `EXECUTE format(...)`), every interpolated
identifier/value must go through `format('%I', ...)` / `format('%L', ...)`
or a bound parameter — never raw string interpolation of request input.

## Clickjacking

Added 2026-09-10: `X-Frame-Options: DENY` and `Content-Security-Policy:
frame-ancestors 'none'` (plus `X-Content-Type-Options: nosniff` and
`Referrer-Policy: strict-origin-when-cross-origin`), so the app refuses to
render inside a frame/iframe on any other site. Configured in
`vite.config.ts` (`server.headers`/`preview.headers`, covers local dev and
`vite preview`) and `public/_headers` (Netlify/Cloudflare Pages convention —
takes effect automatically if deployed to either; a different host needs the
same headers configured in its own way, e.g. `vercel.json`, nginx
`add_header`).

## IDs in responses / console

Two different concerns get conflated under "don't expose IDs" — worth being
precise about which is actually mitigated:

- **Enumerable/guessable IDs** (old-style sequential integers, where knowing
  one customer's ID lets you guess the next one exists) — already avoided:
  every primary key in this schema is a `uuid default gen_random_uuid()`,
  not a sequence. There is nothing to enumerate.
- **A resource's ID appearing in a network response at all** — this is not
  something that can be removed without a fundamentally different
  architecture (the frontend genuinely needs `business.id` to know which
  business's data to query next, `product.id` to add to a cart, etc.), and
  removing it wouldn't add real security: the tenant-isolation test actually
  run against this project (see Progress log) proves that knowing another
  tenant's UUID grants no access to their data at all — RLS, not secrecy of
  the ID, is what protects it. If a specific concern prompted this (e.g.
  worry about a particular field), name it and it can be addressed
  precisely; a blanket "no IDs anywhere" isn't a coherent target for a REST
  API a browser has to operate against.
- Checked (2026-09-10): only one `console.*` call exists in the whole
  frontend (`AuthContext.tsx`, logging a Supabase error object on membership
  fetch failure — no tokens, no raw user records, no secrets in it).

## What is explicitly NOT covered yet

- No rate limiting configured (master-prompt §26) — revisit in Phase 9
  hardening; Supabase has some platform-level protections by default but
  nothing custom has been configured or verified here.
- No file upload flows exist yet, so upload validation (MIME/size/extension,
  master-prompt §30) has nothing to apply to yet — will be added alongside
  Supabase Storage bucket configuration when logo/product-image upload is
  built.
- The master-prompt §37 tenant-isolation test **has been run for real**
  against the live project (2026-09-10) — see `docs/REPEATLYOS_PROGRESS.md`
  for the exact checks and results. Still missing: an *automated* test suite
  running this on every change, rather than a one-off manual verification —
  add this in Phase 9 hardening (or sooner, once a test framework is chosen).
- Audit log writes (`audit_logs` insert policy) are permitted from the
  client today, self-attributed (`actor_user_id = auth.uid()`). This is
  weaker than a trusted server writing audit rows itself (a compromised
  client session could choose not to write an audit entry, or write a
  self-serving one), but there is no application server to do this from in
  the current stack. If audit integrity becomes important before a custom
  backend exists, consider moving audit writes into Postgres triggers on the
  tables being audited (so they can't be skipped by the client at all)
  rather than relying on the client to call an insert.
