# RepeatlyOS Migration Plan

Companion to `docs/REPEATLYOS_ARCHITECTURE_AUDIT.md`. Read that first — the
short version is: **there is no existing backend**, so this "migration" is
really "build a real backend under the existing frontend demo, then cut the
frontend over to it one domain at a time."

## Decision Needed Before Phase 1 (blocking)

The master prompt says: *"Only stop for user input if an irreversible business
decision genuinely blocks implementation."* Choosing the backend stack is that
decision — nothing in the repo implies an answer, and reversing it later means
rewriting migrations, API code, deployment config, and auth integration.

Question to resolve: **what backend/database/auth stack should RepeatlyOS run
on?**

Reasonable options, roughly ordered by how much they keep the current Vite
frontend as-is:

1. **Node/Express (or Fastify) API + PostgreSQL + Prisma, deployed separately
   from the Vite frontend.** Clean separation of concerns, closest to what the
   master prompt's language ("route/controller → validation → authorization →
   service → database") assumes. Requires standing up a second deployable
   service and CORS/auth-token wiring between it and the Vite app.
2. **Migrate the frontend to Next.js (App Router) and add API routes /
   server actions in the same project, PostgreSQL + Prisma or Drizzle.** One
   deployable, SSR available for the public marketplace/SEO requirement
   (master-prompt §35), but means moving 60+ existing files off plain
   Vite+React Router onto Next's routing and rendering model — a real (if
   mechanical) migration cost paid up front.
3. **Supabase (Postgres + Auth + Storage + row-level security) as the
   backend, Vite frontend calls it directly via the Supabase client.**
   Fastest path to a working multi-tenant backend with less custom code
   (RLS policies can enforce tenant isolation at the database layer, which
   maps well to master-prompt §26's "server-side enforcement" requirement),
   at the cost of coupling to a specific vendor.

**Recommendation:** Option 1 (Express/Fastify + PostgreSQL + Prisma, kept as a
separate service from the existing Vite app) is the safest default: it keeps
the current frontend fully intact and reusable exactly as the master prompt
requires ("do not rewrite... do not redesign working RepeatlyOS UI without
reason"), matches the layered API design the master prompt describes almost
line-for-line, and avoids new vendor lock-in before the business model is
proven. Option 3 is worth a second look if speed-to-first-working-marketplace
matters more than avoiding vendor lock-in. Option 2 mainly pays off once SEO
for the public city marketplace becomes a priority (it can be adopted later —
choosing Option 1 now does not foreclose it, since the marketplace frontend
could become a separate Next.js app consuming the same API).

**This plan assumes Option 1 will be confirmed or replaced before any Phase 1
code is written.** Nothing below depends on which option is picked except the
specific tooling names.

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

## Immediate Next Steps

1. Confirm the backend stack decision above (or provide a different preference).
2. `git init` + initial commit of the repository exactly as inspected, before
   any Phase 1 changes, so this baseline is never lost.
3. Begin Phase 1: schema for `City`/`Business`/`BusinessMembership`, auth, and
   authorization helpers.
