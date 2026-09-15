# ⚡ RepeatlyOS

> RepeatlyOS is a city marketplace where shoppers find real local businesses —
> and the operating system those businesses run on: orders, bookings,
> payments, and customers, all in one place. Launched in Batroun and Shekka,
> Lebanon.

This repo holds two things at different stages of maturity, and it's worth
knowing which is which before you dig in:

- **The real product** — a Supabase-backed multi-tenant marketplace + business
  back-office (everything under `/`, `/:citySlug`, `/app`, `/onboarding`,
  `/platform-admin`). This is what's described below.
- **A legacy sales-pitch demo** — a fully mocked, single-tenant dashboard at
  `/dashboard/*`, kept around from before the Supabase build-out. It runs
  entirely on fake in-memory data (`src/context/DemoContext.tsx`) and has no
  connection to the real backend. Useful for showing off UI polish quickly
  with zero setup, not representative of what a real business actually sees.

---

## What it does

**For shoppers:** browse a city's page (`/batroun`, `/shekka`), search across
every business in it — including a rule-based natural-language search
(`/discover`, try "nike basketball shoes in shekka") that falls back to
neighboring cities in the same region if nothing matches, or a real GPS-radius
"near me" search — add items from multiple businesses to one cart, and check
out as a guest (no account needed). Verified photo reviews, a verified-business
badge, live power-cut-aware "closed right now" status, and a city-wide loyalty
wallet (earn at any participating business, redeem at any other) round out the
shopping side.

**For business owners:** sign up, get approved, and run the shop from
`/app/:businessId/*` — products, inventory (a real append-only movement
ledger, not just a number you edit), orders, bookings with staff assignment
and overlap-safe scheduling, customers, tasks, payments, and analytics
(revenue heatmap, 30-day forecast, churn-risk flags, a health score, referral
leaderboard) — all computed from real data via Postgres functions, not
estimated client-side.

**For the platform:** a super-admin dashboard to approve businesses, open new
cities, assign SaaS plans, manage the USD/LBP exchange rate shown throughout
the marketplace, and revoke passkeys.

---

## Quick start

```bash
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
npm run dev            # → http://localhost:5173
```

Real backend, real schema — this is not a zero-config demo. You need an
actual Supabase project. See **Backend setup** below.

```bash
npm run build      # tsc -b && vite build
npm run lint
npm run test        # vitest — unit tests for the parsing/math-heavy logic
```

---

## Backend setup (Supabase)

1. Create a Supabase project, copy its URL + anon key into `.env`
   (`.env.example` has the exact variable names).
2. Apply the schema: `supabase link --project-ref <your-ref>` then
   `supabase db push` — applies every file in `supabase/migrations/` in
   order. There are currently 40 migrations building up the full schema
   incrementally; read a few if you want the "why", not just the "what" —
   this codebase documents its own reasoning unusually heavily.
3. Run `supabase/seed.sql` once (via the SQL editor, or
   `supabase db reset` locally) for the business-type templates and the
   first launch city.
4. Deploy the Edge Functions in `supabase/functions/` (`admin-generate-invite`,
   `admin-manage-passkeys`, `decrypt-invite-email`,
   `decrypt-customer-address`) — `supabase functions deploy <name>` each, or
   via the Dashboard.
5. In the Supabase Dashboard, enable **Authentication → Passkeys** (this app
   is passkey-only — no password login exists) and set the Relying Party ID
   to your domain.
6. Promote your own account to platform admin directly in the SQL editor —
   by design, this can never be done through the app itself:
   ```sql
   insert into public.platform_admins (user_id) values ('<your auth.users.id>');
   ```

### Database tests

```bash
supabase test db   # pgTAP — requires Docker Desktop
```

Covers core SQL logic (booking-overlap constraint, inventory auto-decrement,
loyalty balance) and an automated tenant-isolation check. See
`supabase/tests/README.md`.

---

## How someone actually becomes a user

There's no self-serve email/password signup — every account starts as a
**one-time activation code a platform admin generates and relays out of band**
(WhatsApp, phone, in person). Nothing is ever emailed automatically. Once
activated, the very first thing a new session does is register a passkey —
there's no other way back in afterward.

1. A prospective business owner submits name + email at `/signup` (just an
   unauthenticated `signup_requests` row — no account exists yet).
2. A platform admin approves it from `/platform-admin`, which generates a
   one-time code/link and hands it back to the admin to relay themselves.
3. The person enters it at `/activate`, sets up a passkey at
   `/account/security`, and lands on `/onboarding`.
4. They pick a city, a business type (this drives which dashboard modules —
   Products, Bookings, Staff, etc. — are turned on by default, and which
   extra fields the form shows), and submit. The business is created with
   `status = 'pending_approval'` and they're made its owner immediately.
5. **They can use their dashboard right away** — add products, take orders,
   manage customers — even before a platform/city admin approves it.
   `pending_approval` only hides the business from the *public* marketplace;
   it does not block the owner's own use of their dashboard. Approval is
   what makes the business (and its products/services) visible to shoppers
   browsing the city.

City admins are granted the same way (an admin-generated invite), never by
self-registering.

---

## Tech stack

React 19 · TypeScript (strict) · Vite · Tailwind CSS · React Router 7 ·
Supabase (Postgres + Auth + Edge Functions + Storage) · Recharts · Vitest

No custom API server — Postgres Row Level Security is the actual
authorization boundary; every table has RLS enabled with policies backed by
`security definer` helper functions (`is_business_member`,
`has_business_permission`, `is_city_admin`, `is_platform_admin`).

---

## Where things live

```text
repeatlyos/
├── supabase/
│   ├── migrations/     # 40 files, applied in order — the real schema
│   ├── functions/      # 4 Edge Functions (service-role-gated operations)
│   └── tests/database/ # pgTAP tests
├── src/
│   ├── App.tsx                    # all routes — marketplace, /app, /dashboard, admin
│   ├── lib/                       # smartSearch, geo, currency, i18n, checkout, offlineQueue
│   ├── pages/
│   │   ├── marketplace/           # public shopper-facing pages
│   │   ├── business/              # real merchant dashboard (Supabase-backed)
│   │   ├── admin/                 # platform + city admin
│   │   ├── onboarding/            # business registration wizard
│   │   ├── auth/                  # signup, activation, passkeys
│   │   └── dashboard/             # legacy mock demo — see note at the top
│   └── types/domain.ts            # hand-written mirror of the SQL schema
└── docs/                          # architecture, security model, progress log —
                                    # read these for the "why" behind non-obvious decisions
```

---

## Known limitations

- No real courier/delivery-partner API — `delivery_pool_members` and
  `delivery_groups` model shared delivery coordination internally, but
  dispatching an actual rider needs a specific local courier chosen (a
  business decision, not a code one).
- No automated test coverage for most RLS policies yet — two pgTAP files
  exist as a starting template (see `supabase/tests/`), not exhaustive
  coverage of all 33 tables.
- The EN/AR/FR i18n pass covers the public marketplace pages only; the
  merchant dashboard is English-only for now.
- Only two cities are seeded (Batroun, Shekka) — adding more is a data/ops
  task (`cities` is a normal table, not a hardcoded list), not a code change.

See `docs/REPEATLYOS_PROGRESS.md` for the full, dated history of what was
built, tested, and found along the way.
