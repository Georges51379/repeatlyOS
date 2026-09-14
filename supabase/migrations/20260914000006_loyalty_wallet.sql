-- New feature: a city-wide loyalty wallet — one points balance a shopper
-- earns at ANY participating business in a city and can redeem at ANY OTHER
-- participating business in that same city, rather than per-business points
-- that go unused once a shopper stops visiting one specific merchant. This
-- is deliberately a marketplace-level (city-scoped) concept, not a
-- business-level one like `customer_memberships`.
--
-- Guest-first, matching migration 20260910000014's framing ("not a consumer
-- account system"): a wallet is keyed by (city_id, customer_phone), not a
-- user_id, since most shoppers never create an account. Earn/redeem/balance
-- are all only reachable through `security definer` functions below, never
-- direct table access — a phone number is not a secret the way a password
-- is, so this intentionally mirrors how guest orders/bookings already work
-- (identified by phone, not authenticated), rather than inventing a
-- separate login just to protect a points balance.
--
-- KNOWN GAP, noted deliberately: no rate limiting on `get_loyalty_balance`
-- specifically (guest order/booking inserts are rate-limited by migration
-- 20260914000004; this is a read, not a write, so a phone number can be
-- probed for its balance). Acceptable for an initial launch where the
-- reward is small; revisit if wallet balances start representing real
-- transferable value.

create table public.loyalty_wallets (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id) on delete cascade,
  customer_phone text not null,
  balance_points integer not null default 0 check (balance_points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_id, customer_phone)
);

create trigger set_loyalty_wallets_updated_at
  before update on public.loyalty_wallets
  for each row execute function public.set_updated_at();

create table public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.loyalty_wallets (id) on delete cascade,
  business_id uuid references public.businesses (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  points_delta integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index loyalty_transactions_wallet_id_idx on public.loyalty_transactions (wallet_id);

alter table public.loyalty_wallets enable row level security;
alter table public.loyalty_transactions enable row level security;

-- No direct client policy for guests at all (see header note) — only
-- platform admins can browse the raw tables; everyone else goes through the
-- functions below.
create policy loyalty_wallets_platform_admin_read on public.loyalty_wallets
  for select using (public.is_platform_admin());

create policy loyalty_transactions_platform_admin_read on public.loyalty_transactions
  for select using (public.is_platform_admin());

-- Points earned per whole currency unit spent. A simple, transparent flat
-- rate rather than a per-business configurable one, to keep the "spend
-- anywhere in the city, earn anywhere in the city" promise easy for a
-- shopper to reason about.
create or replace function public.earn_rate_points_per_currency_unit()
returns integer
language sql
immutable
as $$ select 1 $$;

create or replace function public.get_or_create_wallet(p_city_id uuid, p_phone text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_wallet_id uuid;
begin
  insert into public.loyalty_wallets (city_id, customer_phone)
  values (p_city_id, p_phone)
  on conflict (city_id, customer_phone) do nothing;

  select id into v_wallet_id from public.loyalty_wallets
  where city_id = p_city_id and customer_phone = p_phone;

  return v_wallet_id;
end;
$$;

create or replace function public.get_loyalty_balance(p_city_id uuid, p_phone text)
returns integer
language sql
stable
security definer set search_path = public
as $$
  select coalesce(
    (select balance_points from public.loyalty_wallets
     where city_id = p_city_id and customer_phone = p_phone),
    0
  );
$$;

-- Called when an order reaches 'completed' (see trigger below). Awards
-- points into the wallet for the order's own city, keyed by whichever phone
-- number is on the order (guest checkout) or its linked customer.
create or replace function public.earn_loyalty_points_for_order()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_city_id uuid;
  v_phone text;
  v_wallet_id uuid;
  v_points integer;
begin
  if new.status <> 'completed' or old.status = 'completed' then
    return new;
  end if;

  v_phone := new.customer_phone;
  if v_phone is null and new.customer_id is not null then
    select phone into v_phone from public.customers where id = new.customer_id;
  end if;
  if v_phone is null or length(trim(v_phone)) = 0 then
    return new; -- no way to attribute points to anyone
  end if;

  select city_id into v_city_id from public.businesses where id = new.business_id;
  if v_city_id is null then
    return new;
  end if;

  v_points := floor(new.total_amount * public.earn_rate_points_per_currency_unit());
  if v_points <= 0 then
    return new;
  end if;

  v_wallet_id := public.get_or_create_wallet(v_city_id, v_phone);

  update public.loyalty_wallets set balance_points = balance_points + v_points where id = v_wallet_id;

  insert into public.loyalty_transactions (wallet_id, business_id, order_id, points_delta, reason)
  values (v_wallet_id, new.business_id, new.id, v_points, 'order_completed');

  return new;
end;
$$;

create trigger on_order_completed_earn_loyalty
  after update on public.orders
  for each row execute function public.earn_loyalty_points_for_order();

-- Redeem: called from checkout (marketplace client, no auth) against a
-- specific order. Deducts points and records the redemption; raises if the
-- wallet doesn't have enough — the caller is expected to check
-- `get_loyalty_balance` first and only offer redemption up to that amount,
-- but this is the actual enforcement point, not just a UI courtesy.
create or replace function public.redeem_loyalty_points(
  p_city_id uuid,
  p_phone text,
  p_points integer,
  p_business_id uuid,
  p_order_id uuid default null
)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_wallet_id uuid;
  v_balance integer;
begin
  if p_points <= 0 then
    raise exception 'Redemption amount must be positive.';
  end if;

  v_wallet_id := public.get_or_create_wallet(p_city_id, p_phone);
  select balance_points into v_balance from public.loyalty_wallets where id = v_wallet_id;

  if v_balance < p_points then
    raise exception 'Not enough loyalty points: have %, tried to redeem %.', v_balance, p_points;
  end if;

  update public.loyalty_wallets set balance_points = balance_points - p_points where id = v_wallet_id;

  insert into public.loyalty_transactions (wallet_id, business_id, order_id, points_delta, reason)
  values (v_wallet_id, p_business_id, p_order_id, -p_points, 'redeemed_at_checkout');

  return v_balance - p_points;
end;
$$;
