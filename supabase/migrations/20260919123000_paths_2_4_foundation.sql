-- Paths 2–4 foundation. Empty-but-ready tables for other teams.
-- Canonical user id: public.profiles.id
-- Do not query profiles.email. Do not include is_synthetic rows in production matching.

do $$ begin
  create type public.circle_stage as enum ('introduced', 'met_once', 'met_again', 'regular');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.activity_status as enum ('upcoming', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.rsvp_status as enum ('pending', 'in', 'cant');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.hang_again as enum ('yes', 'maybe', 'no');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.community_kind as enum ('major', 'campus', 'interest');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.karma_kind as enum ('rsvp_kept', 'no_show', 'meetup_completed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.verification_method as enum ('edu_email');
exception when duplicate_object then null;
end $$;

-- Path 2: Circles / activities
create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id),
  formed_at timestamptz not null default now(),
  stage public.circle_stage not null default 'introduced',
  completed_meetups int not null default 0,
  active_member_count int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.circle_members (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  member_role text not null default 'member'
);

create unique index if not exists circle_members_active_unique
  on public.circle_members (circle_id, profile_id)
  where left_at is null;

create table if not exists public.matching_rounds (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  title text not null,
  emoji text,
  description text,
  campus_location_id uuid references public.campus_locations (id),
  location_label text,
  starts_at timestamptz,
  duration_minutes int,
  reason text,
  mood text,
  status public.activity_status not null default 'upcoming',
  created_by uuid references public.profiles (id),
  is_spontaneous boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_rsvps (
  activity_id uuid not null references public.activities (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  status public.rsvp_status not null default 'pending',
  updated_at timestamptz not null default now(),
  primary key (activity_id, profile_id)
);

create table if not exists public.activity_feedback (
  activity_id uuid not null references public.activities (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  emoji text,
  hang_again public.hang_again,
  submitted_at timestamptz not null default now(),
  primary key (activity_id, profile_id)
);

-- Path 3: communities / posts / chat
create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id),
  name text not null,
  slug text not null,
  description text,
  kind public.community_kind not null default 'campus',
  major_id uuid references public.majors (id),
  created_at timestamptz not null default now(),
  unique (university_id, slug)
);

create table if not exists public.community_members (
  community_id uuid not null references public.communities (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (community_id, profile_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references public.communities (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text,
  body text not null,
  source_url text,
  suggested_activity_id uuid references public.activities (id),
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid references public.circles (id) on delete cascade,
  community_id uuid references public.communities (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint messages_one_parent check (
    (circle_id is not null and community_id is null)
    or (circle_id is null and community_id is not null)
  )
);

-- Path 4: trust / safety
create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_no_self check (blocker_id <> blocked_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  subject_profile_id uuid references public.profiles (id) on delete set null,
  circle_id uuid references public.circles (id) on delete set null,
  activity_id uuid references public.activities (id) on delete set null,
  reason text not null,
  details text,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.karma_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kind public.karma_kind not null,
  source_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.profile_verifications (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  method public.verification_method not null default 'edu_email',
  verified_at timestamptz not null default now()
);

create index if not exists circles_university_idx on public.circles (university_id);
create index if not exists circles_active_idx on public.circles (university_id, is_active);
create index if not exists circle_members_profile_idx on public.circle_members (profile_id);
create index if not exists activities_circle_idx on public.activities (circle_id, status);
create index if not exists activity_rsvps_profile_idx on public.activity_rsvps (profile_id);
create index if not exists communities_university_idx on public.communities (university_id);
create index if not exists posts_community_idx on public.posts (community_id, created_at desc);
create index if not exists posts_author_idx on public.posts (author_id);
create index if not exists messages_circle_idx on public.messages (circle_id, created_at);
create index if not exists messages_community_idx on public.messages (community_id, created_at);
create index if not exists blocks_blocked_idx on public.blocks (blocked_id);
create index if not exists reports_reporter_idx on public.reports (reporter_id);
create index if not exists karma_events_profile_idx on public.karma_events (profile_id, created_at desc);
create index if not exists matching_rounds_university_idx on public.matching_rounds (university_id);

create or replace function public.is_circle_member(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.circle_members
    where circle_id = target
      and profile_id = public.current_profile_id()
      and left_at is null
  )
$$;

create or replace function public.is_community_member(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_members
    where community_id = target
      and profile_id = public.current_profile_id()
  )
$$;

alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.matching_rounds enable row level security;
alter table public.activities enable row level security;
alter table public.activity_rsvps enable row level security;
alter table public.activity_feedback enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.posts enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.karma_events enable row level security;
alter table public.profile_verifications enable row level security;

create policy circles_select_member on public.circles
  for select to authenticated
  using (public.is_circle_member(id));

create policy circles_insert_campus on public.circles
  for insert to authenticated
  with check (university_id = public.current_university_id());

create policy circles_update_member on public.circles
  for update to authenticated
  using (public.is_circle_member(id))
  with check (public.is_circle_member(id));

create policy circle_members_select on public.circle_members
  for select to authenticated
  using (
    profile_id = public.current_profile_id()
    or public.is_circle_member(circle_id)
  );

create policy circle_members_insert_own on public.circle_members
  for insert to authenticated
  with check (profile_id = public.current_profile_id());

create policy circle_members_update_own on public.circle_members
  for update to authenticated
  using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());

create policy matching_rounds_select on public.matching_rounds
  for select to authenticated
  using (university_id is not distinct from public.current_university_id());

create policy activities_select_member on public.activities
  for select to authenticated
  using (public.is_circle_member(circle_id));

create policy activities_insert_member on public.activities
  for insert to authenticated
  with check (
    public.is_circle_member(circle_id)
    and (created_by is null or created_by = public.current_profile_id())
  );

create policy activities_update_member on public.activities
  for update to authenticated
  using (public.is_circle_member(circle_id))
  with check (public.is_circle_member(circle_id));

create policy activity_rsvps_select_member on public.activity_rsvps
  for select to authenticated
  using (
    exists (
      select 1 from public.activities a
      where a.id = activity_id and public.is_circle_member(a.circle_id)
    )
  );

create policy activity_rsvps_write_own on public.activity_rsvps
  for all to authenticated
  using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());

create policy activity_feedback_own on public.activity_feedback
  for all to authenticated
  using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());

create policy communities_select_campus on public.communities
  for select to authenticated
  using (university_id is not distinct from public.current_university_id());

create policy community_members_select_campus on public.community_members
  for select to authenticated
  using (
    exists (
      select 1 from public.communities c
      where c.id = community_id
        and c.university_id is not distinct from public.current_university_id()
    )
  );

create policy community_members_own on public.community_members
  for all to authenticated
  using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());

create policy posts_select_campus on public.posts
  for select to authenticated
  using (
    community_id is null
    or exists (
      select 1 from public.communities c
      where c.id = community_id
        and c.university_id is not distinct from public.current_university_id()
    )
  );

create policy posts_insert_own on public.posts
  for insert to authenticated
  with check (author_id = public.current_profile_id());

create policy posts_update_own on public.posts
  for update to authenticated
  using (author_id = public.current_profile_id())
  with check (author_id = public.current_profile_id());

create policy messages_select_member on public.messages
  for select to authenticated
  using (
    (circle_id is not null and public.is_circle_member(circle_id))
    or (community_id is not null and public.is_community_member(community_id))
  );

create policy messages_insert_own on public.messages
  for insert to authenticated
  with check (
    author_id = public.current_profile_id()
    and (
      (circle_id is not null and public.is_circle_member(circle_id))
      or (community_id is not null and public.is_community_member(community_id))
    )
  );

create policy blocks_own on public.blocks
  for all to authenticated
  using (blocker_id = public.current_profile_id())
  with check (blocker_id = public.current_profile_id());

create policy reports_insert_own on public.reports
  for insert to authenticated
  with check (reporter_id = public.current_profile_id());

create policy reports_select_own on public.reports
  for select to authenticated
  using (reporter_id = public.current_profile_id());

create policy karma_events_select_own on public.karma_events
  for select to authenticated
  using (profile_id = public.current_profile_id());

create policy profile_verifications_select_own on public.profile_verifications
  for select to authenticated
  using (profile_id = public.current_profile_id());

grant select, insert, update on public.circles to authenticated;
grant select, insert, update on public.circle_members to authenticated;
grant select on public.matching_rounds to authenticated;
grant select, insert, update on public.activities to authenticated;
grant select, insert, update, delete on public.activity_rsvps to authenticated;
grant select, insert, update, delete on public.activity_feedback to authenticated;
grant select on public.communities to authenticated;
grant select, insert, update, delete on public.community_members to authenticated;
grant select, insert, update on public.posts to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert, update, delete on public.blocks to authenticated;
grant select, insert on public.reports to authenticated;
grant select on public.karma_events to authenticated;
grant select on public.profile_verifications to authenticated;
