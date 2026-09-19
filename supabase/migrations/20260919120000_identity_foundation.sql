-- Path 1: Identity, campus catalog, profiles, preferences, availability.
-- Other feature teams should treat profiles.id as the canonical user id.
-- auth_user_id is null for synthetic/test students (is_synthetic = true).

create extension if not exists "pgcrypto";

create schema if not exists private;

do $$ begin
  create type public.year_level as enum (
    'Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.location_category as enum (
    'hangout', 'gym', 'library', 'dining'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.availability_window as enum (
    'morning', 'afternoon', 'evening'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.data_status as enum (
    'verified', 'needs_review'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  abbreviation text not null,
  city text not null,
  primary_color text not null default '#0d9488',
  secondary_color text not null default '#333F48',
  logo_path text not null default '/universities/default.svg',
  created_at timestamptz not null default now()
);

create table if not exists public.university_email_domains (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id) on delete cascade,
  domain text not null unique
);

create table if not exists public.majors (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id) on delete cascade,
  name text not null,
  unique (university_id, name)
);

create table if not exists public.residence_halls (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id) on delete cascade,
  name text not null,
  is_off_campus boolean not null default false,
  data_status public.data_status not null default 'needs_review',
  unique (university_id, name)
);

create table if not exists public.campus_locations (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id) on delete cascade,
  name text not null,
  category public.location_category not null,
  data_status public.data_status not null default 'needs_review',
  unique (university_id, name)
);

create table if not exists public.interests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete cascade,
  email text unique,
  first_name text,
  last_name text,
  avatar_url text,
  university_id uuid references public.universities (id),
  year public.year_level,
  major_id uuid references public.majors (id),
  second_major_id uuid references public.majors (id),
  minor text,
  residence_hall_id uuid references public.residence_halls (id),
  hometown text,
  bio text,
  visibility jsonb not null default '{
    "last_name": false,
    "year": true,
    "major": true,
    "residence": false,
    "hometown": false,
    "bio": false
  }'::jsonb,
  onboarding_completed_at timestamptz,
  is_synthetic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint synthetic_has_no_auth check (
    (is_synthetic = false) or (auth_user_id is null)
  )
);

create table if not exists public.user_interests (
  user_id uuid not null references public.profiles (id) on delete cascade,
  interest_id uuid not null references public.interests (id) on delete cascade,
  primary key (user_id, interest_id)
);

create table if not exists public.user_availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  time_window public.availability_window not null,
  unique (user_id, weekday, time_window)
);

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  social_energy int check (social_energy between 0 and 100),
  spontaneous_vs_planned int check (spontaneous_vs_planned between 0 and 100),
  sleep_schedule text,
  group_size text,
  planning_style text,
  weekend_style text,
  friday_night text,
  food_text text,
  looking_for text[],
  vibe_completed boolean not null default false,
  answers jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists universities_slug_idx on public.universities (slug);
create index if not exists university_domains_university_idx on public.university_email_domains (university_id);
create index if not exists majors_university_idx on public.majors (university_id);
create index if not exists residence_halls_university_idx on public.residence_halls (university_id);
create index if not exists campus_locations_university_idx on public.campus_locations (university_id);
create index if not exists campus_locations_category_idx on public.campus_locations (university_id, category);
create index if not exists interests_category_idx on public.interests (category);
create index if not exists profiles_university_idx on public.profiles (university_id);
create index if not exists profiles_auth_user_idx on public.profiles (auth_user_id);
create index if not exists profiles_synthetic_idx on public.profiles (is_synthetic);
create index if not exists profiles_onboarding_idx on public.profiles (onboarding_completed_at);
create index if not exists user_interests_interest_idx on public.user_interests (interest_id);
create index if not exists user_availability_user_idx on public.user_availability (user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where auth_user_id = auth.uid()
$$;

create or replace function public.current_university_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select university_id from public.profiles where auth_user_id = auth.uid()
$$;

create or replace function public.protect_profile_identity()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    new.auth_user_id := old.auth_user_id;
    new.is_synthetic := old.is_synthetic;
    if auth.role() <> 'service_role' then
      new.email := old.email;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_identity on public.profiles;
create trigger profiles_protect_identity
before update on public.profiles
for each row execute function public.protect_profile_identity();

create or replace function private.canonical_email_domain(raw text)
returns text
language sql
immutable
as $$
  select regexp_replace(lower(raw), '^(student|students|mail|email|alumni|my)\.', '')
$$;

create or replace function private.match_university_id(email_address text)
returns uuid
language sql
stable
set search_path = public
as $$
  select d.university_id
  from public.university_email_domains d
  where d.domain = lower(split_part(email_address, '@', 2))
     or d.domain = private.canonical_email_domain(split_part(email_address, '@', 2))
  limit 1
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_id uuid;
  uni uuid;
begin
  if new.email is null or new.email !~* '@[^@]+\.edu$' then
    raise exception 'Circle accounts require a .edu email';
  end if;

  uni := private.match_university_id(new.email);

  insert into public.profiles (auth_user_id, email, university_id)
  values (new.id, new.email, uni)
  returning id into profile_id;

  insert into public.user_preferences (user_id)
  values (profile_id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

-- Visibility-aware directory for matching/social teams. Do not query profiles.email.
create or replace view public.student_directory
with (security_invoker = true) as
select
  p.id,
  p.first_name,
  case when coalesce((p.visibility->>'last_name')::boolean, false) then p.last_name else null end as last_name,
  p.avatar_url,
  p.university_id,
  case when coalesce((p.visibility->>'year')::boolean, true) then p.year else null end as year,
  case when coalesce((p.visibility->>'major')::boolean, true) then p.major_id else null end as major_id,
  case when coalesce((p.visibility->>'residence')::boolean, false) then p.residence_hall_id else null end as residence_hall_id,
  case when coalesce((p.visibility->>'hometown')::boolean, false) then p.hometown else null end as hometown,
  case when coalesce((p.visibility->>'bio')::boolean, false) then p.bio else null end as bio
from public.profiles p
where p.is_synthetic = false
  and p.onboarding_completed_at is not null;

alter table public.universities enable row level security;
alter table public.university_email_domains enable row level security;
alter table public.majors enable row level security;
alter table public.residence_halls enable row level security;
alter table public.campus_locations enable row level security;
alter table public.interests enable row level security;
alter table public.profiles enable row level security;
alter table public.user_interests enable row level security;
alter table public.user_availability enable row level security;
alter table public.user_preferences enable row level security;

-- Campus catalog is public read, service-role write.
create policy universities_read on public.universities for select using (true);
create policy university_domains_read on public.university_email_domains for select using (true);
create policy majors_read on public.majors for select using (true);
create policy residence_halls_read on public.residence_halls for select using (true);
create policy campus_locations_read on public.campus_locations for select using (true);
create policy interests_read on public.interests for select using (true);

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (auth_user_id = auth.uid());

create policy profiles_select_campus on public.profiles
  for select to authenticated
  using (
    is_synthetic = false
    and onboarding_completed_at is not null
    and university_id is not distinct from public.current_university_id()
  );

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy user_interests_own on public.user_interests
  for all to authenticated
  using (user_id = public.current_profile_id())
  with check (user_id = public.current_profile_id());

create policy user_interests_campus_read on public.user_interests
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = user_interests.user_id
        and p.is_synthetic = false
        and p.university_id is not distinct from public.current_university_id()
    )
  );

create policy user_availability_own on public.user_availability
  for all to authenticated
  using (user_id = public.current_profile_id())
  with check (user_id = public.current_profile_id());

create policy user_availability_campus_read on public.user_availability
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = user_availability.user_id
        and p.is_synthetic = false
        and p.university_id is not distinct from public.current_university_id()
    )
  );

create policy user_preferences_own on public.user_preferences
  for all to authenticated
  using (user_id = public.current_profile_id())
  with check (user_id = public.current_profile_id());

revoke all on public.profiles from anon, authenticated;
grant select (
  id, auth_user_id, first_name, last_name, avatar_url, university_id,
  year, major_id, second_major_id, minor, residence_hall_id, hometown, bio,
  visibility, onboarding_completed_at, is_synthetic, created_at, updated_at
) on public.profiles to authenticated;

grant update (
  first_name, last_name, avatar_url, university_id, year, major_id,
  second_major_id, minor, residence_hall_id, hometown, bio, visibility,
  onboarding_completed_at
) on public.profiles to authenticated;

grant select on public.student_directory to authenticated;
grant select on public.universities, public.university_email_domains, public.majors,
  public.residence_halls, public.campus_locations, public.interests to anon, authenticated;
grant select, insert, update, delete on public.user_interests to authenticated;
grant select, insert, update, delete on public.user_availability to authenticated;
grant select, insert, update, delete on public.user_preferences to authenticated;
grant usage on schema public to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists avatars_public_read on storage.objects;
drop policy if exists avatars_insert_own on storage.objects;
drop policy if exists avatars_update_own on storage.objects;
drop policy if exists avatars_delete_own on storage.objects;

create policy avatars_public_read
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy avatars_insert_own
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy avatars_update_own
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy avatars_delete_own
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );
