# RepeatlyOS Roles & Permissions (Phase 1)

## Platform-level roles

| Role | How it's granted | Scope |
|---|---|---|
| `PLATFORM_SUPER_ADMIN` | Row in `platform_admins`, inserted manually via SQL editor only | Everything, every city, every business |
| `CITY_ADMIN` | Row in `city_admins` (user_id, city_id), inserted by a platform admin | Everything scoped to that one `city_id`; `is_city_admin()` returns true for platform admins too, so a platform admin automatically passes any city-admin check |

## Business-level roles (`business_memberships.role`)

| Role | Default capability |
|---|---|
| `owner` | Every `has_business_permission()` check passes automatically, regardless of the `permissions` array. Full control including inviting/removing other members (RLS policy `memberships_owner_manager_write`) and toggling modules (`modules_owner_write`). |
| `manager` | Passes `has_business_role(..., ['owner','manager'])` checks (e.g., can update the business row, manage memberships) but for fine-grained `permission` checks, only what's explicitly listed in their own `permissions` array. |
| `staff` | Only whatever specific permissions are listed on their `business_memberships.permissions` row. Cannot manage other memberships or business settings unless a future page explicitly grants a permission that covers it. |

There is no `CUSTOMER` role yet — see Security Model doc, "What is explicitly
NOT covered yet."

## Permission-string vocabulary (from master-prompt §7, stored as data)

These are not enforced by any table constraint (the column is a plain
`text[]`) — they're a convention to keep consistent as later phases add the
tables/pages that actually check for them:

`business.view`, `business.update`, `products.view`, `products.create`,
`products.update`, `products.delete`, `inventory.view`, `inventory.adjust`,
`orders.view`, `orders.manage`, `customers.view`, `customers.manage`,
`bookings.view`, `bookings.manage`, `services.manage`, `staff.view`,
`staff.manage`, `analytics.view`, `finance.view`, `finance.manage`,
`marketing.manage`, `settings.manage`, `modules.manage`, `audit.view`.

None of these are checked anywhere in application code yet (no
Product/Order/Booking tables exist to check them against). What Phase 1
delivers is the place they live (`business_memberships.permissions`) and the
function that checks them (`has_business_permission` in Postgres,
`hasBusinessPermission` in `src/lib/authz.ts` for UI gating) — not enforcement
in any specific feature.

## How to test this manually today (no UI for it yet)

Until a staff-invitation UI exists (Phase 3+), memberships can be created
directly in the Supabase SQL editor for manual testing, e.g.:

```sql
insert into public.business_memberships (business_id, user_id, role, permissions, status, accepted_at)
values ('<business uuid>', '<user uuid>', 'staff', array['bookings.view','bookings.manage'], 'active', now());
```
