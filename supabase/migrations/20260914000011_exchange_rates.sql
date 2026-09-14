-- New feature: dual-currency (USD/LBP) price display. All prices in this
-- schema (products.price, orders.total_amount, etc.) are stored in USD,
-- unchanged — this table only adds the LBP conversion rate used to render a
-- second figure alongside it.
--
-- Deliberately a single manually-updated row, not a live third-party FX API
-- integration: the rate that actually matters to a Lebanese shopper/merchant
-- day-to-day is the real parallel-market rate, which does not reliably match
-- any single official API, and pulling in a live external FX dependency
-- would make every price render depend on a third-party service being up.
-- A platform admin updates it (as often as needed); the storefront always
-- reads the latest row.
create table public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  base_currency text not null default 'USD',
  quote_currency text not null default 'LBP',
  rate numeric(14, 2) not null check (rate > 0),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (base_currency, quote_currency)
);

alter table public.exchange_rates enable row level security;

-- Public read (a shopper needs this to see LBP prices without being logged
-- in) — matches `saas_plans_read_all`'s precedent for public, non-sensitive
-- platform config.
create policy exchange_rates_public_read on public.exchange_rates
  for select using (true);

create policy exchange_rates_platform_admin_write on public.exchange_rates
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

insert into public.exchange_rates (base_currency, quote_currency, rate)
values ('USD', 'LBP', 89500)
on conflict (base_currency, quote_currency) do nothing;
