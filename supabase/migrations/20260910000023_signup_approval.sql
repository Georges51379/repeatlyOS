-- Requested 2026-09-11: signup should not create an auth account at all —
-- just a request, reviewed by a platform admin before anyone can actually
-- log in. This also resolves the earlier tension around "no verification
-- step": there is genuinely no verification needed at request time, since
-- nothing usable (no session, no auth.users row) is created until a human
-- approves it. City admins are never created through this path at
-- all — they're only ever granted directly by a platform admin (already
-- true of city_admins, unchanged here); this table is for prospective
-- business owners.
create table public.signup_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Only one pending request per email at a time — resubmitting while
-- already pending should not pile up duplicate rows for the admin queue.
create unique index signup_requests_pending_email_idx
  on public.signup_requests (lower(email))
  where status = 'pending';

alter table public.signup_requests enable row level security;

-- Insert: open to anyone, including anonymous visitors — there is no
-- account yet at this point, so there is nothing to scope this to.
create policy signup_requests_insert_anyone on public.signup_requests
  for insert with check (true);

-- Read/update: platform admins only (the review queue). A requester has
-- no account yet to read their own row back through, which is fine — the
-- UI only ever shows a static "submitted" confirmation, never reads this
-- table back.
create policy signup_requests_admin_only on public.signup_requests
  for select using (public.is_platform_admin());

create policy signup_requests_admin_update on public.signup_requests
  for update using (public.is_platform_admin()) with check (public.is_platform_admin());
