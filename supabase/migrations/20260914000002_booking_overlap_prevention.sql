-- Closes the other documented MVP gap from migration 20260910000008: "no
-- DB-level exclusion constraint... a real overlap constraint... wants a
-- stable identity to partition by (a real staff/resource id), which doesn't
-- exist yet". `staff_members` now exists (previous migration), so this adds
-- the constraint.
--
-- Only enforced when a booking actually has a `staff_id` — a booking still
-- using the legacy free-text `staff` column (or no staff at all) has no
-- stable identity to partition overlap-checking by, and is left as before
-- rather than silently rejecting typo'd/whitespace-varied text as "the same
-- staff member" (the exact false-confidence problem the original note
-- warned about).
--
-- `time_range` is a generated, stored column so the exclusion constraint has
-- a real indexable range to compare — kept as plain `timestamp` (no time
-- zone) rather than `timestamptz` since `scheduled_date`/`start_time`/
-- `end_time` are themselves timezone-naive local wall-clock values; there is
-- no stored business timezone to combine them against.

create extension if not exists btree_gist;

alter table public.bookings
  add column time_range tsrange generated always as (
    tsrange(
      (scheduled_date + start_time)::timestamp,
      (scheduled_date + end_time)::timestamp,
      '[)'
    )
  ) stored;

-- A cancelled booking must not block a new booking for the same slot — the
-- partial-constraint predicate excludes it rather than requiring the
-- cancelling flow to also delete/blank the row.
alter table public.bookings
  add constraint bookings_no_staff_overlap
  exclude using gist (
    business_id with =,
    staff_id with =,
    time_range with &&
  ) where (staff_id is not null and status <> 'cancelled');
