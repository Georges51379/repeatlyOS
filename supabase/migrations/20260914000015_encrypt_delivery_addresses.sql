-- Extends the field-level encryption pattern from migration
-- 20260910000004 (see docs/REPEATLYOS_SECURITY_MODEL.md → "Data
-- Encryption") to a second genuinely sensitive field: a shopper's home
-- delivery address on `orders` and `delivery_groups`.
--
-- This is exactly the case that pattern's own header comment called out as
-- the template's next use: "never searched, filtered, joined on, or
-- publicly displayed" — confirmed against the actual frontend before
-- writing this migration: no page anywhere in the business dashboard reads
-- `orders.delivery_address` today (src/pages/business/Orders.tsx doesn't
-- reference it at all yet), and `delivery_groups.delivery_address` isn't
-- read anywhere either — so encrypting both has zero UI blast radius right
-- now, unlike `customers.address` (actively rendered in
-- src/pages/business/Customers.tsx today, so encrypting THAT one is a
-- separate, real UX/latency decision — deliberately left out of this
-- migration, not overlooked).
--
-- Reuses the existing `encrypt_pii`/`decrypt_pii` infrastructure and vault
-- key from migration 20260910000004 rather than creating a second one —
-- one project-wide PII key, not one per field.

create or replace function public.encrypt_delivery_address()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  already_ciphertext boolean := false;
begin
  if new.delivery_address is null then
    return new;
  end if;

  begin
    perform public.decrypt_pii(new.delivery_address);
    already_ciphertext := true;
  exception when others then
    already_ciphertext := false;
  end;

  if not already_ciphertext then
    new.delivery_address := public.encrypt_pii(new.delivery_address);
  end if;

  return new;
end;
$$;

drop trigger if exists encrypt_orders_delivery_address_trigger on public.orders;
create trigger encrypt_orders_delivery_address_trigger
  before insert or update of delivery_address on public.orders
  for each row execute function public.encrypt_delivery_address();

drop trigger if exists encrypt_delivery_groups_address_trigger on public.delivery_groups;
create trigger encrypt_delivery_groups_address_trigger
  before insert or update of delivery_address on public.delivery_groups
  for each row execute function public.encrypt_delivery_address();

comment on column public.orders.delivery_address is
  'Ciphertext at rest (hex-encoded pgp_sym) since migration 20260914000015 — see encrypt_delivery_address trigger. Not currently read back anywhere in the frontend; decrypt via decrypt_pii() (service_role-only) if/when an order-fulfillment view needs to show it.';

comment on column public.delivery_groups.delivery_address is
  'Ciphertext at rest (hex-encoded pgp_sym) since migration 20260914000015 — see encrypt_delivery_address trigger. Same pattern and caveat as orders.delivery_address above.';
