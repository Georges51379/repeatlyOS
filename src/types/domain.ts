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
  created_at: string;
  updated_at: string;
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
