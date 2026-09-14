-- Extends migration 20260914000012's vertical custom-fields pattern from
-- the 2 demonstrated verticals (restaurant, hotel_guesthouse) to the
-- remaining business types seeded in supabase/seed.sql — closing the
-- "only shown for a couple of verticals as the pattern" gap.

update public.business_types
set custom_fields = '[
  {"key": "specialties", "label": "Specialties (comma separated, e.g. fades, beard trim)", "type": "text", "applies_to": "business"},
  {"key": "walk_ins_welcome", "label": "Walk-ins welcome?", "type": "boolean", "applies_to": "business"}
]'::jsonb
where key = 'barber';

update public.business_types
set custom_fields = '[
  {"key": "return_policy", "label": "Return / exchange policy", "type": "text", "applies_to": "business"},
  {"key": "size_chart_url", "label": "Size chart (image URL)", "type": "text", "applies_to": "product"}
]'::jsonb
where key = 'clothing_store';

update public.business_types
set custom_fields = '[
  {"key": "delivery_zones", "label": "Delivery zones (comma separated)", "type": "text", "applies_to": "business"},
  {"key": "barcode", "label": "Barcode / SKU", "type": "text", "applies_to": "product"}
]'::jsonb
where key = 'supermarket';

update public.business_types
set custom_fields = '[
  {"key": "membership_required", "label": "Membership required to book?", "type": "boolean", "applies_to": "business"},
  {"key": "class_type", "label": "Class type", "type": "select", "applies_to": "service", "options": ["Personal training", "Group class", "Open gym"]}
]'::jsonb
where key = 'gym';

update public.business_types
set custom_fields = '[
  {"key": "warranty_days", "label": "Standard warranty (days)", "type": "number", "applies_to": "product"},
  {"key": "repair_turnaround", "label": "Typical repair turnaround", "type": "text", "applies_to": "service"}
]'::jsonb
where key = 'computer_shop';

update public.business_types
set custom_fields = '[
  {"key": "subjects", "label": "Subjects taught (comma separated)", "type": "text", "applies_to": "business"},
  {"key": "online_available", "label": "Online sessions available?", "type": "boolean", "applies_to": "business"}
]'::jsonb
where key = 'tutor';

-- 'home_bakery' and 'other' deliberately left with an empty custom_fields
-- array: home_bakery's real needs (flavor/weight/allergens) are already
-- covered by the existing generic product_attributes facet system
-- (migration 20260910000020), and 'other' is, by definition, not a real
-- vertical to design fields for.
