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

- **Phase 4 — Orders, closing out the phase (2026-09-10):**
  - `supabase/migrations/20260910000013_orders.sql`: `orders` +
    `order_items`. `order_items` snapshots `product_name`/`unit_price` at
    order time rather than only referencing `product_id` — per
    master-prompt §27, historical order records must stay accurate even if
    a product is later renamed, repriced, or deleted (`product_id` is
    nullable with `on delete set null` for exactly that reason). Write
    gated by `orders.manage`; `order_items` has no `business_id` of its
    own, RLS checks tenant ownership via the parent order instead of
    duplicating the column onto every line-item table.
  - **Two deliberate scope decisions, called out rather than silently
    made**: (1) "Cart" (master-prompt §18) is NOT built — it's a consumer-
    marketplace concept and no consumer marketplace exists yet (Phase 6);
    building cart UI with nothing to shop from would be fake scaffolding.
    (2) Placing an order does NOT auto-decrement inventory — which status
    transition should trigger that, how cancellation/refund should reverse
    it, and what happens for untracked products are real product decisions
    not guessed at here; stock adjustment stays a manual step via the
    Inventory page for now.
  - `pages/business/Orders.tsx`: build an order by adding products as line
    items (from the real product catalog, defaulting to sale price when
    set), computed total, status workflow (new → confirmed → preparing →
    ready → completed, plus cancelled/refunded).
  - Nav item + route added, module-gated by the existing `orders` key.
  - **Verified live end-to-end** (2026-09-10) — no bugs found, and the
    snapshot-immutability guarantee was proven for real, not just assumed:
    - Created a product, an order, and a line item snapshotting it.
    - Renamed and repriced the product afterward — the order line item
      still showed the ORIGINAL name/price, untouched.
    - Deleted the product entirely — the line item survived
      (`product_id` correctly became `null` via `on delete set null`),
      `product_name`/`unit_price` still intact. This is the concrete proof
      that historical order records can never be corrupted by a later
      product edit or deletion.
    - Cross-tenant isolation held, including the subtler attack of a
      different business's owner trying to insert an `order_items` row
      that *references* business A's real order id directly (knowing the
      UUID) — correctly rejected (`42501`), confirmed via admin key that
      no row was added.
    - Permission gating for `orders.manage` confirmed precisely: reset the
      order to `new`, had an unpermitted staffer attempt to PATCH it to
      `completed` (got `204`, PostgREST's standard "matched 0 rows"
      response for a blocked UPDATE), then independently verified via
      `service_role` that the status was still genuinely `new` — not just
      an empty response that could be masking a real change.
    - All test data (2 businesses, 3 auth users) deleted afterward.
  - **This closes out Phase 4's initial domain list** (Products, Inventory,
    Orders) — all live-verified against the real project.

- **Phase 6 — City Marketplace (2026-09-10):** the public consumer-facing
  side of the platform, built as its own layout (master-prompt §32: never
  mix admin UI and marketplace UI) with no auth required.
  - **Real architectural gap addressed first, not discovered later**:
    before this phase, `orders`/`bookings` INSERT was gated entirely by
    `orders.manage`/`bookings.manage` — an anonymous shopper had no path to
    place an order or book a service at all. Fixed with guest checkout, not
    a consumer account system (matches the Lebanon-specific cash/WhatsApp-
    first framing and "don't overbuild"): `orders`/`bookings` gained
    `customer_name`/`customer_phone` columns, and narrowly-scoped
    ADDITIONAL permissive RLS policies (not modifying anything already
    verified in Phases 1-4) allow public INSERT only when the target
    business is `active` and `marketplace_visible`.
  - `services` gained the same public-read clause `products`/`businesses`
    already had (products needed it in Phase 4; nothing needed it for
    services until now).
  - `product_stock_status()`: a `security definer` function returning only
    a coarse status (`in_stock`/`low_stock`/`out_of_stock`/`not_tracked`),
    never the real quantity — `inventory_items` has no public read policy
    at all, per master-prompt §15 ("never expose exact inventory
    quantities"). The function independently re-verifies the product is
    actually public rather than trusting the caller.
  - `supabase/migrations/20260910000014_marketplace_public_access.sql`
    covers all of the above.
  - Pages: `CityHome` (business listing + category chips + search box),
    `Search` (real server-side ILIKE queries across products/services
    scoped to the city — explicitly not client-side filtering, per
    master-prompt §17), `BusinessStorefront`, `ProductDetail` (stock
    status badge, add to cart), `ServiceDetail` (guest booking form),
    `Cart` (guest checkout → creates a real order + order_items).
  - `MarketplaceCartContext`: pure client-side, localStorage-persisted, one
    merchant per cart (master-prompt §18) — no server-side cart table,
    since a cart is a draft and only the final order needs to be permanent.
  - **Deliberate MVP gap, flagged not hidden**: no rate limiting/CAPTCHA on
    the new public insert paths — a bad actor could spam orders/bookings
    at any marketplace-visible business today. Acceptable for an initial
    single-city launch; must be revisited in Phase 9 hardening.
  - **Live testing found two real bugs, both fixed** (2026-09-10):
    1. **`products_member_read`'s public-read clause (from Phase 4) never
       checked the parent business's `status`/`marketplace_visible` — only
       the product's own two flags.** Confirmed live: a product with
       `marketplace_visible=true` on a business still in `draft` was
       publicly readable anyway, directly contradicting master-prompt §9.
       The Phase 4 verification of this exact policy never tested this
       specific combination, so it passed at the time on a narrower case.
       Fixed in `20260910000015_fix_products_public_read_gap.sql`, bringing
       `products` in line with the (already-correct) pattern
       `services_public_read` and the orders/bookings policies use.
    2. **`order_items_public_marketplace_insert`'s WITH CHECK used an inline
       subquery against `orders`**, which has no public SELECT policy —
       so that subquery, itself subject to RLS for the calling (anonymous)
       role, always saw zero rows, even for an order the same guest had
       just created moments earlier. Confirmed live: guest order creation
       itself succeeded (its check only needs `businesses`, which does
       have a public-read clause), but adding an item to it failed every
       time. Fixed in `20260910000016_fix_order_items_public_insert.sql`
       by routing the check through a new `security definer` function
       (`order_is_public_marketplace`) — the same pattern every other
       cross-table RLS check in this project already uses, for exactly
       this reason.
    3. Also fixed in the frontend: `Cart.tsx`'s order insert requested the
       row back via `.select().single()`, which — same root cause as the
       Phase 1 `businesses` bootstrap bug — fails for a guest with no
       stable identity to grant read-back access to. Fixed by generating
       the order id client-side (`crypto.randomUUID()`) and not requesting
       the row back at all, since the client already knows every value it
       inserted. `ServiceDetail.tsx`'s booking insert was already written
       without `.select()`, so it was unaffected.
  - **Fully re-verified live after both fixes** (2026-09-10) — every
    scenario now passes:
    - The hidden business's product is now genuinely invisible to `anon`
      (was leaking before Fix 1).
    - A guest can now add `order_items` to their own just-created order
      (was failing before Fix 2) — confirmed both via the guest's own
      session and independently via `service_role`.
    - `product_stock_status()` verified across all four states
      (`not_tracked` → `out_of_stock` → `low_stock` → `in_stock`, driven by
      real inventory movements) — and confirmed `anon` still cannot read
      the raw `inventory_items` row directly at all (empty result), so the
      status function is the only way stock info reaches the public, never
      the real number.
    - **Full-loop integration check**: the merchant's own dashboard view
      (`orders`/`bookings` read as the business owner) correctly shows the
      guest-placed orders and the guest booking, contact info intact —
      concrete proof the marketplace and merchant sides are properly
      connected, matching master-prompt §53's "what success looks like."
    - All test data (2 businesses, 1 auth user) deleted afterward.
  - **This completes Phase 6.**

## Phase 7 — Platform & City Administration

- Most of the RLS/data model for this phase already existed from Phase 1
  (`platform_admins`, `city_admins`, `is_city_admin()` already treats a
  platform admin as passing every city-scoped check, `audit_logs` table).
  What was missing was: a way to find a user to grant `city_admin` to, real
  audit logging for business status changes, and the actual admin UI.
- `20260910000017_admin_foundations.sql`:
  - Added `profiles.email` (backfilled from `auth.users`), and updated
    `handle_new_user()` to populate it going forward, so a platform admin
    can look up a user by email instead of needing a raw `user_id`.
    `profiles` already allowed platform-admin reads of all rows
    (`profiles_select_own: id = auth.uid() OR is_platform_admin()`), so no
    RLS change was needed for this to be readable.
  - Added an `audit_business_status_change()` trigger on `businesses` (after
    update, fires only when `status` actually changes) that writes to
    `audit_logs` with the actor, business, city, and a `{from, to}` metadata
    payload. Implemented as a trigger rather than a client-side insert call
    specifically so it fires regardless of which UI path changed the status
    and can't be bypassed by a client that omits the log call.
- `src/hooks/useAdminRoles.ts` — reads `platform_admins`/`city_admins` for
  the current user to compute `isPlatformAdmin` / `cityAdminOf`. Documented
  as a self-check/UX convenience only: RLS is what actually gates every
  admin action, and both tables are themselves RLS-gated to admins, so an
  empty result here is indistinguishable from "not an admin" by design.
- `src/pages/admin/PlatformAdminDashboard.tsx` (`/platform-admin`):
  platform-wide counts (cities, businesses by status, orders, bookings —
  explicitly no MRR/trial/churn metrics, since no billing system exists
  yet per master-prompt §22's ban on fake production metrics); a
  pending-business-approval queue with approve/reject buttons; city
  creation and per-city toggles (open-for-merchants / public-marketplace);
  a "grant city admin by email" form built on the new `profiles.email`
  column.
- `src/pages/admin/CityAdminDashboard.tsx` (`/city-admin/:cityId`):
  city-scoped business list with approve/suspend/reinstate actions, and a
  city description editor. Gated so a city admin can only act within their
  own `cityId` (checked client-side via `useAdminRoles` for UX, enforced
  server-side by the existing `is_city_admin()` RLS predicate) while a
  platform admin can reach any city.
- Both routes added to `src/App.tsx` behind `RequireAuth`, placed before
  the `/:citySlug` marketplace catch-all route so they aren't swallowed by
  it. `AppHome.tsx` now shows a banner linking to these dashboards for
  users who actually hold the corresponding role.
- `npm run build` passes; `npm run lint` shows no new issues beyond this
  codebase's existing `react-hooks/set-state-in-effect` pattern, already
  present in every other async-loading page (Search.tsx, Reminders.tsx,
  Subscriptions.tsx, Tasks.tsx, etc.).
- **Live-verified end to end (2026-09-10)**, migrations
  `20260910000017_admin_foundations.sql` and
  `20260910000018_restrict_business_status_change.sql` both applied. Test
  setup: 2 cities (Batroun + a temporary second test city), 3 auth users
  (platform admin, city admin scoped to Batroun, plain non-admin owner),
  2 businesses (one per city, both `pending_approval`).
  - `handle_new_user` correctly backfills `profiles.email` for brand-new
    signups, not just existing rows.
  - City admin approved their own city's business (succeeded) and was
    silently blocked approving the other city's business (empty result,
    row unchanged) — confirmed via `service_role` that its status was
    untouched. Correct city-scoped isolation.
  - `audit_logs` got the expected row for the successful change: actor =
    the city admin, `metadata: {from: pending_approval, to: active}`.
  - Platform admin approved a business in a city they hold no
    `city_admins` row for (succeeded, as expected — platform admin passes
    every `is_city_admin()` check), and could look up a user by
    `profiles.email` for the grant-city-admin flow.
  - A plain non-admin user's `platform_admins`/`city_admins` reads both
    return empty (the exact self-check `useAdminRoles` relies on).
  - **Found and fixed a real gap**: the plain business owner was able to
    directly PATCH their own business's `status` from `active` to
    `suspended` themselves — the Phase 1 `businesses` UPDATE policy
    allowed owner/manager to change any column, `status` included, so an
    owner could self-approve or self-reactivate and bypass the entire
    admin workflow this phase adds. Fixed in
    `20260910000018_restrict_business_status_change.sql` with a BEFORE
    UPDATE trigger comparing OLD/NEW status and requiring
    `is_city_admin()` for any change — a plain RLS `WITH CHECK` subquery
    was avoided given the same-statement old/new visibility subtleties
    noted in earlier migrations.
  - **Re-verified after the fix**: the same owner's self-status-change now
    fails (`P0001`, "Only a city or platform admin may change a
    business's status"), the same owner can still edit non-status fields
    on their own business (e.g. `description`), and the city admin can
    still change status normally.
  - All test data (2 businesses, 2 admin-grant rows, 1 extra city, 3 auth
    users, the audit log rows they generated) deleted afterward.
  - **This completes Phase 7.**

## Phase 8 — SaaS Entitlements (in progress)

- `20260910000019_saas_entitlements.sql`: `saas_plans` (free/growth/pro,
  each with `included_modules`, `price_monthly_usd`, `max_branches`) and
  `business_saas_subscriptions` (one row per business: `plan_key`,
  `status`, `current_period_end`). No payment gateway — a business's plan
  is assigned by a platform admin, not self-serve checkout, matching the
  actual MVP scope (§40 distinguishes this from a merchant's own customer
  packages/subscriptions, which already exist as `customer_memberships`).
  - The free plan's `included_modules` was deliberately set to cover
    every module any seeded `business_types.default_modules` already
    grants, so `copy_default_modules` (Phase 2) keeps working unchanged
    for a brand-new business landing on the free plan.
  - `enforce_module_plan_entitlement()` (a BEFORE INSERT/UPDATE trigger on
    `business_modules`) is the actual enforcement point:
    `data/moduleKeys.ts` has said since Phase 2 that "plan/entitlement
    gating... is Phase 8 — not implemented yet"; this is that. Disabling
    a module is always allowed; enabling one outside the plan raises a
    Postgres exception, which `ModulesPanel.tsx` now surfaces directly to
    the merchant instead of a generic error. Falls back to the default
    plan's modules if a business has no subscription row yet, so it
    doesn't depend on trigger-firing order against
    `on_business_created_saas_subscription`.
  - RLS: `saas_plans` is publicly readable (plain pricing info, same
    precedent as `cities_read`'s public-readability for non-sensitive
    platform data); `business_saas_subscriptions` is readable by the
    business's own owner/manager or a platform admin, writable only by a
    platform admin.
- `src/components/PlanPanel.tsx` — shown at the top of
  `BusinessSettings.tsx`: current plan name, price, included modules,
  subscription status.
- `src/pages/admin/PlatformAdminDashboard.tsx` — new "Businesses & plans"
  section: every business with dropdowns to change its `plan_key` and
  subscription `status`. Corrected the dashboard's earlier "no
  billing/subscription system exists yet" note now that one does (though
  still no real payment history to compute MRR from).
- `npm run build` passes; no new lint issues beyond the existing
  codebase-wide `set-state-in-effect` pattern.
- **Live-verified (2026-09-10)**, migration applied. Test setup: 1
  business (barber type, in Batroun), 3 auth users (its merchant owner, a
  platform admin, an unrelated second merchant).
  - The new business auto-defaulted to `free`/`active` in
    `business_saas_subscriptions`, and `copy_default_modules` (barber's
    defaults: bookings, customers, staff, payments, analytics) succeeded
    through the new entitlement trigger without any change needed —
    confirms the free plan's `included_modules` really does cover every
    seeded business type's defaults.
  - Merchant enabling `products` (already covered by `free`) succeeded;
    enabling `tasks` (growth/pro-only) failed with exactly the expected
    message (`P0001`, "not included in your current plan. Upgrade to
    enable it."); disabling `staff` succeeded regardless of plan.
  - Platform admin changed the business's plan to `growth`; the merchant
    immediately retrying `tasks` then succeeded — confirms the gate reads
    live plan state, not something cached at business-creation time.
  - An unrelated merchant (no membership, not an admin) reading this
    business's `business_saas_subscriptions` got an empty result.
  - The business's own owner tried to PATCH their own subscription's
    `plan_key` directly (self-upgrade) — empty result, plan unchanged;
    confirms there's genuinely no self-serve billing path, only the
    platform-admin one.
  - All test data (1 business — cascaded its modules/subscription/
    memberships —, 1 admin grant, 3 auth users) deleted afterward.
  - **This completes Phase 8's SaaS-entitlements core.** Structured
    product search (scoped into this same phase) is still unbuilt.

## Phase 8 — Structured/Faceted Product Search (part 1)

- `20260910000020_product_attributes.sql`: `product_attributes`
  (`product_id`, `key`, `value`, one row per key per product — free-form
  rather than fixed columns, since different business types need
  different facets, same reasoning as `business_types.default_modules`).
  - Read RLS deliberately just re-checks `exists(select 1 from products
    where id = product_id)` rather than re-deriving the member-or-public
    visibility rule a second time — that subquery is itself subject to
    the calling role's own RLS on `products` (`products_member_read`),
    so it automatically inherits whatever that policy currently allows,
    including the Phase 6 fix for the parent-business-status check,
    instead of a second copy of that logic silently drifting out of
    sync. Write RLS requires `has_business_role` (owner/manager) on the
    product's own business.
- `src/pages/business/Products.tsx`: the add/edit product form now has a
  free-form key/value attribute editor (add/remove rows); saved by
  deleting and re-inserting the product's `product_attributes` rows
  (simplest correct approach at this scale — a product has at most a
  handful of attributes).
- `src/pages/marketplace/Search.tsx`: facet dropdowns are now populated
  from the distinct `product_attributes` keys/values actually present in
  that city's publicly-visible products (capped at 4 facets), not a
  hardcoded brand/size/color list. Selecting facets joins
  `product_attributes` into the product query once per selected facet
  (aliased `attr_0`, `attr_1`, … so multiple key/value filters can
  co-exist in one PostgREST embedded-resource query). A facet-only browse
  (no text query) no longer also runs a matches-everything service
  search, since facets are product-only.
- `npm run build` passes; no new lint issues beyond the existing
  codebase-wide `set-state-in-effect` pattern (present in the original
  `Search.tsx` before this change too).
- **Found and fixed a real gap while setting up this verification
  (2026-09-10)**: `20260910000018`'s status-change trigger only guarded
  UPDATE, never INSERT — `businesses_insert_authenticated` had no
  constraint on the status value, so a plain authenticated user could
  create a business with `status: 'active', marketplace_visible: true`
  directly, fully self-approving at creation time. Confirmed live before
  fixing. Fixed in `20260910000021_restrict_business_status_on_insert.sql`
  (a BEFORE INSERT trigger requiring a non-admin-created business to
  start `draft` or `pending_approval`); re-verified the same insert now
  fails with the expected message, and a properly-created
  `pending_approval` business still inserts fine. Also incidentally
  confirmed the Phase 7 UPDATE trigger is real defense-in-depth, not just
  RLS-adjacent: even a `service_role` PATCH (which bypasses RLS entirely)
  was rejected, since a plain Postgres trigger fires regardless of the
  calling role's RLS-bypass status — approving a business now requires an
  actual signed-in admin session, not just elevated credentials.
- **Live-verified (2026-09-10)**, migration applied. Test setup: 2
  merchants, 1 platform admin, business A (approved, active,
  marketplace-visible) with 2 tagged products (Nike/43/Black,
  Adidas/42/White), business B (left in `pending_approval`, i.e. never
  approved/hidden) with 1 tagged product (Puma).
  - `anon` reading `product_attributes` with no filter got exactly the 6
    rows belonging to business A's products — the hidden business B's
    `Puma` row was absent, confirming the deferred-to-`products`-RLS
    design (checking `exists(select 1 from products where id =
    product_id)`) correctly inherits product visibility without
    duplicating the business-status check.
  - The actual embedded-resource query pattern `Search.tsx` builds
    (`attr_0`/`attr_1` aliased joins) was tested directly: filtering by
    `brand=Nike AND size=43` returned only the Kobe shoe; filtering by
    `brand=Adidas` alone returned only the Ultraboost — both facets and
    facet combinations narrow correctly.
  - An unrelated merchant (no role on business A) attempting to insert an
    attribute onto business A's product got `42501` (RLS violation) —
    confirmed no rows were written.
  - All test data (2 businesses — cascaded their products/attributes —,
    their audit-log rows, 1 admin grant, 3 auth users) deleted afterward.
  - **This completes Phase 8's faceted product search (part 1).**
  - Left Batroun's `marketplace_enabled` set to `true` (it had been off
    since Phase 6, which is why nothing was visible when the user first
    tried browsing `/batroun`) — this directly unblocks the browsing flow
    the user asked about earlier; there are currently zero real
    businesses in it, so `/batroun` will show an empty state until one is
    registered and approved.
- Deliberately still not built: the optional natural-language query layer
  (LLM extracts filters, applies them through this same faceted query) —
  scoped in `docs/REPEATLYOS_MIGRATION_PLAN.md` as an explicitly optional
  post-MVP addition, not blocking anything.

## Homepage, City Directory &amp; Smart Search Redesign (2026-09-10, before Phase 9)

Requested directly by the user, ahead of Phase 9: the old landing page was
entirely the pre-transformation demo pitch (subscription/booking SaaS copy,
a "Frontend demo — no backend connected" banner that was no longer true,
and zero mention of the marketplace) and there was no way to discover what
cities existed short of already knowing a `citySlug`.

- `src/pages/LandingPage.tsx` rewritten: hero states what RepeatlyOS is in
  one paragraph (a city marketplace for shoppers + the operating system
  the businesses on it run on), a live city-directory teaser fetched from
  `cities` right on the homepage, the smart-search bar (below), and a
  single condensed "for business owners" section — replacing the old
  multi-section pitch-deck-style page (pain points / engines /
  before-after / pricing tiers / demo links). The legacy demo routes
  (`/dashboard`, `/demo/*`, `/business/elite-carwash`, `/customer/portal`)
  are untouched and still reachable directly — just no longer linked from
  the homepage, since foregrounding a fully-fake demo dashboard next to a
  real backend was actively misleading.
- `src/pages/CityDirectory.tsx` (`/cities`): every `marketplace_enabled`
  city as a card, linking to `/:citySlug`. Only page that needs to exist
  for "how do I even find out what cities exist" — previously nothing
  answered that.
- **Smart search** (`src/lib/smartSearch.ts` + `src/pages/marketplace/
  Discover.tsx`, `/discover?q=`): the "type a request, get a
  recommendation" feature — e.g. "nike basketball shoes in shekka". Rule-
  based, not LLM-based (user's explicit choice, to avoid an API-key/
  billing dependency and keep it instant/free):
  - Matches words in the query against real city names (`cities.name`)
    and real tagged values already in `product_attributes`, longest/most
    specific match wins per attribute key (max 3 facets). Leftover
    non-stopword text becomes a keyword `ILIKE` against product
    name/category.
  - Runs the match through the exact same faceted-query pattern
    `Search.tsx` already uses (aliased `attr_0`/`attr_1`… embeds).
  - If the matched city has zero results and has a `region`, falls back
    to other `marketplace_enabled` cities sharing that region, labeled
    "nearby" in the UI — this is what makes "shekka, or near shekka if
    available" concrete: region is a real column already on `cities`,
    not a geo-distance calculation.
  - With no city recognized in the query at all, searches every
    marketplace-enabled city at once.
- `20260910000022_seed_second_city.sql`: adds Shekka (Chekka) as a second
  city, same region as Batroun ("North Lebanon") — a real neighboring
  pair, so the "nearby" fallback has a genuine case to demonstrate with,
  and directly answers the user's earlier question about browsing Shekka.
- `npm run build` passes; no new lint issues beyond the existing
  codebase-wide `set-state-in-effect` pattern.
- **Live-verified (2026-09-10)**, migration applied — Batroun and Shekka
  both confirmed present. Unit-tested `parseQuery` directly (city + facet +
  leftover-keyword extraction) against realistic sample vocabulary before
  touching the database, then set up one approved test business in
  Batroun with a product ("Pro Basketball Shoe") tagged `brand: Nike`.
  - `"nike basketball shoes in batroun"` correctly parsed to
    `city: Batroun, facets: [brand=Nike], keywords: "basketball shoes"`
    and the resulting query matched the product directly.
  - `"nike basketball shoes in shekka"` parsed to `city: Shekka`; Shekka
    alone genuinely had zero results (confirmed independently), which is
    exactly what triggers the same-region fallback; the fallback query
    (Batroun, Shekka's only same-region neighbor) found the product —
    concrete proof of the "shekka, or near shekka if available" behavior
    the user asked for.
  - **Found and fixed a real accuracy gap during this verification**: the
    leftover-keyword filter used plain `ILIKE`, so the shopper's own
    wording ("basketball shoe**s**") failed to match a product literally
    named "Basketball Shoe" (singular) — a plural mismatch a human
    wouldn't even notice but a substring match can't bridge. Switched
    `smartSearch.ts`'s keyword filter from `ILIKE` to Postgres full-text
    search (`plfts`, English config, which stems "shoes" → "shoe"),
    verified live that the exact same query now matches; also hardened
    `parseQuery` to strip punctuation per word before building the
    keyword string (a stray comma could otherwise break the PostgREST
    `or=(...)` filter syntax). `Search.tsx`'s own direct-query ILIKE was
    left as-is — out of scope for this fix, since it wasn't what broke.
  - All test data (1 business — cascaded its product/attribute —, its
    audit-log row, 1 admin grant, 2 auth users) deleted afterward; both
    real cities left in place.
  - **This completes the homepage/city-directory/smart-search redesign.**

## Demo/Seed Data &amp; Passwordless Auth (2026-09-11, before Phase 9)

Requested directly by the user: real browsable content for manual testing,
plus removing the password/email-confirmation friction from sign-up.

- **Persistent demo data** (not test-and-cleanup — meant to stay):
  4 businesses across the 2 real cities, each with an owner account
  created via the Admin API (`seed-sports-merchant@repeatlyos-demo.com`,
  `seed-shekka-merchant@repeatlyos-demo.com`) and approved via a
  throwaway seed platform-admin account whose `platform_admins` grant was
  revoked immediately afterward (least privilege — it only existed long
  enough to approve these 4 rows). All three seed accounts had their
  passwords scrambled to an unretained random value once done, so they
  can't be signed into at all going forward (no password UI exists
  anymore anyway, and nobody owns those inboxes for the passwordless
  flow) — they exist purely to satisfy the `businesses.created_by` /
  membership foreign keys, not as usable logins.
  - **North Sport** (Batroun, `clothing_store`): 4 sneakers, each tagged
    `brand`/`size`/`color` via `product_attributes` (Nike/Adidas/Puma
    across sizes 41–44), plus tracked inventory (15–24 units each) — real
    data to exercise the faceted search, product detail pages, and the
    Inventory dashboard.
  - **Batroun Cuts** (Batroun, `barber`): 2 bookable services (Haircut,
    Beard Trim) — exercises the services/booking flow.
  - **Shekka Boutique** (Shekka, `clothing_store`): 3 products
    (jacket/dress/shorts) tagged with different brands/sizes/colors,
    including a `Nike` pair specifically so the "in Shekka" case has its
    own direct match, not just the Batroun fallback.
  - **Shekka Bites** (Shekka, `restaurant`): a small food menu — exercises
    a business type with no size/color attributes at all.
  - Confirmed live via `anon` queries: both cities' businesses are
    publicly visible with the right names/slugs.
- **Passwordless auth** (`AuthContext.tsx`, `Login.tsx`, `Signup.tsx`):
  replaced `signUp`/`signIn` (password + separate "click this link to
  confirm your email" step) with `requestSignupCode` /
  `requestLoginCode` / `verifyCode`, built on Supabase's
  `signInWithOtp`/`verifyOtp`. A user now signs up with just email + full
  name, or logs in with just email — no password field anywhere.
  - Chose this over a truly zero-verification "just type an email and
    you're in" flow (which is what "remove verification via email" could
    literally mean) because that would let anyone claim any email address
    and immediately get a real session under that identity — a serious
    account-takeover hole. The OTP code *is* the verification step here,
    just collapsed into the same screen instead of a separate
    password-signup-then-confirm-later flow, and there's no password to
    manage, reset, or leak.
  - Signup uses `shouldCreateUser: true` (first use creates the account,
    populating `full_name` via the existing `handle_new_user` trigger);
    login uses `shouldCreateUser: false` so a typo'd/unregistered email
    gets a clear error instead of silently creating an account with no
    name on file.
  - Both pages also auto-continue if the shopper clicks the emailed link
    instead of typing the code (a `useEffect` on `user` in `Login.tsx`;
    `Signup.tsx`'s next step is reached via `verifyCode` directly since
    it needs to happen exactly once regardless of which path completes
    it first).
  - After a successful signup, the user now lands on
    `/account/security?next=/onboarding` — the existing passkey
    management page, extended with a `next` param so a brand-new user is
    prompted to add a passkey with a clear "Skip for now" escape hatch,
    then continues to business registration either way. This is also
    where an existing user can add a passkey any time, or a returning
    user without one falls back to the email-code login — together this
    covers "set a new passkey if not available, or enter with an
    existing one."
  - Fixed a stale reference while in this file: `AccountSecurity.tsx`'s
    back-link pointed at `/dashboard` (the original fully-fake demo,
    unrelated to a real signed-in user) instead of `/app`.
  - `npm run build` passes; no new lint issues beyond this codebase's
    existing patterns (the `useAuth`/`AuthProvider` co-export flagged by
    `react-refresh/only-export-components` already existed before this
    change, same as `DemoContext.tsx`/`MarketplaceCartContext.tsx`).
  - **Not yet live-verified against a real inbox** — sending real email
    depends on the Supabase project's configured email delivery (its
    default built-in sender is rate-limited; a custom SMTP provider may
    already be configured, unverified). The user should sign up for real
    at `/signup` with an email they control to confirm the OTP email
    actually arrives.

## Signup Approval, Super Admin Login &amp; Admin Passkey Revocation (2026-09-11)

The user signed up as `boutros.georges513@gmail.com` using the previous
turn's OTP-signup flow — granted `platform_admins` immediately. Then asked
for a different model: signup should create no account at all, just a
request a platform admin reviews; city admins are never self-registered,
only assigned; the super admin gets a dedicated login page; and a
platform admin should be able to revoke another user's passkey (e.g. lost
device).

- `20260910000023_signup_approval.sql`: new `signup_requests` table
  (full_name, email, status). Insert is open to anyone (there's no
  account yet at this point — nothing to scope it to); read/update is
  platform-admin only. A partial unique index blocks a second pending
  request for the same email. This is what actually resolves the earlier
  "remove verification" tension: there's truly nothing to verify at
  submission time, since no session or `auth.users` row is created until
  a human approves it.
- `Signup.tsx` rewritten again: just full name + email + submit → one
  INSERT into `signup_requests`, no Supabase Auth call at all. Shows a
  static "submitted, awaiting approval" confirmation.
- `PlatformAdminDashboard.tsx`: new "Pending signup requests" section.
  Approving calls the existing `requestSignupCode(email, fullName)` (this
  is the only place that function is called now — it creates the
  `auth.users` row and emails them a one-time sign-in code/link) and
  marks the request `approved`; rejecting just marks it `rejected`. This
  is also where "if approved, they can log in and set a passkey" actually
  happens — clicking the emailed link/entering the code lands them
  signed in, same as the old flow, and from there `/account/security`
  offers passkey setup exactly as before.
- **Admin passkey revocation** (`supabase/functions/admin-manage-passkeys/
  index.ts`, new `adminListPasskeys`/`adminRevokePasskey` in
  `AuthContext.tsx`, a new section on `PlatformAdminDashboard.tsx`):
  the client-side passkey API (`supabase.auth.passkey.*`) is self-service
  only — it always operates on the caller's own account. Revoking
  *someone else's* passkey requires the GoTrue Admin API
  (`admin.passkey.list/delete`, scoped by `userId`), confirmed present by
  reading the installed `@supabase/auth-js` source directly rather than
  assuming — which only works with the service_role key, so this needed
  a new Edge Function. Same two-step shape as `decrypt-invite-email`:
  authorize via `is_platform_admin()` called through the caller's own
  JWT, then act via the service-role client. Look up a user by email,
  list their passkeys, revoke individually.
- **Super admin login page** (`SuperAdminLogin.tsx`, `/super-admin`): a
  separate entry point from the regular business/city-admin `/login`, per
  the user's explicit request — same underlying auth (passkey primary,
  emailed code fallback), just its own branded page. Redirects to
  `/platform-admin` once signed in *and* confirmed to hold the
  `platform_admins` grant; if signed in without it, offers to sign out
  rather than silently doing nothing. The page's existence grants nothing
  by itself — same RLS-backed `platform_admins` check as everywhere else
  is still the real boundary, this is purely a distinct front door to it.
- City admins already had no self-registration path (they were only ever
  grantable via the existing "Grant city admin" form) — nothing changed
  there, just confirming the new `signup_requests` flow doesn't add one
  either (it has no role field at all; approval always yields a plain
  account with no admin grant attached).
- `npm run build` passes; `npm run lint` shows no new issues (the
  `AuthContext.tsx` `react-refresh/only-export-components` flag is the
  same pre-existing pattern as `DemoContext.tsx`).
- **Live-verified (2026-09-11)**, migration applied, `admin-manage-passkeys`
  deployed. This round found three real bugs in the deployed function via
  actual logs, not assumption — each confirmed fixed in turn:
  1. Missing `experimental: { passkey: true }` on the service-role client
     (only the browser client in `lib/supabase.ts` had it) — every
     passkey method throws `assertPasskeyExperimentalEnabled` without it.
  2. Ruled out (but pinned anyway for safety): an unpinned `npm:@supabase/
     supabase-js@2` specifier resolving to something older than the
     passkey API. Confirmed the user's dashboard already had Passkeys
     enabled with an RP ID configured, ruling out a project-config gap.
  3. **The actual root cause**: the admin object's real method names are
     `listPasskeys`/`deletePasskey`, not `list`/`delete` like the
     client-side self-service API (`supabase.auth.passkey.list/delete`)
     — confirmed by reading the function's own error logs
     (`adminClient.auth.admin.passkey.list is not a function`) after
     adding a top-level try/catch specifically so the real error would
     surface instead of Deno's generic detail-free 500. Fixed both call
     sites; re-verified live.
  - `signup_requests`: anon insert succeeds (after one transient
    schema-cache-lag failure immediately post-migration, which
    self-resolved on retry — not a real bug), anon cannot read the table,
    a second pending request for the same email is correctly rejected
    (`23505`), a platform admin can read pending requests and reject one
    (plain update, no email sent), a non-admin can neither read nor
    update any row.
  - `admin-manage-passkeys`: a non-admin caller gets `403 Forbidden`; a
    genuine platform admin listing another user's passkeys now gets
    `{"data":[]}` correctly.
  - The actual `requestSignupCode` (approve) call was confirmed to reach
    Supabase's real OTP-send logic — it returned `429
    over_email_send_rate_limit` on a repeat send, which is Supabase's own
    default email-sending rate limit, not an application bug. **Operational
    note for the user**: the default built-in email sender allows very few
    sends per hour; real signups will hit this quickly without a custom
    SMTP provider (Resend/SendGrid/Postmark/etc.) configured in
    Authentication → SMTP Settings.
  - All test data (2 auth users, 1 admin grant, all signup_requests test
    rows) deleted afterward.
  - **This completes the signup-approval/super-admin/passkey-revocation
    work.** Not independently re-verified in this pass: the super-admin
    login page itself (`/super-admin`) and actual browser-based passkey
    registration/login (both require a real browser — same standing
    limitation noted throughout this project).

## In Progress

- Nothing actively in progress. Ready for Phase 9.

## Next

- Phase 9 (hardening — tenant-isolation/authz regression tests, the
  previously-flagged rate-limiting/CAPTCHA gap on public marketplace
  insert paths) and Phase 10 (production prep).

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
