-- Extends field-level encryption to `customers.address` — explicitly
-- requested (2026-09-14) after being flagged as a real decision rather than
-- defaulted into: unlike delivery addresses (migration 20260914000015),
-- this field IS read back in the frontend today, so this migration is
-- paired with a new Edge Function (supabase/functions/decrypt-customer-address)
-- and a Customers.tsx change to call it.
--
-- Turned out cheaper than initially scoped: `address` is only ever shown
-- when editing ONE customer (the Customers.tsx table itself doesn't render
-- it — only Name/Phone/Email/Status columns do; `address` only pre-fills
-- the edit form for the single row being edited). So this needs a
-- single-row decrypt on demand, the same shape as `decrypt-invite-email`,
-- not a batched decrypt of an entire list on every page load.
--
-- Same reused encrypt_pii/decrypt_pii infrastructure and Vault key as both
-- prior fields — one project-wide PII key throughout. A separate trigger
-- function from `encrypt_delivery_address` (migration 20260914000015)
-- because that one is hardcoded to the `delivery_address` column name,
-- which `customers` doesn't have — this one targets `address` instead.

create or replace function public.encrypt_customer_address()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  already_ciphertext boolean := false;
begin
  if new.address is null then
    return new;
  end if;

  begin
    perform public.decrypt_pii(new.address);
    already_ciphertext := true;
  exception when others then
    already_ciphertext := false;
  end;

  if not already_ciphertext then
    new.address := public.encrypt_pii(new.address);
  end if;

  return new;
end;
$$;

drop trigger if exists encrypt_customer_address_trigger on public.customers;
create trigger encrypt_customer_address_trigger
  before insert or update of address on public.customers
  for each row execute function public.encrypt_customer_address();

comment on column public.customers.address is
  'Ciphertext at rest (hex-encoded pgp_sym) since migration 20260914000016. Read via the decrypt-customer-address Edge Function (service_role-only), which re-checks customers_member_read as the caller before decrypting — never read directly in list views.';
