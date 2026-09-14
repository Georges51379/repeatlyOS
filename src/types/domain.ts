// Hand-written to mirror supabase/migrations/20260910000001_init_schema.sql.
// Once a live Supabase project exists, regenerate with:
//   supabase gen types typescript --project-id <ref> > src/types/database.ts
// and prefer that generated file for query typing; this file is fine for
// Phase 1 while no live project exists yet.

export type MembershipRole = 'owner' | 'manager' | 'staff';
export type MembershipStatus = 'invited' | 'active' | 'removed';
export type BusinessStatus =
  | 'draft'
  | 'pending_approval'
  | 'active'
  | 'suspended'
  | 'rejected'
  | 'archived';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  /** Added Phase 7 — lets a platform admin look up a user by email to
   * grant them city_admin, without needing a raw user_id. */
  email: string | null;
  created_at: string;
  updated_at: string;
}

export type SignupRequestStatus = 'pending' | 'approved' | 'rejected';

export interface SignupRequest {
  id: string;
  full_name: string;
  email: string;
  status: SignupRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface CityAdminRow {
  user_id: string;
  city_id: string;
  created_at: string;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  display_name: string | null;
  country: string;
  region: string | null;
  active: boolean;
  marketplace_enabled: boolean;
  logo_url: string | null;
  cover_image_url: string | null;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  custom_domain: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomFieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'date_range';
  applies_to: 'business' | 'product' | 'service';
  options?: string[];
}

export interface BusinessType {
  key: string;
  label: string;
  default_modules: string[];
  /** Vertical-specific field definitions (migration
   * 20260914000012_business_type_custom_fields.sql) — a restaurant vs. a
   * hotel needs different fields on its products/services/business record;
   * this is configuration data the form renders from, not a hardcoded
   * per-type form. */
  custom_fields: CustomFieldDefinition[];
  created_at: string;
}

export type BusinessAvailabilityStatus = 'normal' | 'closed_power_cut' | 'cash_only' | 'closed_temporary';

export interface DeliveryConfig {
  pickup: boolean;
  merchantDelivery: boolean;
  deliveryFee: number;
  deliveryAreas: string[];
}

export interface Business {
  id: string;
  city_id: string;
  business_type_key: string | null;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  category: string | null;
  status: BusinessStatus;
  marketplace_visible: boolean;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  opening_hours: Record<string, unknown>;
  social_links: Record<string, unknown>;
  delivery_config: DeliveryConfig;
  /** Manual override on top of `opening_hours` for things a recurring
   * weekly schedule can't express — a scheduled power cut, a cash-only
   * moment, an unplanned short closure (migration
   * 20260914000008_availability_override.sql). */
  availability_override: BusinessAvailabilityStatus;
  availability_note: string | null;
  availability_updated_at: string | null;
  /** Distinct from `status = 'active'` (listing approval) — an explicit,
   * admin-only signal that the business's real-world identity was actually
   * checked (migration 20260914000010_verified_badge.sql). */
  verified: boolean;
  verified_at: string | null;
  custom_field_values: Record<string, unknown>;
  /** Set automatically at insert time (default auth.uid()) — see
   * supabase/migrations/20260910000003_fix_business_insert_returning.sql for
   * why this exists: it's what makes a freshly-created business immediately
   * visible to its creator without depending on a same-transaction trigger
   * side effect in another table. */
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessMembership {
  id: string;
  business_id: string;
  user_id: string;
  role: MembershipRole;
  permissions: string[];
  status: MembershipStatus;
  /** Ciphertext at rest (encrypted transparently by a DB trigger — see
   * supabase/migrations/20260910000004_field_level_encryption.sql). Do not
   * render this directly; it is only human-readable after going through the
   * decrypt-invite-email Edge Function, which enforces that the caller is
   * actually allowed to see it. */
  invited_email: string | null;
  invited_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** A membership joined with its business — what the frontend actually needs
 * to render "which businesses am I a member of, and as what role". */
export interface BusinessMembershipWithBusiness extends BusinessMembership {
  business: Business;
}

export interface BusinessModule {
  business_id: string;
  module_key: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export type BoardColumn = 'todo' | 'in_progress' | 'completed' | 'issue';

/** migration 20260914000001_staff_members.sql */
export interface StaffMember {
  id: string;
  business_id: string;
  full_name: string;
  phone: string | null;
  role_title: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  business_id: string;
  customer_id: string | null;
  title: string;
  notes: string | null;
  assigned_to: string | null;
  /** Real staff FK, added alongside the legacy free-text `assigned_to`
   * (migration 20260914000001) — prefer this once a business has staff. */
  assigned_staff_id: string | null;
  board_column: BoardColumn;
  due_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
  active: boolean;
  booking_enabled: boolean;
  custom_field_values: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  business_id: string;
  customer_id: string | null;
  service_id: string | null;
  staff: string | null;
  /** Real staff FK, added alongside the legacy free-text `staff` column
   * (migration 20260914000001) — required for the overlap-prevention
   * exclusion constraint in migration 20260914000002 to apply. */
  staff_id: string | null;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  notes: string | null;
  /** Guest booking contact info (Phase 6 marketplace) — set when
   * customer_id is null. */
  customer_name: string | null;
  customer_phone: string | null;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = 'cash' | 'whish' | 'omt' | 'bank_transfer' | 'pay_at_store';
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'refunded';

export interface Payment {
  id: string;
  business_id: string;
  customer_id: string | null;
  booking_id: string | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string | null;
  notes: string | null;
  paid_at: string;
  created_at: string;
  updated_at: string;
}

export type MembershipPlanType = 'package' | 'subscription';
export type CustomerMembershipStatus = 'active' | 'expired' | 'cancelled' | 'paused';

export interface CustomerMembership {
  id: string;
  business_id: string;
  customer_id: string;
  plan_type: MembershipPlanType;
  plan_name: string;
  price: number | null;
  billing_interval: string | null;
  sessions_total: number | null;
  sessions_used: number;
  status: CustomerMembershipStatus;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  sale_price: number | null;
  sku: string | null;
  image_url: string | null;
  active: boolean;
  marketplace_visible: boolean;
  custom_field_values: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProductAttribute {
  id: string;
  product_id: string;
  key: string;
  value: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  business_id: string;
  product_id: string;
  quantity: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  business_id: string;
  inventory_item_id: string;
  change_amount: number;
  reason: string;
  created_by: string | null;
  created_at: string;
}

export type OrderStatus = 'new' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'refunded';

export interface Order {
  id: string;
  business_id: string;
  customer_id: string | null;
  status: OrderStatus;
  delivery_method: string;
  delivery_address: string | null;
  total_amount: number;
  notes: string | null;
  /** Guest checkout contact info (Phase 6 marketplace) — set when
   * customer_id is null, i.e. the order came from an unauthenticated
   * marketplace shopper rather than a merchant-side customer record. */
  customer_name: string | null;
  customer_phone: string | null;
  /** Links several per-business orders from one multi-shop cart checkout
   * into a shared delivery run (migration
   * 20260914000007_cross_shop_delivery_groups.sql). */
  delivery_group_id: string | null;
  /** Internal guard against double-compensating inventory if an order is
   * (incorrectly) moved between cancelled/refunded more than once —
   * migration 20260914000003_inventory_auto_decrement.sql. Not meant to be
   * set from the client. */
  inventory_restocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  created_at: string;
}

export type SaasSubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled';

export interface SaasPlan {
  key: string;
  name: string;
  price_monthly_usd: number;
  included_modules: string[];
  max_branches: number | null;
  is_default: boolean;
  sort_order: number;
  created_at: string;
}

export interface BusinessSaasSubscription {
  business_id: string;
  plan_key: string;
  status: SaasSubscriptionStatus;
  started_at: string;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor_user_id: string | null;
  business_id: string | null;
  city_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ── Cross-shop delivery groups (migration 20260914000007) ──────────────────
export type DeliveryGroupStatus = 'pending' | 'assigned' | 'delivered' | 'cancelled';

export interface DeliveryGroup {
  id: string;
  city_id: string;
  customer_name: string | null;
  customer_phone: string;
  delivery_address: string | null;
  status: DeliveryGroupStatus;
  created_at: string;
  updated_at: string;
}

// ── Shared delivery pool (migration 20260914000009) ─────────────────────────
export interface DeliveryPoolMember {
  id: string;
  city_id: string;
  business_id: string;
  coverage_note: string | null;
  active: boolean;
  joined_at: string;
}

// ── Dual-currency exchange rate (migration 20260914000011) ──────────────────
export interface ExchangeRate {
  id: string;
  base_currency: string;
  quote_currency: string;
  rate: number;
  updated_by: string | null;
  created_at: string;
}

// ── City-wide loyalty wallet (migration 20260914000006) ─────────────────────
export interface LoyaltyWallet {
  id: string;
  city_id: string;
  customer_phone: string;
  balance_points: number;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  wallet_id: string;
  business_id: string | null;
  order_id: string | null;
  points_delta: number;
  reason: string;
  created_at: string;
}

// ── Referrals (migration 20260914000014) ─────────────────────────────────────
export interface CustomerReferral {
  id: string;
  business_id: string;
  referrer_phone: string;
  referred_phone: string;
  order_id: string | null;
  created_at: string;
}

// ── Verified reviews (migration 20260914000013) ─────────────────────────────
export interface Review {
  id: string;
  business_id: string;
  order_id: string | null;
  booking_id: string | null;
  customer_name: string | null;
  customer_phone: string;
  rating: number;
  comment: string | null;
  photo_url: string | null;
  created_at: string;
}

// ── Advanced analytics RPC result shapes (migration 20260914000014) ────────
export interface RevenueHeatmapPoint {
  activity_date: string;
  revenue: number;
}

export interface RevenueForecast {
  floor_case: number;
  likely_case: number;
  best_case: number;
  based_on_days: number;
}

export interface ChurnRiskCustomer {
  customer_id: string;
  full_name: string;
  last_activity_at: string;
  days_since_last_activity: number;
  risk_level: 'low' | 'medium' | 'high';
}

export interface HealthScoreResult {
  score: number;
  revenue_trend_points: number;
  completion_rate_points: number;
  repeat_customer_points: number;
  review_rating_points: number;
}

export interface ReferralLeaderboardEntry {
  referrer_phone: string;
  referral_count: number;
}
