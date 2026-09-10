# RepeatlyOS Database Model

Source of truth: `supabase/migrations/*.sql`. This doc explains the *why*
behind the schema; if it ever disagrees with the migrations, the migrations
are correct — update this doc.

Status: **Phase 1 only.** Product/Order/Booking/Customer/etc. tables from the
target architecture (master-prompt §5) do not exist yet — they're built
per-domain in Phases 3–5 as the corresponding dashboard pages are migrated
off `DemoContext`. This document covers only what exists today.

## Entity-relationship summary

```
auth.users (Supabase-managed)
  └── profiles (1:1)
  └── platform_admins (0:1, membership table not a role column)
  └── city_admins (0:N, per city)

cities
  └── businesses (1:N, business.city_id)
        └── business_memberships (1:N — this is how a user relates to a
            business; NOT a role string on the user)
        └── business_modules (1:N — per-business module on/off state)

business_types (config table, not an enum baked into app code)
  └── referenced by businesses.business_type_key

audit_logs — references actor_user_id / business_id / city_id, all nullable
  so platform-level events (no business) and city-level events (no specific
  business) can still be recorded.
```

## Why memberships, not a `role` column on the user

The old `DemoContext.tsx` had a single global `role: UserRole` per session.
The master prompt is explicit (§4): *"Do NOT simply attach a 'role' string
directly to users and assume one user can only belong to one business."* A
real person can own Business A, manage Business B, and work as staff in
Business C simultaneously — `business_memberships` models that directly: one
row per (user, business) pair, each with its own `role` and `permissions`.

`permissions text[]` on the membership row is deliberately loose (an array of
permission-key strings like `products.create`, matching the vocabulary in
master-prompt §7) rather than a fixed set of booleans, so new permissions can
be added later without a schema migration — only a data change.

## Why `business_types` and `business_modules` are tables, not code

Master-prompt §10/§11 are explicit that business templates and module
availability must be **configuration**, not `if business.type === 'barber'`
scattered through the UI. `business_types.default_modules` is what gets
copied into a new business's `business_modules` rows at creation time (that
copy step is implemented in the application layer during onboarding, Phase 2
— not yet built).

## Deliberate omissions in Phase 1 (do not build around their absence being permanent)

- No `Plan`/`PlanEntitlement`/`BusinessSaaSSubscription` tables yet (Phase 8).
  `business_modules.enabled` is not yet gated by any plan — anything in it is
  "on" purely because someone with `owner` role turned it on. Plan gating
  layers on top of this same table later; it does not need a schema change to
  add, just an additional check before allowing `enabled = true`.
- No `Product`/`Order`/`Booking`/`Customer`/etc. tables (Phases 3–5).
- No storage buckets configured yet for logos/cover images/product photos
  (master-prompt §30) — `businesses.logo_url` etc. are plain text columns
  today, expected to hold a Supabase Storage public URL once upload flows
  exist.

## Conventions used throughout

- Every table has `created_at`; every mutable table has `updated_at`
  maintained by the shared `set_updated_at()` trigger (master-prompt §27).
- Primary keys are `uuid default gen_random_uuid()` — no sequential integers,
  since these ids will eventually be exposed in public marketplace URLs and
  API responses, and small sequential IDs make enumeration/scraping trivial.
- Foreign keys exist everywhere a relationship exists; `businesses.city_id`,
  `business_memberships.business_id`/`user_id`, etc. are all `references`
  with the implicit index Postgres creates on the referencing column
  supplemented by explicit indexes on the columns actually queried
  (`businesses_city_id_idx`, `businesses_status_idx`, `memberships_user_id_idx`,
  `memberships_business_id_idx`) per master-prompt §27.
- No destructive `on delete cascade` on `businesses` rows themselves (nothing
  deletes a business); membership/module rows do cascade when their parent
  business is deleted, since those are pure join/config rows with no
  independent historical value. Financial/order-history tables added in
  later phases must NOT cascade-delete (master-prompt §27/§28) — noted here
  so that constraint isn't forgotten when those tables are added.
