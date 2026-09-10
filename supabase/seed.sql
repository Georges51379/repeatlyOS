-- RepeatlyOS — DEVELOPMENT SEED DATA ONLY.
--
-- This file is NOT a migration. It is meant to be run manually (once, in a
-- dev/staging Supabase project) via the SQL editor, or automatically by
-- `supabase db reset` when using the Supabase CLI locally. Master-prompt §38:
-- "Production deployment must not automatically insert it." Do not add this
-- file to any production deploy step.
--
-- Contents: business type templates (configuration, safe to also run in
-- production since these aren't "demo" data, just shared config — see note
-- below) and the first launch city, Batroun (master-prompt §51).

-- Business type templates are real configuration, not demo content — safe to
-- (re)run anywhere. `on conflict do nothing` makes this file idempotent.
insert into public.business_types (key, label, default_modules) values
  ('barber', 'Barber', array['bookings', 'customers', 'staff', 'payments', 'analytics']),
  ('clothing_store', 'Clothing Store', array['products', 'inventory', 'orders', 'customers', 'analytics']),
  ('supermarket', 'Supermarket', array['products', 'inventory', 'orders', 'delivery', 'customers', 'analytics']),
  ('gym', 'Gym', array['bookings', 'customers', 'staff']),
  ('restaurant', 'Restaurant', array['products', 'orders', 'bookings', 'delivery', 'customers']),
  ('home_bakery', 'Home Bakery', array['products', 'orders', 'bookings', 'customers']),
  ('computer_shop', 'Computer Shop', array['products', 'inventory', 'orders', 'customers', 'analytics']),
  ('hotel_guesthouse', 'Hotel / Guesthouse', array['bookings', 'customers', 'payments']),
  ('tutor', 'Tutor', array['bookings', 'customers', 'payments']),
  ('other', 'Other', array['products', 'orders', 'customers'])
on conflict (key) do nothing;

-- Batroun is the first launch city (master-prompt §51) — a config row, not a
-- hardcoded route. Left inactive/marketplace-disabled here on purpose: flip
-- `active`/`marketplace_enabled` to true once Phase 6 (city marketplace) is
-- ready to actually serve public traffic for it.
insert into public.cities (name, slug, display_name, country, region, active, marketplace_enabled, description)
values (
  'Batroun', 'batroun', 'Batroun', 'Lebanon', 'North Lebanon', false, false,
  'Buy Batroun — powered by RepeatlyOS.'
)
on conflict (slug) do nothing;
