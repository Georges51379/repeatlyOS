# Database tests

pgTAP tests closing the "no automated test suite" gap noted in
`docs/REPEATLYOS_SECURITY_MODEL.md` and `docs/REPEATLYOS_PROGRESS.md`.

## Running

```
supabase test db
```

Requires Docker Desktop (Supabase spins up a disposable local Postgres to
run these against) — not available in every environment. **These files
were written carefully and reviewed line-by-line, but have not actually
been executed anywhere**, since no environment with Docker was available
while writing them. Treat the first real run as "does this pass", not
"known-good" — the header comment on each file flags the specific lines
most likely to need a small fix on a real Postgres/Supabase version (e.g.
`auth.users`' exact NOT NULL columns can vary by version).

## What's covered

- `001_core_functions.test.sql` — deterministic SQL logic that doesn't need
  an impersonated user session: distance calculation, booking-overlap
  exclusion constraint, inventory auto-decrement/restock, loyalty balance
  lookup.
- `002_rls_tenant_isolation.test.sql` — the actual security-critical path:
  automates the tenant-isolation check that was previously only verified
  once, by hand, against the live project (see
  `docs/REPEATLYOS_PROGRESS.md`). Impersonates two different business
  owners via `request.jwt.claims` (what PostgREST sets before every real
  request) to confirm one tenant genuinely cannot read or write another's
  data, and that RLS isn't accidentally blocking legitimate access either.

## What's not covered

Every other RLS policy in the schema (33 tables' worth) — these two files
are a starting template and the two highest-value scenarios, not
exhaustive coverage. Extend `002_rls_tenant_isolation.test.sql`'s pattern
(impersonate via `request.jwt.claims`, assert row counts / throws_ok) for
other policies as they matter — city admin scoping, guest-checkout public
insert paths, the module/plan entitlement trigger, etc.
