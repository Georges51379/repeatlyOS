// Canonical module key vocabulary (master-prompt §23). A business's actual
// module set lives in the `business_modules` table (business-id + key +
// enabled) — this is just the fixed list of keys the toggle UI offers. Which
// of these a business may actually *enable* is gated server-side by its
// plan (see `saas_plans.included_modules` /
// `20260910000019_saas_entitlements.sql`, Phase 8) — disabling a module is
// always allowed regardless of plan.
export const MODULE_KEYS = [
  'products',
  'inventory',
  'orders',
  'customers',
  'bookings',
  'services',
  'analytics',
  'staff',
  'tasks',
  'marketing',
  'audit_logs',
  'advanced_reports',
  'multi_branch',
  // Added 2026-09-10: these three were already used in
  // supabase/seed.sql's business_types.default_modules (payments,
  // delivery) or in the master-prompt §11 example toggle UI
  // (subscriptions), but missing here — meaning a business seeded with
  // e.g. barber's defaults had a "payments" module silently enabled with
  // no way to ever see or toggle it in Settings. Fixed by adding them.
  'payments',
  'delivery',
  'subscriptions',
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];
