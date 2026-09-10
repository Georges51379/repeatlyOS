-- Field-level encryption infrastructure: database stores ciphertext, only a
-- server-side context holding the service_role key can ever decrypt it — the
-- anon/authenticated roles the browser uses cannot, even if they read the
-- raw column. Applied here to `business_memberships.invited_email`, the
-- first genuinely sensitive PII field in the schema (a pending invitee's
-- email address). See docs/REPEATLYOS_SECURITY_MODEL.md for exactly why
-- this pattern is NOT extended to columns like city_id/status/slug/name —
-- those are read directly by Postgres inside RLS policies and by the public
-- marketplace's search/SEO pages, and encrypting them would break both,
-- verified concretely in this project (see REPEATLYOS_DATABASE_MODEL.md).

create extension if not exists "supabase_vault";

-- One symmetric key for this project, stored in Vault (readable only by
-- postgres/service_role, never by anon/authenticated). Safe to run more than
-- once — does nothing if the named secret already exists.
do $$
begin
  if not exists (
    select 1 from vault.secrets where name = 'repeatlyos_pii_key'
  ) then
    perform vault.create_secret(
      encode(gen_random_bytes(32), 'hex'),
      'repeatlyos_pii_key',
      'Symmetric key for pgcrypto-encrypted PII columns (e.g. business_memberships.invited_email). Never exposed to anon/authenticated.'
    );
  end if;
end $$;

create or replace function public.pii_key()
returns text
language sql
stable
security definer set search_path = public, vault
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'repeatlyos_pii_key';
$$;

-- These live in `public` (so they're reachable via supabase-js .rpc() from
-- an Edge Function using the service_role key over the normal REST API —
-- no raw Postgres connection string needed), but EXECUTE is revoked from
-- anon/authenticated and granted only to service_role below. A browser
-- calling supabase.rpc('decrypt_pii', ...) with the anon/user JWT gets a
-- permission-denied error; only a trusted server context (the Edge
-- Function, which alone holds the service_role key) can ever decrypt.
-- search_path includes `extensions` because that's where Supabase installs
-- pgcrypto by default (NOT `public`) — confirmed by testing against the live
-- project: without it, `pgp_sym_encrypt`/`pgp_sym_decrypt` fail with
-- "function ... does not exist", since these functions' search_path is
-- deliberately narrow (a security choice, to avoid search-path-hijacking)
-- and doesn't fall back to the session's ambient default. Calls are also
-- explicitly schema-qualified (`extensions.pgp_sym_*`) so this doesn't
-- depend on search_path ordering at all.
-- `hex`, not `base64`: Postgres's base64 encode() line-wraps every 76
-- characters (embeds raw newlines in the output) — fine inside the
-- database, but fragile the moment that value is transported as a JSON
-- string (confirmed while testing: it broke naive JSON construction). hex
-- is longer but never contains anything but [0-9a-f], so it round-trips
-- through JSON/REST with zero ambiguity.
create or replace function public.encrypt_pii(plaintext text)
returns text
language sql
stable
security definer set search_path = public, extensions
as $$
  select case when plaintext is null then null
    else encode(extensions.pgp_sym_encrypt(plaintext, public.pii_key()), 'hex')
  end;
$$;

create or replace function public.decrypt_pii(ciphertext text)
returns text
language sql
stable
security definer set search_path = public, extensions
as $$
  select case when ciphertext is null then null
    else extensions.pgp_sym_decrypt(decode(ciphertext, 'hex'), public.pii_key())
  end;
$$;

revoke all on function public.pii_key() from anon, authenticated;
revoke all on function public.encrypt_pii(text) from anon, authenticated;
revoke all on function public.decrypt_pii(text) from anon, authenticated;
grant execute on function public.encrypt_pii(text) to service_role;
grant execute on function public.decrypt_pii(text) to service_role;

comment on column public.business_memberships.invited_email is
  'Always ciphertext at rest (hex-encoded pgp_sym) — see encrypt_invited_email_trigger below. Read via decrypt_pii() (service_role-only, see supabase/functions/decrypt-invite-email). Never store or compare plaintext here.';

-- Transparent encryption on write: an owner/manager inserting a staff
-- invitation still just sends a plain email address like any normal form
-- field (via the regular RLS-protected REST insert on business_memberships,
-- no special client-side code needed) — this trigger encrypts it before it
-- ever touches disk, regardless of which path wrote it. Idempotent against
-- re-saves: if the incoming value already decrypts successfully, it's
-- already ciphertext and is left alone (prevents double-encryption when an
-- UPDATE re-sends a row without changing this column).
create or replace function public.encrypt_invited_email()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  already_ciphertext boolean := false;
begin
  if new.invited_email is null then
    return new;
  end if;

  begin
    perform public.decrypt_pii(new.invited_email);
    already_ciphertext := true;
  exception when others then
    already_ciphertext := false;
  end;

  if not already_ciphertext then
    new.invited_email := public.encrypt_pii(new.invited_email);
  end if;

  return new;
end;
$$;

drop trigger if exists encrypt_invited_email_trigger on public.business_memberships;

create trigger encrypt_invited_email_trigger
  before insert or update of invited_email on public.business_memberships
  for each row execute function public.encrypt_invited_email();
