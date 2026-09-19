-- Path 2: matching pool + circle formation RPCs.
-- Authenticated clients cannot insert other members or read others' preferences;
-- these SECURITY DEFINER helpers are the only way to form Circles.

alter table public.circles
  add column if not exists why_together text[] not null default '{}',
  add column if not exists formed_by uuid references public.profiles (id),
  add column if not exists match_score numeric,
  add column if not exists match_meta jsonb not null default '{}'::jsonb;

alter table public.circle_members
  add column if not exists status text not null default 'active';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'circle_members_status_check'
  ) then
    alter table public.circle_members
      add constraint circle_members_status_check
      check (status in ('invited', 'active'));
  end if;
end $$;

create or replace function private.is_blocked(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

create or replace function private.has_active_circle(p uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.circle_members cm
    join public.circles c on c.id = cm.circle_id
    where cm.profile_id = p
      and cm.left_at is null
      and cm.status = 'active'
      and c.is_active = true
  );
$$;

-- Matching signals for same-university eligible students (prefs included for scoring only).
create or replace function public.get_matching_pool(
  include_synthetic boolean default false
)
returns table (
  profile_id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  university_id uuid,
  year public.year_level,
  major_id uuid,
  major_name text,
  residence_hall_id uuid,
  residence_name text,
  hometown text,
  bio text,
  is_synthetic boolean,
  interest_ids uuid[],
  interest_names text[],
  availability jsonb,
  social_energy int,
  planning_style text,
  sleep_schedule text,
  group_size text,
  weekend_style text,
  looking_for text[]
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  me uuid := private.current_profile_id();
  my_uni uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select p.university_id into my_uni
  from public.profiles p
  where p.id = me;

  if my_uni is null then
    raise exception 'Complete onboarding before matching';
  end if;

  return query
  select
    p.id,
    p.first_name,
    p.last_name,
    p.avatar_url,
    p.university_id,
    p.year,
    p.major_id,
    m.name,
    p.residence_hall_id,
    h.name,
    p.hometown,
    p.bio,
    p.is_synthetic,
    coalesce((
      select array_agg(ui.interest_id order by ui.interest_id)
      from public.user_interests ui where ui.user_id = p.id
    ), '{}'::uuid[]),
    coalesce((
      select array_agg(i.name order by i.name)
      from public.user_interests ui
      join public.interests i on i.id = ui.interest_id
      where ui.user_id = p.id
    ), '{}'::text[]),
    coalesce((
      select jsonb_agg(jsonb_build_object('weekday', ua.weekday, 'time_window', ua.time_window))
      from public.user_availability ua where ua.user_id = p.id
    ), '[]'::jsonb),
    pref.social_energy,
    pref.planning_style,
    pref.sleep_schedule,
    pref.group_size,
    pref.weekend_style,
    pref.looking_for
  from public.profiles p
  left join public.majors m on m.id = p.major_id
  left join public.residence_halls h on h.id = p.residence_hall_id
  left join public.user_preferences pref on pref.user_id = p.id
  where p.university_id = my_uni
    and p.onboarding_completed_at is not null
    and p.id <> me
    and (include_synthetic or p.is_synthetic = false)
    and not private.is_blocked(me, p.id)
    and not private.has_active_circle(p.id)
    and (
      select count(*) from public.user_interests ui where ui.user_id = p.id
    ) >= 2
    and (
      select count(*) from public.user_availability ua where ua.user_id = p.id
    ) >= 1;
end;
$$;

revoke all on function public.get_matching_pool(boolean) from public;
grant execute on function public.get_matching_pool(boolean) to authenticated, service_role;

create or replace function public.form_matched_circle(
  companion_ids uuid[],
  why text[] default '{}',
  p_match_score numeric default null,
  p_match_meta jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := private.current_profile_id();
  my_uni uuid;
  new_circle uuid;
  member_id uuid;
  all_ids uuid[];
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  if companion_ids is null or cardinality(companion_ids) < 2 or cardinality(companion_ids) > 7 then
    raise exception 'Circle needs 2–7 companions';
  end if;

  select p.university_id into my_uni from public.profiles p where p.id = me;
  if my_uni is null then
    raise exception 'Complete onboarding before matching';
  end if;

  if private.has_active_circle(me) then
    raise exception 'You already have an active Circle';
  end if;

  all_ids := array_prepend(me, companion_ids);

  foreach member_id in array companion_ids loop
    if member_id = me then
      raise exception 'Invalid member list';
    end if;
    if private.is_blocked(me, member_id) then
      raise exception 'Cannot match with a blocked student';
    end if;
    if not exists (
      select 1 from public.profiles p
      where p.id = member_id
        and p.university_id = my_uni
        and p.onboarding_completed_at is not null
    ) then
      raise exception 'All members must be completed students at your university';
    end if;
    if private.has_active_circle(member_id) then
      raise exception 'A selected student already has an active Circle';
    end if;
  end loop;

  insert into public.circles (
    university_id, stage, active_member_count, is_active,
    why_together, formed_by, match_score, match_meta
  ) values (
    my_uni, 'introduced', cardinality(all_ids), true,
    coalesce(why, '{}'), me, p_match_score, coalesce(p_match_meta, '{}'::jsonb)
  )
  returning id into new_circle;

  insert into public.circle_members (circle_id, profile_id, member_role, status)
  values (new_circle, me, 'organizer', 'active');

  foreach member_id in array companion_ids loop
    insert into public.circle_members (circle_id, profile_id, member_role, status)
    values (new_circle, member_id, 'member', 'active');
  end loop;

  insert into public.matching_rounds (university_id, completed_at, notes)
  values (
    my_uni,
    now(),
    format('formed circle %s with %s companions', new_circle, cardinality(companion_ids))
  );

  return new_circle;
end;
$$;

revoke all on function public.form_matched_circle(uuid[], text[], numeric, jsonb) from public;
grant execute on function public.form_matched_circle(uuid[], text[], numeric, jsonb) to authenticated, service_role;

create or replace function public.invite_student_to_circle(invitee_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := private.current_profile_id();
  my_uni uuid;
  target_uni uuid;
  existing uuid;
  new_circle uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if invitee_id = me then
    raise exception 'Cannot invite yourself';
  end if;
  if private.is_blocked(me, invitee_id) then
    raise exception 'Cannot invite a blocked student';
  end if;

  select university_id into my_uni from public.profiles where id = me;
  select university_id into target_uni from public.profiles
  where id = invitee_id and onboarding_completed_at is not null and is_synthetic = false;

  if my_uni is null or target_uni is null or my_uni <> target_uni then
    raise exception 'Invitee must be a completed student at your university';
  end if;

  select c.id into existing
  from public.circles c
  join public.circle_members cm on cm.circle_id = c.id
  where cm.profile_id = me
    and cm.left_at is null
    and cm.status = 'active'
    and c.is_active = true
  order by c.formed_at desc
  limit 1;

  if existing is not null then
    if exists (
      select 1 from public.circle_members
      where circle_id = existing and profile_id = invitee_id and left_at is null
    ) then
      return existing;
    end if;
    insert into public.circle_members (circle_id, profile_id, member_role, status)
    values (existing, invitee_id, 'member', 'invited');
    update public.circles
      set active_member_count = (
        select count(*) from public.circle_members
        where circle_id = existing and left_at is null
      )
    where id = existing;
    return existing;
  end if;

  insert into public.circles (
    university_id, stage, active_member_count, is_active, formed_by, why_together, match_meta
  ) values (
    my_uni, 'introduced', 2, true, me,
    array['You invited someone you discovered on campus.'],
    jsonb_build_object('source', 'invite')
  )
  returning id into new_circle;

  insert into public.circle_members (circle_id, profile_id, member_role, status)
  values
    (new_circle, me, 'organizer', 'active'),
    (new_circle, invitee_id, 'member', 'invited');

  return new_circle;
end;
$$;

revoke all on function public.invite_student_to_circle(uuid) from public;
grant execute on function public.invite_student_to_circle(uuid) to authenticated, service_role;

create or replace function public.get_my_active_circle()
returns table (
  circle_id uuid,
  university_id uuid,
  stage public.circle_stage,
  formed_at timestamptz,
  why_together text[],
  match_score numeric,
  match_meta jsonb,
  members jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  me uuid := private.current_profile_id();
begin
  if me is null then
    return;
  end if;

  return query
  select
    c.id,
    c.university_id,
    c.stage,
    c.formed_at,
    c.why_together,
    c.match_score,
    c.match_meta,
    (
      select jsonb_agg(
        jsonb_build_object(
          'profile_id', p.id,
          'first_name', p.first_name,
          'last_name', case when coalesce((p.visibility->>'last_name')::boolean, false) then p.last_name else null end,
          'avatar_url', p.avatar_url,
          'year', case when coalesce((p.visibility->>'year')::boolean, true) then p.year else null end,
          'major_name', m.name,
          'residence_name', case when coalesce((p.visibility->>'residence')::boolean, false) then h.name else null end,
          'status', cm.status,
          'member_role', cm.member_role,
          'is_you', p.id = me,
          'interest_names', coalesce((
            select array_agg(i.name order by i.name)
            from public.user_interests ui
            join public.interests i on i.id = ui.interest_id
            where ui.user_id = p.id
          ), '{}'::text[])
        )
        order by (p.id = me) desc, p.first_name
      )
      from public.circle_members cm
      join public.profiles p on p.id = cm.profile_id
      left join public.majors m on m.id = p.major_id
      left join public.residence_halls h on h.id = p.residence_hall_id
      where cm.circle_id = c.id and cm.left_at is null
    ) as members
  from public.circles c
  join public.circle_members mine on mine.circle_id = c.id
  where mine.profile_id = me
    and mine.left_at is null
    and c.is_active = true
  order by c.formed_at desc
  limit 1;
end;
$$;

revoke all on function public.get_my_active_circle() from public;
grant execute on function public.get_my_active_circle() to authenticated, service_role;

grant execute on function private.is_blocked(uuid, uuid) to service_role;
grant execute on function private.has_active_circle(uuid) to service_role;
