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

## In Progress

- Awaiting decision on backend stack (see Migration Plan → "Decision Needed
  Before Phase 1") before writing any Phase 1 foundation code (City, Business,
  BusinessMembership, auth, authorization helpers).

## Next

- Phase 1 — Foundations, once the backend stack decision is confirmed:
  City, Business, BusinessMembership schema + migrations; authentication;
  shared authorization helpers (`requireAuthenticatedUser`,
  `requireBusinessMembership`, etc.).

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
