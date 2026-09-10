-- Phase 3 — second real dashboard domain: a business-scoped Kanban task
-- board (master-prompt §12 "Tasks", §32 sidebar). Unlike `customers`, this
-- is NOT permission-gated on write: the master-prompt's permission
-- vocabulary (§7) doesn't list a tasks.* permission, and a task board is
-- inherently a whole-team collaborative tool — any active member (whatever
-- their role) can create/move/edit tasks, matching how the original demo's
-- Kanban behaved. Read/write are both just "is an active member."
--
-- `customer_id` optionally links a task to a real `customers` row (nullable
-- + `on delete set null`, since a task shouldn't vanish or block deleting a
-- customer) — a genuine improvement over the demo, which only had a
-- freeform customer name string with no real relationship.

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  title text not null,
  notes text,
  assigned_to text,
  board_column text not null default 'todo',
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_business_id_idx on public.tasks (business_id);
create index tasks_customer_id_idx on public.tasks (customer_id);

create trigger set_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

alter table public.tasks enable row level security;

create policy tasks_member_read on public.tasks
  for select using (public.is_business_member(business_id));

create policy tasks_member_write on public.tasks
  for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));
