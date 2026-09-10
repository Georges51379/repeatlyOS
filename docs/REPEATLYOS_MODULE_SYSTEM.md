# RepeatlyOS Module System (Phase 1 foundation only)

## What exists today

- `business_types` (config table): each business type (barber, clothing
  store, supermarket, gym, restaurant, home bakery, computer shop,
  hotel/guesthouse, tutor, other — seeded in `supabase/seed.sql`) carries a
  `default_modules text[]` — the module keys a new business of that type
  should start with enabled (per master-prompt §10's per-industry module
  lists).
- `business_modules` (business_id, module_key, enabled): the actual per-business
  on/off state. Nothing reads or writes this table yet from the application —
  it exists so Phase 2 onboarding can populate it from `business_types.default_modules`
  at business-creation time, and so later dashboard work can query it.

## What does NOT exist yet (do not assume otherwise)

- No `canUseModule(business, moduleKey)` helper function exists in code yet
  — it will be a thin read of `business_modules` once dashboard pages start
  querying real data (Phase 3+), not implemented in Phase 1 because there is
  nothing yet to gate.
- No plan/entitlement layer. Per master-prompt §23, real module availability
  should eventually be `Platform availability AND Plan entitlement AND
  Business configuration` — Phase 1 only has the third term. Phases 8 adds a
  `Plan`/`PlanEntitlement`/`BusinessSaaSSubscription` layer that further
  restricts which `business_modules` rows a business is even allowed to
  enable.
- No sidebar/dashboard wiring reads this table yet — the 35 existing
  dashboard pages still render unconditionally from `DemoContext`, per the
  migration plan's Phase 3 ordering (foundations first, then cut real
  pages over one at a time).

## Design intent carried forward from the master prompt

Module gating must ultimately be enforced in two places, not one:
1. **UI** — hide the nav item / redirect away from a disabled module's routes.
2. **Data layer** — once real per-module tables exist (e.g., `bookings`),
   their own RLS policies should independently refuse writes for a business
   that doesn't have that module enabled, so a disabled module can't be
   worked around by calling the API directly. This second half doesn't exist
   yet because the per-module tables (`bookings`, `products`, etc.) don't
   exist yet — noted here so it isn't forgotten when they're built.
