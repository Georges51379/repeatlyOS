-- Closes a documented MVP gap: `bookings.staff` and `tasks.assigned_to` have
-- been plain free text since migrations 20260910000007/8, noted at the time
-- as "there's no real Staff/StaffMember table yet... introducing one is a
-- bigger, separate addition". This is that addition.
--
-- `staff_id` is added ALONGSIDE the existing free-text columns rather than
-- replacing them — existing rows keep their free-text value untouched, and
-- the UI can migrate a business to real staff records at its own pace
-- (matching this project's general preference for additive, non-destructive
-- schema changes over rewriting history). New bookings/tasks should prefer
-- staff_id once a business has added real staff members.

create table public.staff_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  full_name text not null,
  phone text,
  role_title text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index staff_members_business_id_idx on public.staff_members (business_id);

create trigger set_staff_members_updated_at
  before update on public.staff_members
  for each row execute function public.set_updated_at();

alter table public.staff_members enable row level security;

create policy staff_members_member_read on public.staff_members
  for select using (public.is_business_member(business_id));

create policy staff_members_manage_write on public.staff_members
  for all
  using (public.has_business_permission(business_id, 'staff.manage'))
  with check (public.has_business_permission(business_id, 'staff.manage'));

alter table public.bookings
  add column staff_id uuid references public.staff_members (id) on delete set null;

alter table public.tasks
  add column assigned_staff_id uuid references public.staff_members (id) on delete set null;

create index bookings_staff_id_idx on public.bookings (staff_id);
create index tasks_assigned_staff_id_idx on public.tasks (assigned_staff_id);
