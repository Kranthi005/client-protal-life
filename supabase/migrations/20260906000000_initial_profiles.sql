-- NEXUS Phase 1: authentication profiles and foundations for later additions.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'SERVICE_PROVIDER' check (role in ('SERVICE_PROVIDER', 'CLIENT')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select to authenticated using ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    case when new.raw_user_meta_data ->> 'role' = 'CLIENT' then 'CLIENT' else 'SERVICE_PROVIDER' end
  );
  return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute procedure public.handle_new_user();
create trigger profiles_set_updated_at
  before update on public.profiles for each row execute procedure public.set_updated_at();

-- Future schemas will reference profiles.id and introduce organizations before projects.
