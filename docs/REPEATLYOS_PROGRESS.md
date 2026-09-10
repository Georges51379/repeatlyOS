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
