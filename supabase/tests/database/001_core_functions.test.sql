-- pgTAP tests for deterministic, auth-independent SQL logic — the pieces
-- that don't need an impersonated user session to exercise (see
-- 002_rls_tenant_isolation.test.sql for the ones that do).
--
-- HOW TO RUN: `supabase test db` (requires Docker Desktop — Supabase spins
-- up a local Postgres to run these against). NOT executable in the
-- environment this file was written in (no Docker available there), so
-- these have been carefully reviewed but not actually run — treat a first
-- run as "verify this compiles and passes", not "known-good".

begin;
select plan(8);

-- Every booking/order insert below includes customer_phone: with no JWT
-- claims set in this raw pgTAP session, auth.uid() reads as null, so
-- enforce_guest_rate_limit (migration 20260914000004) treats these as
-- anonymous-guest inserts and requires a phone number — matching what a
-- real guest checkout would always provide anyway.

-- ── distance_km (migration 20260914000005) ─────────────────────────────
select ok(
  public.distance_km(34.25, 35.65, 34.25, 35.65) < 0.001,
  'distance_km returns ~0 for the same point'
);

select ok(
  public.distance_km(34.2554, 35.6581, 34.3186, 35.7014) between 5 and 12,
  'distance_km(Batroun, Shekka) is a plausible real-world distance (~7km)'
);

-- ── staff_members / booking overlap (migrations 20260914000001-2) ──────
insert into public.cities (id, name, slug, country, active, marketplace_enabled)
values ('11111111-1111-1111-1111-111111111111', 'Test City', 'test-city-pgtap', 'Lebanon', true, true);

insert into public.businesses (id, city_id, name, slug, status, marketplace_visible)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Test Barber', 'test-barber-pgtap', 'active', true
);

insert into public.staff_members (id, business_id, full_name)
values ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Test Staff');

insert into public.bookings (business_id, staff_id, scheduled_date, start_time, end_time, status, customer_phone)
values (
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '2027-01-01', '10:00', '11:00', 'confirmed', '+96170000001'
);

select throws_ok(
  $$ insert into public.bookings (business_id, staff_id, scheduled_date, start_time, end_time, status, customer_phone)
     values ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333',
             '2027-01-01', '10:30', '11:30', 'confirmed', '+96170000002') $$,
  'overlapping booking for the same staff member is rejected by the exclusion constraint'
);

select lives_ok(
  $$ insert into public.bookings (business_id, staff_id, scheduled_date, start_time, end_time, status, customer_phone)
     values ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333',
             '2027-01-01', '11:00', '12:00', 'confirmed', '+96170000003') $$,
  'a booking immediately adjacent (no overlap) is accepted'
);

-- ── inventory auto-decrement (migration 20260914000003) ─────────────────
insert into public.products (id, business_id, name, price, active, marketplace_visible)
values ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Test Widget', 10, true, true);

insert into public.inventory_items (business_id, product_id, quantity)
values ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 5);

insert into public.orders (id, business_id, status, total_amount, customer_phone)
values ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'new', 20, '+96170000004');

insert into public.order_items (order_id, product_id, product_name, unit_price, quantity)
values ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'Test Widget', 10, 2);

select is(
  (select quantity from public.inventory_items where product_id = '44444444-4444-4444-4444-444444444444'),
  3,
  'placing an order for 2 units decrements inventory from 5 to 3'
);

update public.orders set status = 'cancelled' where id = '55555555-5555-5555-5555-555555555555';

select is(
  (select quantity from public.inventory_items where product_id = '44444444-4444-4444-4444-444444444444'),
  5,
  'cancelling the order restocks inventory back to 5'
);

select throws_ok(
  $$ insert into public.order_items (order_id, product_id, product_name, unit_price, quantity)
     select id, '44444444-4444-4444-4444-444444444444', 'Test Widget', 10, 999
     from public.orders where id = '55555555-5555-5555-5555-555555555555' $$,
  'ordering more than available stock is rejected (quantity >= 0 constraint)'
);

-- ── loyalty wallet (migration 20260914000006) ────────────────────────────
select is(
  public.get_loyalty_balance('11111111-1111-1111-1111-111111111111', '+96170000000'),
  0,
  'a brand-new phone number has a zero loyalty balance'
);

select * from finish();
rollback;
