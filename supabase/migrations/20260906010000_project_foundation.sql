-- NEXUS Phase 2A: organizations, projects, and project membership.

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  description text,
  client_name text,
  status text not null default 'PLANNING' check (status in ('PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED')),
  progress smallint not null default 0 check (progress between 0 and 100),
  start_date date,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_date is null or start_date is null or due_date >= start_date)
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('SERVICE_PROVIDER', 'CLIENT')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index projects_organization_id_idx on public.projects (organization_id);
create index project_members_user_id_idx on public.project_members (user_id);

create trigger organizations_set_updated_at
  before update on public.organizations for each row execute procedure public.set_updated_at();
create trigger projects_set_updated_at
  before update on public.projects for each row execute procedure public.set_updated_at();
create trigger project_members_set_updated_at
  before update on public.project_members for each row execute procedure public.set_updated_at();

-- Security-definer helpers keep membership policies from recursively querying
-- project_members while still evaluating the active authenticated user.
create or replace function public.profile_has_role(target_user_id uuid, expected_role text)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = target_user_id and role = expected_role
  );
$$;

create or replace function public.is_organization_owner(target_organization_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.organizations
    where id = target_organization_id and owner_id = auth.uid()
  );
$$;

create or replace function public.is_project_member(target_project_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.project_members
    where project_id = target_project_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_project_service_provider(target_project_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.project_members
    where project_id = target_project_id
      and user_id = auth.uid()
      and role = 'SERVICE_PROVIDER'
  );
$$;

create or replace function public.is_project_organization_owner(target_project_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.projects
    join public.organizations on organizations.id = projects.organization_id
    where projects.id = target_project_id and organizations.owner_id = auth.uid()
  );
$$;

create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.projects
    join public.project_members on project_members.project_id = projects.id
    where projects.organization_id = target_organization_id
      and project_members.user_id = auth.uid()
  );
$$;

-- A newly created project always includes its organization owner as a manager.
-- This makes the creator able to read and manage the project under RLS.
create or replace function public.add_project_owner_as_member()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.project_members (project_id, user_id, role)
  select new.id, organizations.owner_id, 'SERVICE_PROVIDER'
  from public.organizations
  where organizations.id = new.organization_id
  on conflict (project_id, user_id) do nothing;
  return new;
end;
$$;

create trigger projects_add_owner_as_member
  after insert on public.projects for each row execute procedure public.add_project_owner_as_member();

alter table public.organizations enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;

create policy "Members can view their organizations"
  on public.organizations for select to authenticated
  using (owner_id = auth.uid() or public.is_organization_member(id));
create policy "Service providers can create their organizations"
  on public.organizations for insert to authenticated
  with check (owner_id = auth.uid() and public.profile_has_role(auth.uid(), 'SERVICE_PROVIDER'));
create policy "Organization owners can update their organizations"
  on public.organizations for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
create policy "Organization owners can delete their organizations"
  on public.organizations for delete to authenticated
  using (owner_id = auth.uid());

create policy "Project members can view assigned projects"
  on public.projects for select to authenticated
  using (public.is_project_member(id));
create policy "Organization owners can create projects"
  on public.projects for insert to authenticated
  with check (
    public.is_organization_owner(organization_id)
    and public.profile_has_role(auth.uid(), 'SERVICE_PROVIDER')
  );
create policy "Service provider members can update projects"
  on public.projects for update to authenticated
  using (public.is_project_service_provider(id))
  with check (public.is_project_service_provider(id));
create policy "Service provider members can delete projects"
  on public.projects for delete to authenticated
  using (public.is_project_service_provider(id));

create policy "Members can view relevant project memberships"
  on public.project_members for select to authenticated
  using (user_id = auth.uid() or public.is_project_service_provider(project_id));
create policy "Service providers can add project members"
  on public.project_members for insert to authenticated
  with check (
    (
      public.is_project_service_provider(project_id)
      or public.is_project_organization_owner(project_id)
    )
    and public.profile_has_role(user_id, role)
  );
create policy "Service providers can update project members"
  on public.project_members for update to authenticated
  using (public.is_project_service_provider(project_id))
  with check (
    public.is_project_service_provider(project_id)
    and public.profile_has_role(user_id, role)
  );
create policy "Service providers can remove project members"
  on public.project_members for delete to authenticated
  using (public.is_project_service_provider(project_id));
