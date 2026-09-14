-- New feature: vertical-specific fields per business type, so onboarding
-- and the product/service form feel tailored to what a barber, a
-- restaurant, or a hotel actually needs to capture — rather than every
-- business type sharing one generic form. Follows the same
-- "business_types is configuration data, not `if type === 'barber'` in app
-- code" principle `default_modules` already established (migration
-- 20260910000001) — field DEFINITIONS live on `business_types`, field
-- VALUES live as jsonb on the record they describe, so adding a new
-- vertical's fields later never requires a schema migration.
--
-- `custom_fields` shape (an array of field definitions), by convention:
--   { key: text, label: text, type: 'text'|'number'|'boolean'|'select'|'date_range',
--     applies_to: 'business'|'product'|'service', options?: text[] }
-- The frontend renders a field from this definition and stores the shopper/
-- merchant-entered value under the same `key` in the target row's
-- `custom_field_values` jsonb column.

alter table public.business_types
  add column custom_fields jsonb not null default '[]'::jsonb;

alter table public.businesses
  add column custom_field_values jsonb not null default '{}'::jsonb;

alter table public.products
  add column custom_field_values jsonb not null default '{}'::jsonb;

alter table public.services
  add column custom_field_values jsonb not null default '{}'::jsonb;

-- Two concrete verticals seeded as the demonstrated pattern (not an
-- exhaustive set for every business type — add more as real onboarding
-- feedback identifies what each vertical actually needs).
update public.business_types
set custom_fields = '[
  {"key": "spice_level", "label": "Spice level", "type": "select", "applies_to": "product", "options": ["Mild", "Medium", "Spicy"]},
  {"key": "modifiers", "label": "Extras / add-ons (comma separated)", "type": "text", "applies_to": "product"},
  {"key": "prep_time_minutes", "label": "Typical prep time (minutes)", "type": "number", "applies_to": "product"}
]'::jsonb
where key = 'restaurant';

update public.business_types
set custom_fields = '[
  {"key": "check_in_time", "label": "Check-in time", "type": "text", "applies_to": "business"},
  {"key": "check_out_time", "label": "Check-out time", "type": "text", "applies_to": "business"},
  {"key": "availability_range", "label": "Available date range", "type": "date_range", "applies_to": "service"}
]'::jsonb
where key = 'hotel_guesthouse';
