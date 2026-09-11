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

export interface BusinessType {
  key: string;
  label: string;
  default_modules: string[];
  created_at: string;
}

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

export interface Task {
  id: string;
  business_id: string;
  customer_id: string | null;
  title: string;
  notes: string | null;
  assigned_to: string | null;
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
