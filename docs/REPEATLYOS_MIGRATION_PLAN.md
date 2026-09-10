# RepeatlyOS Migration Plan

Companion to `docs/REPEATLYOS_ARCHITECTURE_AUDIT.md`. Read that first — the
short version is: **there is no existing backend**, so this "migration" is
really "build a real backend under the existing frontend demo, then cut the
frontend over to it one domain at a time."

## Backend Stack Decision (confirmed 2026-09-10)

**Supabase** (Postgres + Auth + Storage, tenant isolation enforced via Row
Level Security) was chosen over a hand-rolled Express/Fastify+Prisma API or a
Next.js migration. Rationale for how this shapes the plan:

- The existing Vite + React Router frontend stays fully intact — no framework
  migration required. Supabase is called directly from the client via
  `@supabase/supabase-js`.
- "Server-side enforcement" of tenant isolation (master-prompt §6, §26) is
  implemented as **Postgres Row Level Security policies**, not application
  code — this is genuinely server-side (enforced by the database itself,
  independent of any client), which satisfies the requirement without a
  custom API server. Every table that carries tenant data has RLS enabled by
  default; there is no "trust the frontend" path.
- Trade-off accepted knowingly: coupling to Supabase for auth/storage/DB
  hosting. If this ever needs to change, the RLS policies and schema
  translate directly to any Postgres host; only the auth/storage calls would
  need replacing.
- Anything genuinely requiring custom server logic beyond what RLS + Postgres
  functions/triggers can express (e.g., a future WhatsApp Business API
  webhook receiver, payment provider webhooks) will need a small serverless
  function (Supabase Edge Functions) — not needed yet for Phase 1.

**Important limitation to flag honestly:** no live Supabase project exists.
I cannot create one — that requires the user's Supabase account. Phase 1 code
below (SQL migrations, `@supabase/supabase-js` client, `AuthContext`, login/
signup pages) is written and passes local typecheck/build, but **none of it
has been run against a real database or verified end-to-end**, because there
is nothing to run it against yet. See "Required Before This Is Testable" below.

## Feature Classification (master-prompt §39 format)

| Existing feature | Classification | Notes |
|---|---|---|
| Dashboard shell (Sidebar, Topbar, DashboardLayout, CommandPalette, KeyboardShortcuts, Breadcrumb) | **KEEP** | Reusable UI chrome; wire navigation to the module/entitlement system (§11/§32) instead of a static route list |
| Bookings + Calendar (drag-to-reschedule) | **MIGRATE** | Great UX; back it with real `Booking`/`Service`/`Branch` tables, scoped by `businessId`; enforce no-overlap server-side |
| Customers (tags, custom fields, notes, CSV import) | **MIGRATE** | Becomes tenant-aware `Customer`/`CustomerTag`/`CustomField` with `businessId`; CSV import needs real server-side validation, not just client parsing |
| Products / Inventory | **MIGRATE** | Becomes `Product`/`ProductVariant`/`InventoryItem`/`InventoryMovement`; stock/low-stock threshold logic is reusable as-is |
| Packages / Subscriptions (customer-facing) | **MIGRATE, RENAME** | These are `CustomerMembership`/`CustomerSubscription` (master-prompt §40), *not* RepeatlyOS SaaS billing — must not share a model with the new `BusinessSaaSSubscription` that has to be built from scratch |
| Payments / Invoices | **MIGRATE** | Becomes `Payment`/`LedgerEntry`; keep Cash/Whish/OMT/manual-bank as MVP payment methods per §19; QR invoice generator UI is reusable |
| Tasks (Kanban) | **MIGRATE** | Scope `Task`/`TaskBoard`/`TaskColumn` by `businessId` + membership |
| Staff / Scheduler / Commissions | **REFACTOR + MIGRATE** | Staff must become real entities (`StaffMember` tied to a `BusinessMembership`), not name strings; Scheduler/Commissions logic can largely be kept once staff are real IDs |
| Reminders / Broadcast (WhatsApp `wa.me` links) | **KEEP interface, prepare provider abstraction** | Exactly as master-prompt §39 suggests — keep the deep-link UX now, add a `NotificationProvider` abstraction so a real WhatsApp Business API integration can slot in later without touching UI |
| Loyalty, Occasions, Referrals, Health Score, Heatmap, Goals, Forecast, Reports, Commissions, Expenses | **REFACTOR** | Move calculation from client-side array math to server/database aggregation (master-prompt §34) once real data exists; UI/visual design is reusable |
| Activity Log / `AuditEntry` | **REFACTOR** | Replace decorative seed data with a real `AuditLog` table written by real server actions (master-prompt §24) |
| Team & Roles (`AppUser`, `ROLE_PERMISSIONS`, `canAccess`) | **DEPRECATE the model, KEEP the UI pattern** | Global `role` string + unenforced client check must be replaced by `BusinessMembership` + server-side permission checks per master-prompt §4/§7; the *page* that lets an owner manage staff roles is a fine UI to keep |
| Multi-Branch, Enterprise (announcements, exports) | **REFACTOR** | Becomes real `Branch`/multi-branch entitlement-gated views; "export" must become genuine CSV generation from real data, not a placeholder |
| Settings | **REFACTOR** | Split into real business settings (persisted, tenant-scoped) vs. genuinely local-only prefs (theme) |
| `BusinessPublicPage`, `CustomerPortal` | **MIGRATE, GENERALIZE** | Currently hardcoded to one business; must become the real `/:city/business/:slug` storefront (§14) and a real authenticated customer portal |
| LandingPage, DemoSetup, PitchPage | **KEEP as marketing/sales tooling, out of product scope** | Not part of the production merchant/consumer product; fine to leave as-is or move under a `/marketing` or separate demo build later |
| "Backup" terminology anywhere in Settings/Enterprise | **VERIFY, DEPRECATE if fake** | Per master-prompt §25 — audit did not find a literal backup button yet; re-check when touching Settings/Enterprise pages, and replace with "Export Data" language if found |

## Phased Roadmap (mapping master-prompt Phases 0–10 onto this codebase's reality)

- **Phase 0 (this document + the audit) — done.**
- **Phase 1 — Foundations.** Stand up the chosen backend + database. Implement
  `City`, `Business`, `BusinessMembership`, authentication, and the shared
  authorization helpers (`requireAuthenticatedUser`, `requireBusinessMembership`,
  etc. from master-prompt §6) before touching any dashboard page. No frontend
  page gets real data yet — this phase is invisible in the UI on purpose.
- **Phase 2 — Merchant onboarding.** Registration flow, city + business-type
  selection, business templates as configuration (not `if type === 'barber'`),
  approval workflow.
- **Phase 3 — Migrate existing dashboard domains** one at a time onto the new
  API (Customers, Bookings, Tasks first — they're the most self-contained;
  Ledger/Analytics later since they depend on the others existing).
- **Phase 4 — Commerce** (Products/Inventory/Orders/Cart — single-merchant
  cart per master-prompt §18).
- **Phase 5 — Services** (Service/Availability/staff assignment, booking
  conflict prevention server-side).
- **Phase 6 — City marketplace** (public city homepage, storefronts, search —
  generalizing `BusinessPublicPage`).
- **Phase 7 — Administration** (Platform Super Admin, City Admin — genuinely
  new; nothing to reuse from the current repo).
- **Phase 8 — SaaS entitlements** (`BusinessSaaSSubscription`, plan/module
  gating — genuinely new, and must stay clearly separate from
  `CustomerMembership`/`CustomerSubscription`, see classification table above).
- **Phase 9 — Hardening** (tenant-isolation tests, authz tests — there is
  currently no test suite at all, so this phase also establishes the first
  ones).
- **Phase 10 — Production prep.**

Each phase should land as its own set of commits (this repo has no git history
yet — `git init` and an initial commit capturing the current demo state as-is
should happen before any Phase 1 code changes, so the pre-transformation state
is recoverable).

## Required Before Phase 1 Is Testable (action needed from you)

1. Create a Supabase project at supabase.com (free tier is fine for now).
2. In the Supabase SQL Editor, run the migration files in
   `supabase/migrations/` **in filename order** (they are plain SQL, no CLI
   required, though `supabase db push` works too if you use the CLI locally).
3. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` from Project Settings → API in the Supabase
   dashboard. `.env` is git-ignored — never commit it.
4. To grant yourself `PLATFORM_SUPER_ADMIN` for testing City/Business admin
   features later, insert your own auth user id into `platform_admins` via
   the SQL editor once you've signed up once through the app (see
   `docs/REPEATLYOS_SECURITY_MODEL.md` for the exact statement).
5. Restart `npm run dev` after setting `.env` so Vite picks up the new
   variables.

Until steps 1–3 are done, the app runs with a placeholder Supabase URL and
`AuthContext` will show a clear "Supabase is not configured" state rather than
crash — verified by build/typecheck, not by a live auth flow (see caveat
above).

## Immediate Next Steps

1. ~~Confirm the backend stack decision above~~ — done, Supabase confirmed.
2. ~~`git init` + initial commit of the pre-transformation baseline~~ — done.
3. Phase 1 foundations (schema, RLS, auth scaffolding) — implemented this
   session, see `docs/REPEATLYOS_PROGRESS.md`. Not yet wired into the 35
   existing dashboard pages — that is Phase 3.
4. Once you've completed the "Required Before Phase 1 Is Testable" steps
   above and confirmed login/signup actually works against your project, we
   proceed to Phase 2 (merchant onboarding flow: register a business, pick a
   city/business type, submit for approval).
