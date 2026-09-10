# RepeatlyOS Architecture Audit (Phase 0)

Date: 2026-09-10
Scope: Full repository inspection prior to any transformation work toward the
"Multi-Tenant Local Commerce OS" target described in the master prompt.

## 0. Headline Finding

**RepeatlyOS, as it exists in this repository, is a 100% client-side, single-user,
in-memory sales/pitch demo. There is no backend, no database, no ORM, no API, no
authentication, and no persistence of any kind.** The README says this explicitly:
"Zero configuration. Zero backend. Zero database. Everything runs 100% in the
browser." A Settings page even shows the toast "Settings saved. Demo only — no
backend connected."

This is a materially different starting point than the master prompt assumes. The
prompt is written as if RepeatlyOS already has a backend, database, auth, and
tenant model that need to be *audited and migrated*. In reality there is nothing
to migrate on the backend side — **the entire server tier, database, and
authentication system described in the target architecture (sections 4–9, 19–27,
41 of the master prompt) must be built from scratch.** The frontend is a large,
polished, single-tenant UI shell that can be reused as a design/UX reference and,
piece by piece, rewired onto real data — but its current data layer (React
Context + hardcoded arrays) cannot be "refactored" into multi-tenancy; it has to
be replaced by real API calls against a real database.

This does not make the master prompt's target wrong. It changes the nature of the
work from "migrate an existing SaaS" to "build a new backend under an existing,
reusable frontend demo." See `docs/REPEATLYOS_MIGRATION_PLAN.md` for how this
reframing plays out phase by phase.

## 1. Current Stack

| Layer | Technology | Notes |
|---|---|---|
| Repo/VCS | **None** | `git status` fails — this directory is not a git repository at all. No `.git`. |
| Framework | Vite 8 + React 19 + TypeScript ~6.0 (strict) | Pure SPA, client-rendered only |
| Routing | `react-router-dom` v7, `BrowserRouter` | All routes defined in one file, `src/App.tsx` |
| Styling | Tailwind CSS 3 + hand-written utility classes | Dark theme by default, `light-mode` class toggle |
| State management | React Context (`DemoContext.tsx`) + local component `useState` | No Redux/Zustand/Query; no server cache because there is no server |
| Charts | Recharts | Used in Overview/Reports/Forecast/Heatmap etc. |
| Icons | lucide-react | |
| Backend | **None** | No `server/`, no API routes, no Express/Next/Nest, nothing |
| Database | **None** | No Prisma/Drizzle/SQL files/migrations anywhere |
| ORM | **None** | |
| Auth | **None (real)** | "Role" is just a `useState<AppUser>` the user can swap by clicking a different seed user in `/dashboard/team` — there is no login, no session, no password, no token |
| API layer | **None** | No `fetch`/`axios` calls anywhere in `src/` |
| Validation | **None** | No zod/yup; forms mutate local state directly, no schema validation |
| Testing | **None** | No test framework installed, no `*.test.*`/`*.spec.*` files |
| Linting | ESLint 10 + typescript-eslint 8, `eslint.config.js` (flat config) | Present and appears usable |
| TypeScript strictness | `tsconfig.app.json` — need to confirm `strict: true` (see below) | |
| CI/CD | **None found** | No `.github/workflows` or similar |
| Env config | **None** | No `.env`, `.env.example` — nothing needs one yet |
| PWA | `public/manifest.json`, `public/sw.js` | Real service worker for offline caching of the demo shell |

## 2. Repository Layout

```
repeatlyos/
├── index.html, vite.config.ts, tailwind.config.js, postcss.config.js
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── eslint.config.js, package.json, package-lock.json
├── public/
│   ├── manifest.json          (PWA install metadata)
│   ├── sw.js                  (offline service worker)
│   └── favicon.svg, icons.svg
├── src/
│   ├── main.tsx, App.tsx      (single-file, 40-route router)
│   ├── App.css, index.css
│   ├── context/
│   │   └── DemoContext.tsx    (all "global state": users, tags, shifts, audit log, theme, currency...)
│   ├── data/
│   │   ├── businesses.ts      (5 hardcoded business templates — the entire "database")
│   │   ├── mockData.ts, extraData.ts, inventoryData.ts
│   ├── components/            (~25 shared presentational components)
│   └── pages/
│       ├── LandingPage.tsx, BusinessPublicPage.tsx
│       ├── demo/ (DemoSetup.tsx, PitchPage.tsx)
│       ├── customer/ (CustomerPortal.tsx)
│       └── dashboard/ (35 pages: Overview, Bookings, Customers, Products, Inventory,
│           Packages, Subscriptions, Payments, Invoices, Tasks, Staff, Reminders,
│           Loyalty, Reports, ActivityLog, MultiBranch, Settings, Broadcast, Forecast,
│           Commissions, Expenses, Occasions, Waitlist, Reorder, HealthScore, Heatmap,
│           Goals, Referrals, TeamRoles, RecurringBookings, Scheduler, NoShows,
│           PartialPayments, Enterprise, Calendar)
```

~12,700 source lines across `src/`. No monorepo, no workspaces — single package.

## 3. Routes (from `src/App.tsx`)

- `/` — LandingPage (marketing/demo entry)
- `/business/elite-carwash` — BusinessPublicPage (**hardcoded single-business public page**, not driven by a slug param)
- `/demo/setup`, `/demo/pitch` — sales-demo tooling, not product
- `/customer/portal` — a single hardcoded customer self-service view
- `/dashboard` and 34 nested routes — the merchant-facing dashboard, gated by nothing (no auth guard at all; anyone can open `/dashboard/settings` etc. directly)
- `*` → redirect to `/`

There is **no city route, no per-business slug route, no marketplace route, no
admin route, no platform-admin route**. Everything is single-tenant: one
`businessKey` selected via `BusinessSwitcher`/`DemoContext`, applied globally.

## 4. Data Model (informal — exists only as TypeScript interfaces + in-memory arrays)

`src/data/businesses.ts` defines `BusinessTemplate`, currently instantiated for 5
industries (`elite-auto-spa`, `freshhome-cleaning`, `north-fitness`,
`quick-laundry`, `fixpro-maintenance`), each carrying its own embedded:
`services`, `packages`, `subscription`, `products`, `customers`, `bookings`,
`staff` (plain string names, not real entities), `tasks`, `payments`,
`revenueData`.

`DemoContext.tsx` adds a second layer of seed state that is *not* scoped per
business template and does not reset when you switch templates: `AppUser` /
`UserRole` (owner/manager/staff/viewer with a static permission-string map),
`CustomerTag`, `CustomField`, `RecurringRule`, `NoShowRecord`, `PartialPayment`,
`ShiftEntry`, `ClockEntry`, `AuditEntry`, `Announcement`, plus app-wide settings
(`exchangeRate`, `vatRate`, `currency`, `theme`, `sidebarCollapsed`).

None of this has: an `id` scheme suitable for a real database (many use small
sequential numbers reused across unrelated arrays), a `businessId`/`cityId`
concept, `createdAt`/`updatedAt`, foreign keys, or persistence — a page refresh
resets everything to the seed constants.

## 5. Feature Inventory — What Exists as UI Today

Every item below is a fully built **UI** (layout, interactions, local-state
mutations) with **zero backend**. This is the realistic "KEEP the UI, REPLACE the
data layer" list:

- Bookings + drag-to-reschedule Calendar (day/week/month)
- Customers (tags, custom fields, notes, churn score, CSV import — client-side only)
- Products + Inventory (stock, low-stock threshold, no real inventory ledger)
- Packages (session-count balances) and Subscriptions (renewal tracking) — **these are customer-facing/merchant-sold plans, not RepeatlyOS SaaS billing** (see §7)
- Payments + Invoices (Cash/Whish/OMT/Bank; a QR code generator; "proof" boolean; no real ledger)
- Tasks (Kanban board)
- Staff (plain name strings in `business.staff: string[]`, not user accounts) + a separate Scheduler (shifts/clock-in) that references staff **by name string**, not by ID
- Reminders + Broadcast (WhatsApp `wa.me` deep links — genuinely useful UX pattern, no API integration)
- Loyalty, Occasions, Referrals, Health Score, Heatmap, Goals, Forecast, Reports, Commissions, Expenses (all client-computed from the mock arrays)
- Activity Log (`AuditEntry[]` — UI only, not wired to any real action)
- Multi-Branch, Enterprise (announcements, "export" buttons that likely don't produce real files — needs verification per-component before reuse)
- Team & Roles page — lets you *switch which seed user you are*, demonstrating role-based visibility, but does not implement real authorization (a "staff" role can still open a Settings/Team URL directly since there's no route guard)
- Settings — VAT/currency/exchange rate, appearance, "Demo Controls"

## 6. What Is Production-Usable As-Is

- **Nothing in the data layer.** All of it needs a database.
- **Most of the UI is genuinely reusable** as a design system and interaction
  reference: the sidebar/topbar/dashboard shell, the calendar drag-reschedule
  UX, the WhatsApp deep-link pattern, the Kanban board, empty states, toasts,
  modals, command palette, keyboard shortcuts — these are well-built React/Tailwind
  components with no backend dependency baked in beyond reading `useDemo()`.
  They can be re-pointed at real API data with moderate, page-by-page rework.
- Build tooling (Vite, Tailwind, ESLint, TypeScript strict mode) is a fine
  foundation for the merchant dashboard and can remain the frontend for it, or
  become one workspace in a monorepo alongside a new backend.

## 7. Critical Domain Confusion To Resolve Before Coding (master prompt §40)

The existing `Packages`/`Subscriptions` pages represent **a merchant selling
recurring plans to their own customers** (e.g. "4 Washes/Month", "Monthly
Premium Care $99"). This is the *"Customer Membership/Subscription"* domain, not
the *"RepeatlyOS SaaS plan a business pays to RepeatlyOS"* domain described in
master-prompt §2/§23. **Nothing in the current repo represents the RepeatlyOS
billing/plan side at all** — it doesn't exist yet in any form, mock or real. Both
must be modeled as clearly separate entities once a database exists
(`CustomerMembership`/`CustomerSubscription` vs. `BusinessSaaSSubscription`).

## 8. Security Assessment

Because there is no backend, there is currently no server-side attack surface to
assess (no SQL injection, no auth bypass, no API IDOR risk — there is no API).
The security risks that **do** exist today, and the risks that **will exist the
moment a backend is added**, are different lists:

**Today (frontend-only):**
- No authentication at all — `/dashboard/*` is fully open to anyone with the URL.
- "Role switching" is cosmetic; a `staff`-role page can still be reached by typing the URL, since `canAccess()` in `DemoContext.tsx` is never actually enforced by a route guard (`ROLE_PERMISSIONS`/`canAccess` are defined but not called from `App.tsx`'s routing).
- No secrets exist in the repo (none needed yet) — verified no `.env`, no hardcoded API keys found in the files inspected.

**The moment real backend work starts (must be designed in from day one per master-prompt §26):**
- Every new API route needs server-side tenant-isolation checks (`businessId` ownership, not just UI hiding) — there is no existing pattern to copy since no API exists; this must be built as a shared authorization layer from the start (§6 of the master prompt).
- No existing auth to "keep" — a real session/auth system (e.g., email+password or a hosted auth provider) must be chosen and introduced; this is a foundational decision (see Migration Plan, "Open Decision").

## 9. Database Status

None. Zero tables, zero migrations, zero schema. Building the schema in
`docs/REPEATLYOS_DATABASE_MODEL.md` and the actual migrations is greenfield work,
informed by (but not constrained by) the shapes already implied by
`BusinessTemplate` and `DemoContext` seed types — those TypeScript interfaces are
a genuinely useful starting point for column/field naming since they reflect
real domain thinking already done for this product.

## 10. Authentication Status

None (see §5, §8). No login page, no session, no password hashing, no tokens.

## 11. Technical Debt (frontend, as it stands)

- Cross-cutting IDs are small sequential numbers reused independently per
  array (`customers[].id`, `bookings[].id`, `payments[].id` all restart at 1
  per business template) — fine for a demo, unsafe to carry into a real schema.
- Staff are referenced by **name string** (`staff: string[]`, `booking.staff:
  'Tony'`) instead of an entity ID — this will need to become a real
  `StaffMember`/membership relation.
- `ROLE_PERMISSIONS`/`canAccess` exist but are dead code from an enforcement
  perspective (never called to gate a route) — either wire them up properly
  post-migration or remove to avoid false confidence.
- Single global `businessKey` in context means the entire app is single-tenant
  by construction; introducing multi-tenancy is a structural change to how
  `useDemo()` is consumed on every dashboard page (35 files), not a small patch.
- `BusinessPublicPage` and the customer portal are hardcoded to one business
  (`elite-carwash`) rather than parameterized by slug — this must become a
  real dynamic route (`/:citySlug/:businessSlug`) per master-prompt §14.
- No tests exist, so there is no safety net for the refactor; Phase 1
  onward should add tests alongside new backend code rather than relying on
  manual verification alone (master-prompt §37).

## 12. What Is Missing (relative to target architecture)

Essentially all of sections 4–30 of the master prompt: City model, Business/Tenant
persistence, BusinessMembership + RBAC enforcement, module/entitlement system,
real Product/Order/Booking/Customer persistence, city marketplace routes and
storefronts, search, cart/checkout, city admin, platform super admin, audit
logging that's actually wired to real actions, and the SaaS subscription/plan
system for merchants paying RepeatlyOS.

## 13. Recommended Migration Strategy (summary — full detail in Migration Plan doc)

1. Keep this repo's frontend as the merchant-dashboard UI reference; do not
   throw it away. Introduce a real backend + database alongside it (either in
   this same repo as a new workspace, or a sibling service — see open decision
   below) and begin swapping `DemoContext`'s in-memory state for real API-backed
   data one domain at a time, starting with City → Business → Membership/Auth
   (Phase 1 of the master prompt), exactly as the phase plan prescribes.
2. Treat every existing dashboard page as a **UI reference to be rewired**, not
   as code that already satisfies any Phase 1–10 requirement.
3. Do not attempt to retrofit multi-tenancy onto the current `DemoContext`
   in place — plan a parallel, real `AuthContext`/API-data layer and cut pages
   over to it one at a time, so the demo keeps working (or is clearly marked
   dev/demo-seed-only) throughout the transition, per master-prompt §33.

## 14. Baseline Tooling Check

Lint, typecheck, and build were run before any changes; see the "Baseline"
section of `docs/REPEATLYOS_PROGRESS.md` for the recorded output. No test suite
exists to run.

## 15. Open Decision Required Before Phase 1 Foundations

This is the one point where the audit stops short of "just proceed": **there is
no backend at all, so the choice of backend framework, database, ORM, and
authentication approach is not discoverable from this repository — it must be
decided, because every later phase (multi-tenancy, RBAC, City model, migrations,
deployment) is built on top of it and is expensive to reverse once code exists.**
See `docs/REPEATLYOS_MIGRATION_PLAN.md` §"Decision Needed" for the specific
options and a recommendation.
