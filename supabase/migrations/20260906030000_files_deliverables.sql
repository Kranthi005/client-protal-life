-- NEXUS Phase 2C: project files and deliverables.

create table public.project_files (
  id uuid primary key default gen_random_uuid(),

  project_id uuid not null
    references public.projects(id)
    on delete cascade,

  name text not null
    check (char_length(trim(name)) > 0),

  storage_path text not null unique,

  mime_type text,

  size_bytes bigint,

  uploaded_by uuid not null
    references auth.users(id)
    on delete restrict,

  created_at timestamptz not null default now()
);

create table public.deliverables (
  id uuid primary key default gen_random_uuid(),

  project_id uuid not null
    references public.projects(id)
    on delete cascade,

  file_id uuid
    references public.project_files(id)
    on delete set null,

  title text not null
    check (char_length(trim(title)) > 0),

  description text,

  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'IN_REVIEW', 'APPROVED')),

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index project_files_project_id_idx
  on public.project_files(project_id);

create index deliverables_project_id_idx
  on public.deliverables(project_id);

create trigger deliverables_set_updated_at
  before update on public.deliverables
  for each row
  execute procedure public.set_updated_at();

alter table public.project_files enable row level security;

alter table public.deliverables enable row level security;


-- FILE POLICIES

create policy "Project members can view project files"
  on public.project_files
  for select
  to authenticated
  using (
    public.is_project_member(project_id)
  );

create policy "Service providers can upload project files"
  on public.project_files
  for insert
  to authenticated
  with check (
    public.is_project_service_provider(project_id)
    and uploaded_by = auth.uid()
  );

create policy "Service providers can delete project files"
  on public.project_files
  for delete
  to authenticated
  using (
    public.is_project_service_provider(project_id)
  );


-- DELIVERABLE POLICIES

create policy "Project members can view deliverables"
  on public.deliverables
  for select
  to authenticated
  using (
    public.is_project_member(project_id)
  );

create policy "Service providers can create deliverables"
  on public.deliverables
  for insert
  to authenticated
  with check (
    public.is_project_service_provider(project_id)
  );

create policy "Service providers can update deliverables"
  on public.deliverables
  for update
  to authenticated
  using (
    public.is_project_service_provider(project_id)
  )
  with check (
    public.is_project_service_provider(project_id)
  );

create policy "Service providers can delete deliverables"
  on public.deliverables
  for delete
  to authenticated
  using (
    public.is_project_service_provider(project_id)
  );