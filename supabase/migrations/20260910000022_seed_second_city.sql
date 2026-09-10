-- Adds Shekka (Chekka) as a second launch city, requested directly by the
-- user (2026-09-10) alongside the homepage/city-directory/smart-search
-- redesign. Same region as Batroun ("North Lebanon") — real-world
-- neighboring coastal towns — so the smart-search "nearby city" fallback
-- has a genuine, geographically sensible pair to demonstrate with.
-- `marketplace_enabled = true` from the start (unlike Batroun, which
-- launched with it off until Phase 6 was ready) since the marketplace is
-- now live.
insert into public.cities (name, slug, display_name, country, region, active, marketplace_enabled, description)
values (
  'Shekka', 'shekka', 'Shekka', 'Lebanon', 'North Lebanon', true, true,
  'Buy Shekka — powered by RepeatlyOS.'
)
on conflict (slug) do nothing;
