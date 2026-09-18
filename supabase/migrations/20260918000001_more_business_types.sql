-- Expand the business type catalog well beyond the original 10 launch
-- templates (barber, clothing_store, supermarket, gym, restaurant,
-- home_bakery, computer_shop, hotel_guesthouse, tutor, other).
--
-- User request (2026-09-18): "for businesses types, I want to have any
-- business type not only few ones!" with a list of examples (gym, home
-- business, home cooking, home crafting, mobile shop, computer shop,
-- gaming lounge, hairdresser, barber shop, makeup, dentist, supermarket,
-- pharmacy, alcohol bar, restaurants, toy store, library and more).
--
-- Still config, not code (master-prompt §10 — see 20260910000001's
-- business_types table) — every one of these is just a row, so a future
-- type needs no app code change either. `default_modules` values must stay
-- inside src/data/moduleKeys.ts's MODULE_KEYS vocabulary; only the subset
-- with a real dashboard page (products, inventory, orders, customers,
-- bookings, services, staff, payments, analytics, tasks, subscriptions,
-- delivery) actually drives sidebar visibility today.
insert into public.business_types (key, label, default_modules) values
  ('hair_salon', 'Hair Salon', array['bookings', 'customers', 'staff', 'payments', 'analytics']),
  ('makeup_artist', 'Makeup Artist', array['bookings', 'customers', 'payments']),
  ('nail_salon', 'Nail Salon', array['bookings', 'customers', 'staff', 'payments']),
  ('spa_wellness', 'Spa & Wellness', array['bookings', 'customers', 'staff', 'payments', 'analytics']),
  ('dentist', 'Dentist', array['bookings', 'customers', 'staff', 'payments']),
  ('medical_clinic', 'Medical Clinic', array['bookings', 'customers', 'staff', 'payments']),
  ('veterinary_clinic', 'Veterinary Clinic', array['bookings', 'customers', 'staff', 'payments']),
  ('pharmacy', 'Pharmacy', array['products', 'inventory', 'orders', 'customers', 'analytics']),
  ('bar_pub', 'Bar / Pub', array['products', 'orders', 'bookings', 'customers']),
  ('cafe', 'Café', array['products', 'orders', 'customers', 'analytics']),
  ('bakery', 'Bakery', array['products', 'orders', 'inventory', 'customers']),
  ('toy_store', 'Toy Store', array['products', 'inventory', 'orders', 'customers', 'analytics']),
  ('library', 'Library', array['products', 'orders', 'customers']),
  ('bookstore', 'Bookstore', array['products', 'inventory', 'orders', 'customers', 'analytics']),
  ('mobile_shop', 'Mobile Phone Shop', array['products', 'inventory', 'orders', 'customers', 'analytics']),
  ('electronics_store', 'Electronics Store', array['products', 'inventory', 'orders', 'customers', 'analytics']),
  ('gaming_lounge', 'Gaming Lounge', array['bookings', 'products', 'orders', 'customers', 'staff']),
  ('home_business', 'Home Business', array['products', 'orders', 'customers']),
  ('home_cooking', 'Home Cooking', array['products', 'orders', 'customers']),
  ('home_crafting', 'Home Crafting', array['products', 'orders', 'customers']),
  ('florist', 'Florist', array['products', 'orders', 'customers', 'delivery']),
  ('jewelry_store', 'Jewelry Store', array['products', 'inventory', 'orders', 'customers', 'analytics']),
  ('shoe_store', 'Shoe Store', array['products', 'inventory', 'orders', 'customers', 'analytics']),
  ('furniture_store', 'Furniture Store', array['products', 'inventory', 'orders', 'customers', 'delivery']),
  ('hardware_store', 'Hardware Store', array['products', 'inventory', 'orders', 'customers']),
  ('car_wash', 'Car Wash', array['bookings', 'customers', 'staff', 'payments']),
  ('auto_repair', 'Auto Repair / Garage', array['bookings', 'customers', 'staff', 'payments', 'inventory']),
  ('car_dealer', 'Car Dealership', array['products', 'customers', 'payments', 'analytics']),
  ('cleaning_service', 'Cleaning Service', array['bookings', 'customers', 'staff', 'payments']),
  ('plumber_electrician', 'Plumbing & Electrical', array['bookings', 'customers', 'staff', 'payments']),
  ('photography_studio', 'Photography Studio', array['bookings', 'customers', 'payments']),
  ('event_planning', 'Event Planning', array['bookings', 'customers', 'payments', 'tasks']),
  ('pet_shop', 'Pet Shop', array['products', 'inventory', 'orders', 'customers']),
  ('daycare_nursery', 'Daycare / Nursery', array['bookings', 'customers', 'staff', 'payments']),
  ('personal_trainer', 'Personal Trainer', array['bookings', 'customers', 'payments']),
  ('yoga_studio', 'Yoga Studio', array['bookings', 'customers', 'staff', 'payments']),
  ('laundry_dry_cleaning', 'Laundry & Dry Cleaning', array['orders', 'customers', 'payments']),
  ('print_shop', 'Print Shop', array['products', 'orders', 'customers']),
  ('stationery_shop', 'Stationery Shop', array['products', 'inventory', 'orders', 'customers']),
  ('butcher', 'Butcher', array['products', 'orders', 'customers']),
  ('grocery_minimarket', 'Grocery / Mini Market', array['products', 'inventory', 'orders', 'customers']),
  ('real_estate', 'Real Estate Agency', array['customers', 'bookings', 'payments', 'analytics']),
  ('travel_agency', 'Travel Agency', array['bookings', 'customers', 'payments']),
  ('law_firm', 'Law Firm / Legal Services', array['bookings', 'customers', 'payments']),
  ('accounting_firm', 'Accounting Firm', array['bookings', 'customers', 'payments']),
  ('bike_shop', 'Bicycle Shop', array['products', 'inventory', 'orders', 'customers']),
  ('tailor', 'Tailor / Alterations', array['orders', 'customers', 'bookings', 'payments'])
on conflict (key) do nothing;
