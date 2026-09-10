// Canonical module key vocabulary (master-prompt §23). A business's actual
// module set lives in the `business_modules` table (business-id + key +
// enabled) — this is just the fixed list of keys the toggle UI offers. Plan/
// entitlement gating (which keys a business is even ALLOWED to enable) is
// Phase 8 — not implemented yet, so today an owner can freely toggle any of
// these.
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
