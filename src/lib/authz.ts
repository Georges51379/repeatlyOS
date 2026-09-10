import type { BusinessMembershipWithBusiness, MembershipRole } from '../types/domain';

// IMPORTANT: these helpers exist purely to drive UI (which nav items to show,
// which buttons to render). They are NOT the security boundary — that is the
// Postgres Row Level Security policies in
// supabase/migrations/20260910000002_rls_policies.sql, which enforce the same
// rules server-side regardless of what the client does or sends. Per
// master-prompt §6/§26: never treat a client-side check like the ones below
// as sufficient authorization on its own.

export function getMembership(
  memberships: BusinessMembershipWithBusiness[],
  businessId: string,
): BusinessMembershipWithBusiness | undefined {
  return memberships.find((m) => m.business_id === businessId && m.status === 'active');
}

export function hasBusinessRole(
  memberships: BusinessMembershipWithBusiness[],
  businessId: string,
  allowedRoles: MembershipRole[],
): boolean {
  const membership = getMembership(memberships, businessId);
  return Boolean(membership && allowedRoles.includes(membership.role));
}

export function hasBusinessPermission(
  memberships: BusinessMembershipWithBusiness[],
  businessId: string,
  permission: string,
): boolean {
  const membership = getMembership(memberships, businessId);
  if (!membership) return false;
  return membership.role === 'owner' || membership.permissions.includes(permission);
}
