-- Move RLS helpers off the exposed public schema, tighten grants,
-- add FK indexes, and record .edu verification on signup.

create or replace function private.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where auth_user_id = (select auth.uid())
$$;

create or replace function private.current_university_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select university_id from public.profiles where auth_user_id = (select auth.uid())
$$;

create or replace function private.is_circle_member(target uuid)
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
      and profile_id = private.current_profile_id()
      and left_at is null
  )
$$;

create or replace function private.is_community_member(target uuid)
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
      and profile_id = private.current_profile_id()
  )
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.protect_profile_identity()
returns trigger
language plpgsql
set search_path = public
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

create or replace function private.canonical_email_domain(raw text)
returns text
language sql
immutable
set search_path = public
as $$
  select regexp_replace(lower(raw), '^(student|students|mail|email|alumni|my)\.', '')
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_profile_id uuid;
  uni uuid;
begin
  if new.email is null or new.email !~* '@[^@]+\.edu$' then
    raise exception 'Circle accounts require a .edu email';
  end if;

  uni := private.match_university_id(new.email);

  insert into public.profiles (auth_user_id, email, university_id)
  values (new.id, new.email, uni)
  returning id into new_profile_id;

  insert into public.user_preferences (user_id)
  values (new_profile_id);

  insert into public.profile_verifications (profile_id, method)
  values (new_profile_id, 'edu_email')
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_select_campus on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists user_interests_own on public.user_interests;
drop policy if exists user_interests_campus_read on public.user_interests;
drop policy if exists user_availability_own on public.user_availability;
drop policy if exists user_availability_campus_read on public.user_availability;
drop policy if exists user_preferences_own on public.user_preferences;
drop policy if exists circles_select_member on public.circles;
drop policy if exists circles_insert_campus on public.circles;
drop policy if exists circles_update_member on public.circles;
drop policy if exists circle_members_select on public.circle_members;
drop policy if exists circle_members_insert_own on public.circle_members;
drop policy if exists circle_members_update_own on public.circle_members;
drop policy if exists matching_rounds_select on public.matching_rounds;
drop policy if exists activities_select_member on public.activities;
drop policy if exists activities_insert_member on public.activities;
drop policy if exists activities_update_member on public.activities;
drop policy if exists activity_rsvps_select_member on public.activity_rsvps;
drop policy if exists activity_rsvps_write_own on public.activity_rsvps;
drop policy if exists activity_feedback_own on public.activity_feedback;
drop policy if exists communities_select_campus on public.communities;
drop policy if exists community_members_select_campus on public.community_members;
drop policy if exists community_members_own on public.community_members;
drop policy if exists posts_select_campus on public.posts;
drop policy if exists posts_insert_own on public.posts;
drop policy if exists posts_update_own on public.posts;
drop policy if exists messages_select_member on public.messages;
drop policy if exists messages_insert_own on public.messages;
drop policy if exists blocks_own on public.blocks;
drop policy if exists reports_insert_own on public.reports;
drop policy if exists reports_select_own on public.reports;
drop policy if exists karma_events_select_own on public.karma_events;
drop policy if exists profile_verifications_select_own on public.profile_verifications;

drop function if exists public.current_profile_id();
drop function if exists public.current_university_id();
drop function if exists public.is_circle_member(uuid);
drop function if exists public.is_community_member(uuid);

create policy profiles_select on public.profiles
  for select to authenticated
  using (
    auth_user_id = (select auth.uid())
    or (
      is_synthetic = false
      and onboarding_completed_at is not null
      and university_id is not distinct from (select private.current_university_id())
    )
  );

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth_user_id = (select auth.uid()))
  with check (auth_user_id = (select auth.uid()));

create policy user_interests_select on public.user_interests
  for select to authenticated
  using (
    user_id = (select private.current_profile_id())
    or exists (
      select 1 from public.profiles p
      where p.id = user_interests.user_id
        and p.is_synthetic = false
        and p.university_id is not distinct from (select private.current_university_id())
    )
  );

create policy user_interests_insert_own on public.user_interests
  for insert to authenticated
  with check (user_id = (select private.current_profile_id()));

create policy user_interests_update_own on public.user_interests
  for update to authenticated
  using (user_id = (select private.current_profile_id()))
  with check (user_id = (select private.current_profile_id()));

create policy user_interests_delete_own on public.user_interests
  for delete to authenticated
  using (user_id = (select private.current_profile_id()));

create policy user_availability_select on public.user_availability
  for select to authenticated
  using (
    user_id = (select private.current_profile_id())
    or exists (
      select 1 from public.profiles p
      where p.id = user_availability.user_id
        and p.is_synthetic = false
        and p.university_id is not distinct from (select private.current_university_id())
    )
  );

create policy user_availability_insert_own on public.user_availability
  for insert to authenticated
  with check (user_id = (select private.current_profile_id()));

create policy user_availability_update_own on public.user_availability
  for update to authenticated
  using (user_id = (select private.current_profile_id()))
  with check (user_id = (select private.current_profile_id()));

create policy user_availability_delete_own on public.user_availability
  for delete to authenticated
  using (user_id = (select private.current_profile_id()));

create policy user_preferences_own on public.user_preferences
  for all to authenticated
  using (user_id = (select private.current_profile_id()))
  with check (user_id = (select private.current_profile_id()));

create policy circles_select_member on public.circles
  for select to authenticated
  using (private.is_circle_member(id));

create policy circles_insert_campus on public.circles
  for insert to authenticated
  with check (university_id = (select private.current_university_id()));

create policy circles_update_member on public.circles
  for update to authenticated
  using (private.is_circle_member(id))
  with check (private.is_circle_member(id));

create policy circle_members_select on public.circle_members
  for select to authenticated
  using (
    profile_id = (select private.current_profile_id())
    or private.is_circle_member(circle_id)
  );

create policy circle_members_insert_own on public.circle_members
  for insert to authenticated
  with check (profile_id = (select private.current_profile_id()));

create policy circle_members_update_own on public.circle_members
  for update to authenticated
  using (profile_id = (select private.current_profile_id()))
  with check (profile_id = (select private.current_profile_id()));

create policy matching_rounds_select on public.matching_rounds
  for select to authenticated
  using (university_id is not distinct from (select private.current_university_id()));

create policy activities_select_member on public.activities
  for select to authenticated
  using (private.is_circle_member(circle_id));

create policy activities_insert_member on public.activities
  for insert to authenticated
  with check (
    private.is_circle_member(circle_id)
    and (created_by is null or created_by = (select private.current_profile_id()))
  );

create policy activities_update_member on public.activities
  for update to authenticated
  using (private.is_circle_member(circle_id))
  with check (private.is_circle_member(circle_id));

create policy activity_rsvps_select_member on public.activity_rsvps
  for select to authenticated
  using (
    exists (
      select 1 from public.activities a
      where a.id = activity_id and private.is_circle_member(a.circle_id)
    )
  );

create policy activity_rsvps_insert_own on public.activity_rsvps
  for insert to authenticated
  with check (profile_id = (select private.current_profile_id()));

create policy activity_rsvps_update_own on public.activity_rsvps
  for update to authenticated
  using (profile_id = (select private.current_profile_id()))
  with check (profile_id = (select private.current_profile_id()));

create policy activity_rsvps_delete_own on public.activity_rsvps
  for delete to authenticated
  using (profile_id = (select private.current_profile_id()));

create policy activity_feedback_select_own on public.activity_feedback
  for select to authenticated
  using (profile_id = (select private.current_profile_id()));

create policy activity_feedback_insert_own on public.activity_feedback
  for insert to authenticated
  with check (profile_id = (select private.current_profile_id()));

create policy activity_feedback_update_own on public.activity_feedback
  for update to authenticated
  using (profile_id = (select private.current_profile_id()))
  with check (profile_id = (select private.current_profile_id()));

create policy activity_feedback_delete_own on public.activity_feedback
  for delete to authenticated
  using (profile_id = (select private.current_profile_id()));

create policy communities_select_campus on public.communities
  for select to authenticated
  using (university_id is not distinct from (select private.current_university_id()));

create policy community_members_select_campus on public.community_members
  for select to authenticated
  using (
    exists (
      select 1 from public.communities c
      where c.id = community_id
        and c.university_id is not distinct from (select private.current_university_id())
    )
  );

create policy community_members_insert_own on public.community_members
  for insert to authenticated
  with check (profile_id = (select private.current_profile_id()));

create policy community_members_update_own on public.community_members
  for update to authenticated
  using (profile_id = (select private.current_profile_id()))
  with check (profile_id = (select private.current_profile_id()));

create policy community_members_delete_own on public.community_members
  for delete to authenticated
  using (profile_id = (select private.current_profile_id()));

create policy posts_select_campus on public.posts
  for select to authenticated
  using (
    community_id is null
    or exists (
      select 1 from public.communities c
      where c.id = community_id
        and c.university_id is not distinct from (select private.current_university_id())
    )
  );

create policy posts_insert_own on public.posts
  for insert to authenticated
  with check (author_id = (select private.current_profile_id()));

create policy posts_update_own on public.posts
  for update to authenticated
  using (author_id = (select private.current_profile_id()))
  with check (author_id = (select private.current_profile_id()));

create policy messages_select_member on public.messages
  for select to authenticated
  using (
    (circle_id is not null and private.is_circle_member(circle_id))
    or (community_id is not null and private.is_community_member(community_id))
  );

create policy messages_insert_own on public.messages
  for insert to authenticated
  with check (
    author_id = (select private.current_profile_id())
    and (
      (circle_id is not null and private.is_circle_member(circle_id))
      or (community_id is not null and private.is_community_member(community_id))
    )
  );

create policy blocks_select_own on public.blocks
  for select to authenticated
  using (blocker_id = (select private.current_profile_id()));

create policy blocks_insert_own on public.blocks
  for insert to authenticated
  with check (blocker_id = (select private.current_profile_id()));

create policy blocks_delete_own on public.blocks
  for delete to authenticated
  using (blocker_id = (select private.current_profile_id()));

create policy reports_insert_own on public.reports
  for insert to authenticated
  with check (reporter_id = (select private.current_profile_id()));

create policy reports_select_own on public.reports
  for select to authenticated
  using (reporter_id = (select private.current_profile_id()));

create policy karma_events_select_own on public.karma_events
  for select to authenticated
  using (profile_id = (select private.current_profile_id()));

create policy profile_verifications_select_own on public.profile_verifications
  for select to authenticated
  using (profile_id = (select private.current_profile_id()));

revoke all on function private.current_profile_id() from public, anon;
revoke all on function private.current_university_id() from public, anon;
revoke all on function private.is_circle_member(uuid) from public, anon;
revoke all on function private.is_community_member(uuid) from public, anon;

grant usage on schema private to authenticated, service_role, supabase_auth_admin, postgres;
grant execute on function private.current_profile_id() to authenticated, service_role;
grant execute on function private.current_university_id() to authenticated, service_role;
grant execute on function private.is_circle_member(uuid) to authenticated, service_role;
grant execute on function private.is_community_member(uuid) to authenticated, service_role;

create index if not exists activities_campus_location_idx on public.activities (campus_location_id);
create index if not exists activities_created_by_idx on public.activities (created_by);
create index if not exists activity_feedback_profile_idx on public.activity_feedback (profile_id);
create index if not exists communities_major_idx on public.communities (major_id);
create index if not exists community_members_profile_idx on public.community_members (profile_id);
create index if not exists messages_author_idx on public.messages (author_id);
create index if not exists posts_suggested_activity_idx on public.posts (suggested_activity_id);
create index if not exists profiles_major_idx on public.profiles (major_id);
create index if not exists profiles_residence_hall_idx on public.profiles (residence_hall_id);
create index if not exists profiles_second_major_idx on public.profiles (second_major_id);
create index if not exists reports_activity_idx on public.reports (activity_id);
create index if not exists reports_circle_idx on public.reports (circle_id);
create index if not exists reports_subject_profile_idx on public.reports (subject_profile_id);
