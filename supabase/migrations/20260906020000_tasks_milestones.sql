-- NEXUS Phase 2B: project tasks and milestones.

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  status text not null default 'TODO' check (status in ('TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED')),
  priority text not null default 'MEDIUM' check (priority in ('LOW', 'MEDIUM', 'HIGH')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  status text not null default 'PLANNED' check (status in ('PLANNED', 'IN_PROGRESS', 'COMPLETED')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_project_id_idx on public.tasks (project_id);
create index milestones_project_id_idx on public.milestones (project_id);

create trigger tasks_set_updated_at
  before update on public.tasks for each row execute procedure public.set_updated_at();
create trigger milestones_set_updated_at
  before update on public.milestones for each row execute procedure public.set_updated_at();

alter table public.tasks enable row level security;
alter table public.milestones enable row level security;

create policy "Project members can view tasks"
  on public.tasks for select to authenticated
  using (public.is_project_member(project_id));
create policy "Service provider members can create tasks"
  on public.tasks for insert to authenticated
  with check (public.is_project_service_provider(project_id));
create policy "Service provider members can update tasks"
  on public.tasks for update to authenticated
  using (public.is_project_service_provider(project_id))
  with check (public.is_project_service_provider(project_id));
create policy "Service provider members can delete tasks"
  on public.tasks for delete to authenticated
  using (public.is_project_service_provider(project_id));

create policy "Project members can view milestones"
  on public.milestones for select to authenticated
  using (public.is_project_member(project_id));
create policy "Service provider members can create milestones"
  on public.milestones for insert to authenticated
  with check (public.is_project_service_provider(project_id));
create policy "Service provider members can update milestones"
  on public.milestones for update to authenticated
  using (public.is_project_service_provider(project_id))
  with check (public.is_project_service_provider(project_id));
create policy "Service provider members can delete milestones"
  on public.milestones for delete to authenticated
  using (public.is_project_service_provider(project_id));
