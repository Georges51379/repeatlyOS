# RepeatlyOS Progress Log

## Completed

- Phase 0 audit: full repository inspection. See
  `docs/REPEATLYOS_ARCHITECTURE_AUDIT.md`.
- Phase 0 migration plan drafted, including feature classification
  (KEEP/REFACTOR/MIGRATE/MERGE/DEPRECATE) and phased roadmap. See
  `docs/REPEATLYOS_MIGRATION_PLAN.md`.
- Ran `npm install` (was not previously installed; 260 packages, 0 blocking
  install errors — `npm audit` reports 8 known advisories in transitive deps,
  none evaluated yet, not a regression from any change made here).
- Ran baseline lint / typecheck / build (see Baseline section below).
- Initialized git and committed the pre-transformation baseline as-is (see
  Migration Notes).

- Backend stack decided: **Supabase** (Postgres + Auth, tenant isolation via
  Row Level Security). See Migration Plan → "Backend Stack Decision."
- **Phase 1 — Foundations implemented:**
  - Schema + RLS migrations: `supabase/migrations/20260910000001_init_schema.sql`,
    `20260910000002_rls_policies.sql`. Tables: `profiles`, `cities`,
    `city_admins`, `platform_admins`, `business_types`, `businesses`,
    `business_memberships`, `business_modules`, `audit_logs`. RLS enabled on
    every table; authorization helper functions
    (`is_platform_admin`, `is_city_admin`, `is_business_member`,
    `has_business_role`, `has_business_permission`) implement server-side
    tenant isolation at the database layer.
  - Dev-only seed data: `supabase/seed.sql` (business type templates +
    Batroun city record, both clearly separated from migrations per
    master-prompt §38).
  - Frontend: `@supabase/supabase-js` installed; `src/lib/supabase.ts` client
    (fails soft to a "not configured" state rather than crashing when env
    vars are absent); `src/types/domain.ts` hand-written types mirroring the
    schema; `src/lib/authz.ts` client-side UX-only authorization helpers
    (documented as non-authoritative — RLS is the real boundary);
    `src/context/AuthContext.tsx` (session, sign up/in/out, membership
    fetching); `/login` and `/signup` pages wired into `src/App.tsx`
    alongside (not replacing) the existing `DemoProvider`/demo dashboard.
  - Docs added: `REPEATLYOS_DATABASE_MODEL.md`, `REPEATLYOS_SECURITY_MODEL.md`,
    `REPEATLYOS_ROLES_PERMISSIONS.md`, `REPEATLYOS_MODULE_SYSTEM.md`.
  - Verified: `npm run build` (`tsc -b && vite build`) passes with 0
    TypeScript errors after all of the above. `npm run lint` went from the
    17-error baseline to 18 — the one new error is
    `react-refresh/only-export-components` in `AuthContext.tsx` (it exports
    both the `AuthProvider` component and the `useAuth` hook from one file).
    This matches an existing convention already in the untouched
    `DemoContext.tsx` (which has 3 instances of the same rule, exporting
    `DemoProvider` + `useDemo` + constants together) — followed intentionally
    for consistency rather than treated as new debt; splitting the hook into
    its own file is a trivial future cleanup if the rule is ever enforced
    strictly. A second potential regression (`set-state-in-effect` from a
    redundant `setLoading(false)` in an early-return branch) was caught and
    fixed before finalizing — removed because the initial `useState` value
    already covered that case, so no effect body change was even needed.
    **Not verified:** any actual Supabase auth/data flow — no live Supabase
    project exists (see "Required Before Phase 1 Is Testable" in the
    Migration Plan). Do not treat login/signup/RLS as confirmed-working until
    that's been checked against a real project.

- **Passkey/WebAuthn login added** (2026-09-10): Supabase Auth's native beta
  passkey feature wired in (`signInWithPasskey`/`registerPasskey`/
  `passkey.list`/`passkey.delete` via `AuthContext`), `/login` leads with a
  passkey button, `/account/security` manages registered passkeys. Cross-
  device QR sign-in is native browser WebAuthn behavior, not custom code.
  Verified against the actual installed `@supabase/supabase-js` source in
  `node_modules` (this shipped after this assistant's training cutoff, so
  doc summaries were cross-checked against real `.ts` source before writing
  any code against it). Build passes. **Not verified against a live
  project** — needs the Passkeys dashboard toggle + RP ID/origins configured
  first (see Migration Plan).
- **Encryption policy documented** (2026-09-10): Supabase already provides
  AES-256 at-rest + TLS-in-transit encryption for the entire database by
  default (cited in `REPEATLYOS_SECURITY_MODEL.md`). Column-level encryption
  of specific sensitive fields (customer PII, payment references) is the
  planned approach for when those tables are built in Phase 3/4 — not
  applied retroactively to Phase 1's `cities`/`businesses` tables, which
  hold public marketplace configuration, not secrets. See the user
  conversation and Security Model doc for the full reasoning on why
  blanket column-level encryption of searchable/public fields would break
  marketplace search and SEO requirements from the master prompt.

- **Phase 1 verified live, end-to-end** (2026-09-10): user provided real
  Supabase project credentials (anon key only used in `.env`; a mislabeled
  service_role key was flagged and used transiently, never persisted, only
  for admin-only test setup — see conversation). Ran migrations + seed
  against the live project. Found and fixed a real RLS/RETURNING bug (see
  Database Model doc) via a new migration
  (`20260910000003_fix_business_insert_returning.sql`), applied by the user.
  Then ran the master-prompt §37 test for real, via direct REST calls against
  the live project (two real signed-up-and-confirmed test users, two real
  businesses): confirmed User A's session (1) lists only their own business,
  (2) gets an empty result fetching Business B by id directly, (3) a
  URL-tampering UPDATE attempt against Business B affects 0 rows, (4) cannot
  read Business B's memberships, and (5) an independent admin-level check
  confirms Business B's data was genuinely untouched. All test data (2
  businesses, 2 auth users) deleted afterward — the live project is clean.
  **This is the first Phase 1 claim in this log backed by a real database
  test, not just a passing build.**

- **Security hardening round** (2026-09-10), in response to a follow-up
  request for full-database encryption + anti-SQLi/clickjacking/ID-exposure:
  - **Field-level encryption implemented for real**: Vault-stored key,
    `pgcrypto`-based `encrypt_pii`/`decrypt_pii` (service_role-only —
    execute revoked from anon/authenticated), an auto-encrypt trigger on
    `business_memberships.invited_email`, and a
    `decrypt-invite-email` Edge Function that authorizes via the caller's
    own RLS-gated read before ever touching the service-role client. Not
    deployed/verified yet (needs the user to run the new migration and
    deploy the function — no CLI/dashboard access from here).
  - **Declined, with concrete reasoning, to encrypt every table/column**:
    would break the exact RLS mechanism just verified live (Postgres can't
    evaluate `city_id = ...`/`status = 'active'` against ciphertext) and the
    master prompt's own marketplace search/SEO requirements. Full reasoning
    in `REPEATLYOS_SECURITY_MODEL.md` → "Why this can't be blanket."
  - **Clickjacking**: `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'`
    (+ `X-Content-Type-Options`, `Referrer-Policy`) added to
    `vite.config.ts` (dev/preview) and `public/_headers`
    (Netlify/Cloudflare Pages — auto-applies if deployed there).
  - **SQL injection**: audited and confirmed already structurally prevented
    (PostgREST/supabase-js only, no raw SQL string-building anywhere in the
    codebase) — documented as a hard rule for future search/RPC work.
  - **IDs in console/network**: audited — only one `console.*` call exists
    in the whole frontend, and it logs a benign error object, nothing
    sensitive. Clarified in the Security Model doc that UUIDs (already used
    everywhere) solve the *enumerable-ID* problem, while removing IDs from
    responses entirely isn't coherent for a REST API the frontend must
    operate against — and isn't needed for security, since the tenant-
    isolation test already proved knowing another tenant's UUID grants no
    access.

- **Field-level encryption fully verified live** (2026-09-10), after two
  more real bugs found and fixed via testing (on top of the pgcrypto-schema
  one from the previous round):
  1. Base64 output embeds raw newlines (Postgres's `encode(...,'base64')`
     line-wraps every 76 chars) — broke JSON transport. Switched to `hex`.
  2. **Serious**: `anon` (no session) could call `decrypt_pii` directly and
     get plaintext back with a 200 — the original `revoke ... from anon,
     authenticated` never touched the separate `PUBLIC` grant Postgres
     creates on every new function by default, which anon/authenticated
     implicitly inherit regardless. Fixed by also revoking from `PUBLIC`.
  Both fixed in place in the same (still-unshipped) migration file, and
  **re-verified live after the fixes**: `anon` now gets `401 permission
  denied`; `service_role` still decrypts correctly; and the full real path
  — owner inserts a plaintext `invited_email` via a completely normal REST
  call, no special client code — comes back as ciphertext (the trigger
  fired before RETURNING), and that stored ciphertext decrypts back to the
  exact original value. See `REPEATLYOS_SECURITY_MODEL.md` for the full
  writeup of both bugs.
  - **Still pending**: the `decrypt-invite-email` Edge Function itself is
    confirmed **not deployed yet** (live call returned `404 NOT_FOUND`) —
    needs the user to deploy it (dashboard or CLI); everything upstream of
    it is confirmed working, so this is the last untested link.
  - **Schema gap noted for Phase 3**: `business_memberships.user_id` is
    `not null`, which blocks the realistic "invite by email before the
    person has an account" flow — needs to become nullable when the real
    staff-invite UI is built.

- **Phase 2 — Merchant Onboarding (initial implementation, 2026-09-10):**
  - `supabase/migrations/20260910000005_phase2_onboarding_foundations.sql`:
    flips Batroun's `active` to `true` (separate from `marketplace_enabled`,
    which stays off until Phase 6 — see master-prompt §8/§54) so it's
    selectable during registration; adds a trigger that copies a business
    type's `default_modules` into `business_modules` automatically when a
    business is created.
  - `src/pages/onboarding/Onboarding.tsx`: 3-step wizard (city → business
    type → details) that inserts a real `businesses` row with
    `status: 'pending_approval'`. Friendly error on slug collision (Postgres
    23505) instead of a raw error.
  - `src/pages/app/AppHome.tsx`: real authenticated landing page — lists the
    user's businesses (from `AuthContext.memberships`, driven by real RLS-
    protected data, not `DemoContext`), status badges, and a module toggle
    panel (owner-only, enforced by both UI gating and the underlying
    `modules_owner_write` RLS policy).
  - `src/components/RequireAuth.tsx`: route guard, applied to
    `/onboarding`, `/app`, and (now consistently) `/account/security`.
  - `Login.tsx` now navigates to `/app` after sign-in instead of the old
    demo `/dashboard` — the real auth flow no longer dumps a user into the
    fake single-tenant demo. The demo dashboard itself is untouched and
    still reachable directly by URL (Phase 3 migrates it for real).
  - Fixed one lint regression caught before committing (derived `slug`
    state via a `useEffect`, the same anti-pattern already flagged
    elsewhere in the codebase — refactored to compute it inline instead).
  - **Verified live end-to-end** (2026-09-10), after finding and fixing one
    more real bug: the trigger's plpgsql loop variable was named
    `module_key`, colliding with the `business_modules.module_key` column —
    compiled fine (plpgsql bodies aren't validated for this until they
    actually run) but failed at insert-time with "column reference ...
    ambiguous". The failed insert rolled back completely (confirmed no
    orphaned rows), fixed by renaming to `v_module_key`, re-run, then fully
    verified via real REST calls simulating the wizard:
    - Batroun now appears via a plain anon session (no user) — confirms
      `active=true` took effect and is genuinely public, not just
      admin-visible.
    - Created a `barber`-type business exactly as the wizard would; the 5
      expected default modules (`analytics`, `bookings`, `customers`,
      `payments`, `staff`) were auto-created, all `enabled: true`.
    - A `manager`-role member could read `business_modules` but a PATCH
      attempt to disable one affected 0 rows — independently confirmed via
      `service_role` that the value was genuinely untouched.
    - The owner successfully disabled a default module and enabled a new
      one via upsert (the same call path `AppHome.tsx`'s toggle UI uses).
    - All test data (business, memberships, modules, 2 auth users) deleted
      afterward.

- **Both remaining loose ends closed and verified live** (2026-09-10):
  - `decrypt-invite-email` Edge Function deployed and fully round-trip
    tested: owner gets the real decrypted email; a completely unrelated
    user (no membership on that business) gets `404 Not found` — proving
    the RLS-based authorization inside the function actually holds, not
    just compiles. Test data cleaned up.
  - Passkeys enabled in the Supabase dashboard — confirmed via
    `GET /auth/v1/settings` (`passkeys_enabled: true`) and by requesting
    real registration options for a signed-in test user, which returned a
    fully valid WebAuthn options payload with the correct `rp.id`
    (`localhost`) and `rp.name` (`repeatlyos`). The actual browser ceremony
    (`navigator.credentials.create()`/`.get()`) has no REST equivalent, so
    a manual test in a real browser is still the only way to confirm sign-
    in-with-a-passkey works end-to-end — everything checkable from the
    server side is confirmed correct.

- **Phase 3 — first real dashboard domain: Customers (2026-09-10):**
  - `supabase/migrations/20260910000006_customers.sql`: real `customers`
    table, RLS-protected. Read is open to any active business member; write
    is gated by the `customers.manage` **permission** (not just a role
    check) via `has_business_permission` — the first table in the schema to
    actually exercise the fine-grained permission system built in Phase 1,
    not just owner/manager role checks.
  - First real business-scoped dashboard shell: `BusinessLayout.tsx`
    (sidebar nav driven by `business_modules`, via a new
    `useEnabledModules` hook), `useCurrentBusiness` hook (resolves the
    `:businessId` route param against the user's own memberships — a UX
    convenience, not the security boundary, which stays RLS), and routes
    under `/app/:businessId/{customers,settings}`.
  - Extracted the module-toggle UI out of `AppHome.tsx` into a shared
    `components/ModulesPanel.tsx` (now used both there and on the new
    business Settings page) backed by the same `useEnabledModules` hook, so
    both stay in sync with one source of truth instead of duplicating the
    fetch logic.
  - `pages/business/Customers.tsx`: real list/add/edit/delete UI against
    the `customers` table, with an empty state (master-prompt §33) and
    write controls hidden (client-side UX only) when the signed-in
    membership lacks `customers.manage`.
  - Lint note: new data-fetch-on-mount effects in `useEnabledModules.ts`
    and `Customers.tsx` trip the same `react-hooks/set-state-in-effect`
    rule already present throughout this codebase (`AuthContext`,
    `AccountSecurity`, most original demo pages) — consistent with existing
    convention, not new debt. Also observed the same rule produce different
    specific line-level output across lint runs for a file untouched this
    session (`BusinessPublicPage.tsx`), confirming some real
    non-determinism in this rule/codebase combination independent of any
    edits — noted here so future diffs aren't over-interpreted as
    regressions without checking first.
  - **Verified live end-to-end** (2026-09-10) — no bugs found this round:
    - Owner A created a customer in business A; owner B (a different
      tenant) got an empty list querying business A's customers and a
      `403` attempting to insert one.
    - A staff member with no `permissions` could read business A's
      customers (any active member can) but got `403` trying to create
      one.
    - After the owner granted that same staff member `customers.manage`,
      the identical create request succeeded — the full deny → grant →
      allow permission lifecycle confirmed working, the first real proof
      the fine-grained permission system (not just role) actually
      functions, not just compiles.
    - All test data (2 businesses, 3 auth users) deleted afterward.

- **Phase 3 — second real domain: Tasks (2026-09-10):**
  - `supabase/migrations/20260910000007_tasks.sql`: real `tasks` table
    (business-scoped Kanban board), with `customer_id` optionally linking
    to a real `customers` row (nullable, `on delete set null`) — a genuine
    improvement over the demo's freeform customer-name string. Unlike
    Customers, write is NOT permission-gated: the master prompt's
    permission vocabulary (§7) has no `tasks.*` entry, and a task board is
    inherently whole-team collaborative — any active member can read/write,
    matching the original demo's behavior.
  - `pages/business/Tasks.tsx`: real 4-column board (To Do / In Progress /
    Completed / Issue), add/move/remove, no drag-and-drop library — a
    per-card column-select dropdown instead, avoiding a new dependency for
    MVP.
  - Nav item added to `BusinessLayout`, gated by the `tasks` module flag
    like Customers is — note Batroun's seeded `barber` business type
    doesnt include `tasks` in its default modules, so a fresh barber-type
    business won't show this nav item until the owner enables it from
    Settings (expected, not a bug — verify by enabling it manually during
    testing).
  - **Verified live end-to-end** (2026-09-10) — no bugs found:
    - Created a customer and a task linked to it (`customer_id` FK works).
    - Owner B (different tenant) got an empty list querying business A's
      tasks and an update attempt affected 0 rows — independently confirmed
      via admin key the task's `board_column` was genuinely untouched.
    - A staff member with zero `permissions` successfully created a new
      task and moved the existing one to "completed" — confirming the
      deliberate "no permission gate, any active member manages tasks"
      design works as intended (unlike Customers, which correctly does
      gate on `customers.manage`).
    - All test data (2 businesses, 3 auth users) deleted afterward.

- **Phase 3 — third real domain: Services + Bookings (2026-09-10):**
  - `supabase/migrations/20260910000008_services_and_bookings.sql`: real
    `services` table (write gated by `services.manage`) and `bookings`
    table (write gated by `bookings.manage`), both from master-prompt §7's
    actual permission vocabulary this time (unlike Tasks). `bookings.staff`
    is plain text for now — no real Staff/StaffMember table exists yet;
    introducing one is separate, bigger scope.
  - **Deliberate MVP gap, called out rather than silently skipped**:
    master-prompt §16 asks to "prevent overlapping bookings" — no DB-level
    exclusion constraint was added, since a real constraint wants a stable
    resource identity (a real staff id) to partition by, which doesn't
    exist yet while `staff` is just free text. Revisit once Staff is real.
  - `pages/business/Services.tsx` and `pages/business/Bookings.tsx`: real
    CRUD UIs; Bookings lets you optionally link a customer and pick from
    active services, with a status dropdown (pending/confirmed/completed/
    cancelled).
  - Nav items added to `BusinessLayout`, module-gated same as before.
  - **Verified live end-to-end** (2026-09-10) — no bugs found:
    - Cross-tenant isolation: owner B got an empty list reading business
      A's services and a `403` inserting one.
    - Created a service, then a customer + booking linking both (real FK
      relationships, not freeform strings as in the demo).
    - **Permission granularity** confirmed precisely: a staff member with
      no permissions got `403` writing to both services and bookings;
      after being granted `bookings.manage` ONLY, bookings writes
      succeeded while services writes still correctly returned `403` — the
      two permissions are genuinely independent, not accidentally coupled.
    - All test data (2 businesses, 3 auth users) deleted afterward.

- **Phase 3 — fourth real domain: Analytics (2026-09-10):**
  - `supabase/migrations/20260910000009_analytics.sql`: two aggregation
    functions, `business_analytics_summary` and `business_top_services`.
    Deliberately plain `language sql` functions (no `security definer`) —
    Postgres defaults to SECURITY INVOKER, meaning every query inside still
    runs under the CALLER's own RLS, not elevated privileges. A non-member
    querying a business they don't belong to gets zeros/empty rows (RLS
    filters the underlying tables to nothing), never another tenant's
    numbers or an error that reveals the business exists. Chose this over a
    SQL VIEW deliberately — a plain view's owner-vs-invoker permission
    semantics vary by Postgres version and are easy to get subtly wrong in
    a way that silently bypasses RLS; a security-invoker function has no
    such ambiguity.
  - `revenue_estimate` is computed from completed bookings' linked service
    price — explicitly labeled "Estimated revenue" in the UI, not a real
    transaction ledger (no Payments/Orders table exists yet), per
    master-prompt §34: "Do not claim financial accuracy unless underlying
    data supports it."
  - `pages/business/Analytics.tsx`: stat cards (customers, bookings by
    status, tasks by state) + top-5-services-by-bookings list, all
    server-aggregated, none of it computed client-side from raw rows.
  - **Verified live end-to-end** (2026-09-10) — no bugs found, including
    the specific security property this design depends on:
    - Seeded a business with 2 customers, 1 service ($20), 3 bookings
      (2 completed, 1 pending), 1 open task. Owner's summary matched
      exactly: `total_customers: 2`, `completed_bookings: 2`,
      `revenue_estimate: 40.00`, `tasks_open: 1`. Top services correctly
      showed the one service with a count of 3.
    - **The critical test**: a second owner (not a member of that
      business) called the exact same functions with that business's id
      and got all zeros for the summary and an empty array for top
      services — confirmed the SECURITY INVOKER design genuinely enforces
      RLS per-caller rather than leaking another tenant's real numbers.
    - Test data (1 business, 2 auth users) deleted afterward.

- **Phase 3 — final two domains, closing out the phase (2026-09-10):**
  - Fixed a real gap noticed while starting this batch: `MODULE_KEYS`
    (drives the Settings toggle UI and sidebar gating) was missing
    `payments`, `delivery`, and `subscriptions` — all three already used in
    `seed.sql`'s `business_types.default_modules` (e.g. barber's defaults
    include `payments`), meaning those defaults were silently enabled with
    no way to ever see or toggle them in the UI. Added all three.
  - `supabase/migrations/20260910000010_payments_and_memberships.sql`:
    - `payments`: read is gated by `finance.view` specifically (not "any
      active member" the way Customers/Services/Bookings are) — money is
      more sensitive than contact info, and master-prompt §7 lists
      `finance.view` as its own distinct permission for exactly this
      reason. Write gated by `finance.manage`.
    - `customer_memberships`: master-prompt §40's "CustomerMembership" —
      a merchant selling a recurring plan or session package to their OWN
      customer, deliberately named and modeled distinctly from a future
      `BusinessSaaSSubscription` (Phase 8, RepeatlyOS billing a business)
      so the two domains can never be confused. Read open to any member
      (front-desk staff need to check "sessions remaining" routinely);
      write gated by `finance.manage` (selling a plan is a financial act).
  - `pages/business/Payments.tsx`: the first page in this project where
    read access itself is permission-gated — explicitly distinguishes "no
    access" (a lock icon + ask-the-owner message) from "genuinely no
    payments yet", rather than showing a misleading empty state either way.
  - `pages/business/Memberships.tsx`: sell a package (fixed sessions) or
    subscription (recurring) to a customer, track sessions used vs. total.
  - Nav items added, module-gated as usual (`payments`, `subscriptions`).
  - **Verified live end-to-end** (2026-09-10) — no bugs found, and this
    is the most granular permission test run yet:
    - A staff member with zero permissions: payments read → **empty**
      (confirming `finance.view` genuinely gates read, unlike every other
      domain so far where any active member can read); customer_memberships
      read → **succeeded** (open read as designed); writes to both →
      blocked.
    - After granting `finance.view` only: payments read → succeeded
      (saw the real payment); payments write → still `403` (view ≠
      manage).
    - After also granting `finance.manage`: payments write succeeded, and
      the same staffer could now use a session on the customer's package
      (`sessions_used` incremented correctly).
    - A completely unrelated owner (different business) got empty reads on
      both tables.
    - All test data (1 business, 3 auth users) deleted afterward.
  - **Phase 3 is now complete** — all 6 domains (Customers, Tasks,
    Services+Bookings, Analytics, Payments, Customer Memberships) built and
    live-verified. Next: Phase 4 (Commerce — Products/Inventory/Orders/Cart).

- **Phase 4 — Commerce begins: Products (2026-09-10):**
  - `supabase/migrations/20260910000011_products.sql`: real `products`
    table. Deliberately flat (no separate ProductCategory/ProductVariant
    tables yet, per master-prompt §5's eventual entity list) — `category`
    is a plain text column for now, upgradeable to a real FK later without
    breaking this table. Read open to any member (plus a marketplace-
    visible public-read clause, same pattern as `businesses`, anticipating
    Phase 6 without building it yet); write gated by `products.manage`.
  - `pages/business/Products.tsx`: real CRUD UI with price/sale price/SKU.
  - Nav item + route added, module-gated by the existing `products` key.
  - **Verified live end-to-end** (2026-09-10) — no bugs found:
    - Cross-tenant isolation held for a non-marketplace-visible product
      (empty reads for both a different business owner AND a completely
      unauthenticated anon session, blocked writes).
    - The public marketplace-visible clause verified for real: after
      setting `marketplace_visible = true`, a plain unauthenticated
      session (no login at all) could read the product — the first live
      proof this project has a working public-read path, a preview of
      Phase 6.
    - Staff permission gating: read succeeded with zero permissions, write
      was `403` until `products.manage` was granted, then succeeded.
    - All test data (1 business, 3 auth users) deleted afterward.

- **Phase 4 — Inventory (2026-09-10):**
  - `supabase/migrations/20260910000012_inventory.sql`: `inventory_items`
    (one row per tracked product, `quantity` denormalized) +
    `inventory_movements` (append-only ledger — every stock change is a
    permanent row, no update/delete policy exists for movements at all).
    `apply_inventory_movement` trigger is the ONLY thing that ever changes
    `quantity`; a second trigger, `reject_direct_quantity_change`, actively
    **rejects** any client attempt to PATCH `quantity` directly (using a
    transaction-local flag to distinguish its own internal update from a
    client one) — written this way on purpose, since an RLS policy alone
    only gates which rows can be updated, not which columns, and would not
    by itself have stopped a client from just setting `quantity` to
    anything via a normal PATCH. `quantity >= 0` enforced by a check
    constraint. Read open to any member; write (`inventory.adjust`) only
    lets you create a tracking row (`inventory_items` insert) or record a
    movement — never touch quantity as a bare number.
  - `pages/business/Inventory.tsx`: per-product stock view with low-stock
    highlighting and +/- adjustment buttons (each one inserts a movement,
    never writes quantity directly, matching the DB design). Products
    without inventory tracking show "Start tracking" instead of a
    always-on row (not every product needs stock tracking).
  - **Verified live end-to-end** (2026-09-10) — no bugs found, and this
    is the most defense-in-depth test run so far:
    - A `+10` restock movement correctly brought quantity to 10; a `-3`
      sale movement correctly brought it to 7.
    - A `-100` movement (would take stock negative) was rejected by the
      `quantity >= 0` check constraint, and — critically — the movement
      row itself was NOT left orphaned (confirmed via admin key): the
      trigger chain rolled back atomically, exactly as a single Postgres
      statement should.
    - **The specific gap this design closes**: a raw `PATCH
      inventory_items?id=eq...  {"quantity": 9999}` was rejected outright
      with the custom error `"quantity can only be changed by inserting an
      inventory_movements row, not updated directly"`, and the value
      stayed untouched — proving the second trigger genuinely closes the
      column-level hole that RLS alone would have left open.
    - Cross-tenant isolation and permission-gated writes (`inventory.adjust`
      required, staff blocked without it) both confirmed as usual.
    - All test data (1 business, 3 auth users) deleted afterward.

## In Progress

- Nothing actively in progress; paused after Phase 1 pending the user
  provisioning a real Supabase project and confirming the auth flow works
  end-to-end, per Migration Plan → "Required Before Phase 1 Is Testable."

## Next

- Once Supabase credentials are confirmed working: Phase 2 — merchant
  onboarding (business registration flow, city + business-type selection,
  copying `business_types.default_modules` into `business_modules` at
  creation, approval workflow).

## Known Issues

- No git history existed before this session (see Migration Notes).
- No test suite exists anywhere in the repo.
- No `.env`/environment configuration exists yet (nothing needs one until a
  backend exists).
- `BusinessPublicPage` and `CustomerPortal` are hardcoded to a single business
  rather than parameterized by slug — expected to be replaced in Phase 6.
- `ROLE_PERMISSIONS`/`canAccess` in `DemoContext.tsx` are defined but never
  enforced by a route guard — cosmetic only today.

## Technical Debt

See audit §11 for the full list. Highlights: sequential per-array IDs not
suitable for a real schema; staff referenced by name string instead of entity
ID; single global `businessKey` makes the whole app single-tenant by
construction; 1.29 MB single JS chunk on build (no code-splitting — expected
for a 40-route SPA that imports every page eagerly in `App.tsx`; worth
revisiting once real routing/auth-gating is introduced in later phases, not a
blocker now).

## Security Notes

No backend exists yet, so there is no server-side attack surface today.
`/dashboard/*` routes are unauthenticated and unguarded client-side, but this
carries no real risk currently because there is no real data or account to
protect. This must not carry into Phase 1+: every new API route must enforce
tenant isolation and authorization server-side from the first line of code
(master-prompt §6, §26).

## Migration Notes

- This repository had no `.git` directory at the start of this session. Ran
  `git init` and committed the exact pre-transformation state (plus the new
  `docs/` audit files) as the baseline commit, so the original demo is never
  lost and all future changes are reviewable as diffs against it.

## Baseline Tooling Output (recorded before any Phase 1 changes)

**Install:** `npm install` — 260 packages added, 0 errors. `npm audit`: 8
advisories (1 low, 2 moderate, 5 high) in transitive dependencies — not
triaged yet; revisit during Phase 9 hardening.

**Lint (`npm run lint`):** 26 problems (17 errors, 9 warnings), all
pre-existing, confined to 14 files:

- `ChurnBadge.tsx`, `CommandPalette.tsx`, `DemoContext.tsx`,
  `BusinessPublicPage.tsx`, `CustomerPortal.tsx`, `Commissions.tsx`,
  `Customers.tsx`, `Expenses.tsx`, `Forecast.tsx`, `Heatmap.tsx`,
  `Inventory.tsx`, `Packages.tsx`, `Reminders.tsx`, `Subscriptions.tsx`,
  `Tasks.tsx`
- Two recurring patterns: (1) `@typescript-eslint/no-explicit-any` in a few
  spots, (2) `react-hooks/set-state-in-effect` — several dashboard pages call
  `setState` synchronously inside a `useEffect` keyed on `business.key` to
  reset local state when the demo business template is switched (an artifact
  of the single-tenant demo-switcher pattern that goes away once pages read
  real per-business data from an API instead of re-seeding local state on
  business-switch).
- **Not treated as a blocker for Phase 0**, per master-prompt §46 ("record
  baseline failures, do not blame new work for pre-existing failures"). Will
  be cleaned up incidentally as each affected page is migrated to real data
  in later phases, since the underlying cause (re-deriving state from a
  switchable mock `business` prop) disappears once real API data replaces it.

**Typecheck + build (`npm run build` → `tsc -b && vite build`):** Passes
cleanly, 0 TypeScript errors. Vite build succeeds in ~21s. One warning: a
single 1.29 MB JS chunk (gzip 325 KB) because all 40 routes are imported
eagerly in `App.tsx` with no code-splitting — not a blocker, worth revisiting
once real auth-based route gating exists.

**Tests:** No test runner installed, no test files exist — nothing to run.
