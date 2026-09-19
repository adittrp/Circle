-- Product Path 4: campus communities, feed interactions, notifications, post→plan/circle.

-- ---------------------------------------------------------------------------
-- Communities extensions
-- ---------------------------------------------------------------------------
alter table public.communities
  add column if not exists residence_hall_id uuid references public.residence_halls (id) on delete set null,
  add column if not exists interest_id uuid references public.interests (id) on delete set null,
  add column if not exists year public.year_level,
  add column if not exists class_label text,
  add column if not exists created_by uuid references public.profiles (id) on delete set null,
  add column if not exists is_auto boolean not null default false,
  add column if not exists is_discoverable boolean not null default true,
  add column if not exists rules text,
  add column if not exists member_limit int check (member_limit is null or member_limit > 1),
  add column if not exists constraint_year public.year_level,
  add column if not exists constraint_major_id uuid references public.majors (id) on delete set null,
  add column if not exists constraint_residence_hall_id uuid references public.residence_halls (id) on delete set null;

alter table public.community_members
  add column if not exists member_role text not null default 'member';

-- ---------------------------------------------------------------------------
-- Posts extensions
-- ---------------------------------------------------------------------------
alter table public.posts
  add column if not exists category text,
  add column if not exists intent public.post_intent,
  add column if not exists suggested_circle_id uuid references public.circles (id) on delete set null,
  add column if not exists university_id uuid references public.universities (id) on delete cascade,
  add column if not exists comment_count int not null default 0,
  add column if not exists vote_score int not null default 0,
  add column if not exists updated_at timestamptz not null default now();

-- Backfill university_id from community when possible
update public.posts p
set university_id = c.university_id
from public.communities c
where p.community_id = c.id
  and p.university_id is null;

create index if not exists posts_university_created_idx
  on public.posts (university_id, created_at desc);
create index if not exists posts_vote_score_idx
  on public.posts (university_id, vote_score desc, created_at desc);
create index if not exists communities_kind_idx
  on public.communities (university_id, kind);
create index if not exists communities_major_idx
  on public.communities (major_id)
  where major_id is not null;
create index if not exists communities_residence_idx
  on public.communities (residence_hall_id)
  where residence_hall_id is not null;
create index if not exists communities_interest_idx
  on public.communities (interest_id)
  where interest_id is not null;

-- ---------------------------------------------------------------------------
-- Comments / votes / saves
-- ---------------------------------------------------------------------------
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.post_comments (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists post_comments_post_idx
  on public.post_comments (post_id, created_at);

create table if not exists public.post_votes (
  post_id uuid not null references public.posts (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);

create table if not exists public.post_saves (
  post_id uuid not null references public.posts (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);

-- ---------------------------------------------------------------------------
-- Notifications (shared architecture for Paths 2–5)
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  kind public.notification_kind not null default 'system',
  title text not null,
  body text,
  post_id uuid references public.posts (id) on delete cascade,
  community_id uuid references public.communities (id) on delete cascade,
  circle_id uuid references public.circles (id) on delete cascade,
  activity_id uuid references public.activities (id) on delete cascade,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications (recipient_id)
  where read_at is null;

-- Report hooks for Path 5
alter table public.reports
  add column if not exists post_id uuid references public.posts (id) on delete set null,
  add column if not exists community_id uuid references public.communities (id) on delete set null;

-- Optional circle title for post-originated circles (does not change Path 3 engine)
alter table public.circles
  add column if not exists title text,
  add column if not exists source_post_id uuid references public.posts (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function private.slugify(raw text)
returns text
language sql
immutable
set search_path = public
as $$
  select nullif(
    trim(both '-' from regexp_replace(
      lower(regexp_replace(coalesce(raw, ''), '[^a-zA-Z0-9]+', '-', 'g')),
      '-{2,}',
      '-',
      'g'
    )),
    ''
  );
$$;

create or replace function private.can_view_community(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.communities c
    where c.id = target
      and c.university_id is not distinct from private.current_university_id()
      and (
        c.is_discoverable
        or c.is_auto
        or private.is_community_member(c.id)
        or c.created_by = private.current_profile_id()
      )
  );
$$;

create or replace function private.passes_community_constraints(
  p_community_id uuid,
  p_profile_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.communities c
    join public.profiles p on p.id = p_profile_id
    where c.id = p_community_id
      and p.university_id = c.university_id
      and (c.constraint_year is null or p.year = c.constraint_year)
      and (c.constraint_major_id is null or p.major_id = c.constraint_major_id or p.second_major_id = c.constraint_major_id)
      and (c.constraint_residence_hall_id is null or p.residence_hall_id = c.constraint_residence_hall_id)
  );
$$;

create or replace function private.ensure_community(
  p_university_id uuid,
  p_kind public.community_kind,
  p_name text,
  p_slug text,
  p_description text default null,
  p_major_id uuid default null,
  p_residence_hall_id uuid default null,
  p_interest_id uuid default null,
  p_year public.year_level default null,
  p_class_label text default null,
  p_is_auto boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  final_slug text := coalesce(nullif(private.slugify(p_slug), ''), private.slugify(p_name), gen_random_uuid()::text);
begin
  select id into cid
  from public.communities
  where university_id = p_university_id
    and slug = final_slug;

  if cid is not null then
    return cid;
  end if;

  insert into public.communities (
    university_id, name, slug, description, kind,
    major_id, residence_hall_id, interest_id, year, class_label,
    is_auto, is_discoverable
  )
  values (
    p_university_id, p_name, final_slug, p_description, p_kind,
    p_major_id, p_residence_hall_id, p_interest_id, p_year, p_class_label,
    p_is_auto, true
  )
  on conflict (university_id, slug) do update
    set name = excluded.name
  returning id into cid;

  return cid;
end;
$$;

create or replace function private.join_community_if_allowed(
  p_community_id uuid,
  p_profile_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  member_count int;
  lim int;
begin
  if not private.passes_community_constraints(p_community_id, p_profile_id) then
    return;
  end if;

  select member_limit into lim from public.communities where id = p_community_id;
  if lim is not null then
    select count(*) into member_count from public.community_members where community_id = p_community_id;
    if member_count >= lim then
      return;
    end if;
  end if;

  insert into public.community_members (community_id, profile_id)
  values (p_community_id, p_profile_id)
  on conflict do nothing;
end;
$$;

create or replace function public.sync_my_communities()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid := private.current_profile_id();
  p public.profiles%rowtype;
  uni public.universities%rowtype;
  major_name text;
  hall_name text;
  cid uuid;
  joined uuid[] := '{}';
  interest_rec record;
begin
  if pid is null then
    raise exception 'Not authenticated';
  end if;

  select * into p from public.profiles where id = pid;
  if p.university_id is null then
    return jsonb_build_object('joined', joined);
  end if;

  select * into uni from public.universities where id = p.university_id;

  -- University / campus
  cid := private.ensure_community(
    p.university_id, 'campus', uni.name, uni.slug,
    'Campus-wide community for ' || uni.name
  );
  perform private.join_community_if_allowed(cid, pid);
  joined := array_append(joined, cid);

  -- Major
  if p.major_id is not null then
    select name into major_name from public.majors where id = p.major_id;
    cid := private.ensure_community(
      p.university_id, 'major', major_name, 'major-' || private.slugify(major_name),
      major_name || ' students at ' || uni.abbreviation,
      p.major_id
    );
    perform private.join_community_if_allowed(cid, pid);
    joined := array_append(joined, cid);
  end if;

  -- Year cohort
  if p.year is not null then
    cid := private.ensure_community(
      p.university_id, 'year', p.year::text || 's', 'year-' || lower(p.year::text),
      p.year::text || ' cohort at ' || uni.abbreviation,
      null, null, null, p.year
    );
    perform private.join_community_if_allowed(cid, pid);
    joined := array_append(joined, cid);
  end if;

  -- Residence (never expose room numbers — hall only)
  if p.residence_hall_id is not null then
    select name into hall_name from public.residence_halls where id = p.residence_hall_id;
    cid := private.ensure_community(
      p.university_id, 'residence', hall_name, 'residence-' || private.slugify(hall_name),
      'Neighbors in ' || hall_name,
      null, p.residence_hall_id
    );
    perform private.join_community_if_allowed(cid, pid);
    joined := array_append(joined, cid);
  end if;

  -- Interest communities (auto-discover + join selected)
  for interest_rec in
    select i.id, i.name, i.slug
    from public.user_interests ui
    join public.interests i on i.id = ui.interest_id
    where ui.user_id = pid
  loop
    cid := private.ensure_community(
      p.university_id, 'interest', interest_rec.name, 'interest-' || interest_rec.slug,
      interest_rec.name || ' at ' || uni.abbreviation,
      null, null, interest_rec.id
    );
    perform private.join_community_if_allowed(cid, pid);
    joined := array_append(joined, cid);
  end loop;

  return jsonb_build_object('joined', to_jsonb(joined));
end;
$$;

create or replace function public.create_campus_group(
  p_name text,
  p_description text default null,
  p_rules text default null,
  p_is_discoverable boolean default true,
  p_member_limit int default null,
  p_interest_id uuid default null,
  p_constraint_year public.year_level default null,
  p_constraint_major_id uuid default null,
  p_constraint_residence_hall_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid := private.current_profile_id();
  uni uuid := private.current_university_id();
  cid uuid;
  base_slug text;
  final_slug text;
  n int := 0;
begin
  if pid is null or uni is null then
    raise exception 'Complete onboarding before creating a group';
  end if;
  if char_length(trim(p_name)) < 3 then
    raise exception 'Group name is too short';
  end if;

  base_slug := coalesce(private.slugify(p_name), 'group');
  final_slug := base_slug;
  while exists (
    select 1 from public.communities where university_id = uni and slug = final_slug
  ) loop
    n := n + 1;
    final_slug := base_slug || '-' || n::text;
  end loop;

  insert into public.communities (
    university_id, name, slug, description, kind, interest_id,
    created_by, is_auto, is_discoverable, rules, member_limit,
    constraint_year, constraint_major_id, constraint_residence_hall_id
  )
  values (
    uni, trim(p_name), final_slug, p_description, 'custom', p_interest_id,
    pid, false, coalesce(p_is_discoverable, true), p_rules, p_member_limit,
    p_constraint_year, p_constraint_major_id, p_constraint_residence_hall_id
  )
  returning id into cid;

  insert into public.community_members (community_id, profile_id, member_role)
  values (cid, pid, 'owner');

  return cid;
end;
$$;

create or replace function public.create_plan_from_post(
  p_post_id uuid,
  p_title text default null,
  p_location_label text default null,
  p_starts_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pid uuid := private.current_profile_id();
  post_row public.posts%rowtype;
  v_circle_id uuid;
  v_activity_id uuid;
  v_title text;
begin
  if v_pid is null then raise exception 'Not authenticated'; end if;

  select * into post_row from public.posts where id = p_post_id;
  if not found then raise exception 'Post not found'; end if;
  if post_row.author_id <> v_pid then raise exception 'Only the author can start a plan'; end if;
  if post_row.university_id is distinct from private.current_university_id() then
    raise exception 'Wrong campus';
  end if;

  v_title := coalesce(nullif(trim(p_title), ''), nullif(trim(post_row.title), ''), left(post_row.body, 80));

  if post_row.suggested_circle_id is not null then
    v_circle_id := post_row.suggested_circle_id;
  else
    insert into public.circles (university_id, title, source_post_id, active_member_count)
    values (post_row.university_id, v_title, post_row.id, 1)
    returning id into v_circle_id;

    insert into public.circle_members (circle_id, profile_id, member_role)
    select v_circle_id, v_pid, 'member'
    where not exists (
      select 1 from public.circle_members cm
      where cm.circle_id = v_circle_id and cm.profile_id = v_pid and cm.left_at is null
    );

    update public.posts set suggested_circle_id = v_circle_id where id = post_row.id;
  end if;

  insert into public.activities (
    circle_id, title, description, location_label, starts_at, created_by, reason
  )
  values (
    v_circle_id,
    v_title,
    post_row.body,
    p_location_label,
    p_starts_at,
    v_pid,
    'Created from campus post'
  )
  returning id into v_activity_id;

  insert into public.activity_rsvps (activity_id, profile_id, status)
  values (v_activity_id, v_pid, 'in')
  on conflict do nothing;

  update public.posts
  set suggested_activity_id = v_activity_id, intent = coalesce(intent, 'plan_idea')
  where id = post_row.id;

  -- Notify people who voted interested (except author)
  insert into public.notifications (recipient_id, actor_id, kind, title, body, post_id, circle_id, activity_id, href)
  select
    pv.profile_id, v_pid, 'post_became_plan',
    'A plan started from a post you liked',
    v_title,
    post_row.id, v_circle_id, v_activity_id,
    '/campus/post/' || post_row.id::text
  from public.post_votes pv
  where pv.post_id = post_row.id
    and pv.profile_id <> v_pid
    and pv.value = 1;

  return jsonb_build_object(
    'circle_id', v_circle_id,
    'activity_id', v_activity_id
  );
end;
$$;

create or replace function public.create_circle_from_post(
  p_post_id uuid,
  p_title text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pid uuid := private.current_profile_id();
  post_row public.posts%rowtype;
  v_circle_id uuid;
  v_title text;
  v_member_count int := 1;
begin
  if v_pid is null then raise exception 'Not authenticated'; end if;

  select * into post_row from public.posts where id = p_post_id;
  if not found then raise exception 'Post not found'; end if;
  if post_row.author_id <> v_pid then raise exception 'Only the author can create a Circle'; end if;
  if post_row.suggested_circle_id is not null then
    return jsonb_build_object('circle_id', post_row.suggested_circle_id, 'already_exists', true);
  end if;

  v_title := coalesce(nullif(trim(p_title), ''), nullif(trim(post_row.title), ''), left(post_row.body, 80));

  insert into public.circles (university_id, title, source_post_id, active_member_count)
  values (post_row.university_id, v_title, post_row.id, 1)
  returning id into v_circle_id;

  insert into public.circle_members (circle_id, profile_id, member_role)
  select v_circle_id, v_pid, 'member'
  where not exists (
    select 1 from public.circle_members cm
    where cm.circle_id = v_circle_id and cm.profile_id = v_pid and cm.left_at is null
  );

  -- Add interested voters as members (cap small Circle size)
  insert into public.circle_members (circle_id, profile_id, member_role)
  select v_circle_id, pv.profile_id, 'member'
  from public.post_votes pv
  where pv.post_id = post_row.id
    and pv.value = 1
    and pv.profile_id <> v_pid
    and not exists (
      select 1 from public.circle_members cm
      where cm.circle_id = v_circle_id and cm.profile_id = pv.profile_id and cm.left_at is null
    )
  order by pv.created_at
  limit 7;

  select count(*) into v_member_count
  from public.circle_members cm
  where cm.circle_id = v_circle_id and cm.left_at is null;

  update public.circles set active_member_count = v_member_count where id = v_circle_id;

  update public.posts
  set suggested_circle_id = v_circle_id, intent = coalesce(intent, 'looking_for_people')
  where id = post_row.id;

  insert into public.notifications (recipient_id, actor_id, kind, title, body, post_id, circle_id, href)
  select
    cm.profile_id, v_pid, 'post_became_circle',
    'Your interest became a Circle',
    v_title,
    post_row.id, v_circle_id,
    '/campus/post/' || post_row.id::text
  from public.circle_members cm
  where cm.circle_id = v_circle_id
    and cm.profile_id <> v_pid
    and cm.left_at is null;

  return jsonb_build_object('circle_id', v_circle_id, 'member_count', v_member_count);
end;
$$;

create or replace function public.campus_search(p_query text, p_limit int default 8)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  q text := trim(coalesce(p_query, ''));
  uni uuid := private.current_university_id();
  lim int := least(greatest(coalesce(p_limit, 8), 1), 20);
begin
  if uni is null or char_length(q) < 2 then
    return jsonb_build_object('people', '[]'::jsonb, 'communities', '[]'::jsonb, 'circles', '[]'::jsonb, 'posts', '[]'::jsonb);
  end if;

  return jsonb_build_object(
    'people', coalesce((
      select jsonb_agg(row_to_json(x))
      from (
        select
          d.id,
          d.first_name,
          d.avatar_url,
          d.year,
          m.name as major_name,
          rh.name as residence_name
        from public.student_directory d
        left join public.majors m on m.id = d.major_id
        left join public.residence_halls rh on rh.id = d.residence_hall_id
        where d.university_id = uni
          and (
            d.first_name ilike '%' || q || '%'
            or coalesce(m.name, '') ilike '%' || q || '%'
            or coalesce(rh.name, '') ilike '%' || q || '%'
            or coalesce(d.bio, '') ilike '%' || q || '%'
          )
        order by d.first_name
        limit lim
      ) x
    ), '[]'::jsonb),
    'communities', coalesce((
      select jsonb_agg(row_to_json(x))
      from (
        select c.id, c.name, c.slug, c.kind, c.description
        from public.communities c
        where c.university_id = uni
          and private.can_view_community(c.id)
          and (c.name ilike '%' || q || '%' or coalesce(c.description, '') ilike '%' || q || '%')
        order by c.name
        limit lim
      ) x
    ), '[]'::jsonb),
    'circles', coalesce((
      select jsonb_agg(row_to_json(x))
      from (
        select cir.id, cir.title, cir.stage, cir.active_member_count
        from public.circles cir
        where cir.university_id = uni
          and cir.is_active
          and private.is_circle_member(cir.id)
          and coalesce(cir.title, '') ilike '%' || q || '%'
        order by cir.formed_at desc
        limit lim
      ) x
    ), '[]'::jsonb),
    'posts', coalesce((
      select jsonb_agg(row_to_json(x))
      from (
        select p.id, p.title, p.body, p.created_at, p.community_id, p.vote_score
        from public.posts p
        where p.university_id = uni
          and (p.title ilike '%' || q || '%' or p.body ilike '%' || q || '%')
        order by p.created_at desc
        limit lim
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Counters + notifications triggers
-- ---------------------------------------------------------------------------
create or replace function private.bump_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1, updated_at = now() where id = new.post_id;
    insert into public.notifications (recipient_id, actor_id, kind, title, body, post_id, href)
    select
      p.author_id, new.author_id, 'post_reply',
      'Someone replied to your post',
      left(new.body, 140),
      new.post_id,
      '/campus/post/' || new.post_id::text
    from public.posts p
    where p.id = new.post_id
      and p.author_id <> new.author_id;
  elsif tg_op = 'DELETE' then
    update public.posts set comment_count = greatest(comment_count - 1, 0), updated_at = now() where id = old.post_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists post_comments_count on public.post_comments;
create trigger post_comments_count
after insert or delete on public.post_comments
for each row execute function private.bump_post_comment_count();

create or replace function private.bump_post_vote_score()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set vote_score = vote_score + new.value, updated_at = now() where id = new.post_id;
    if new.value = 1 then
      insert into public.notifications (recipient_id, actor_id, kind, title, body, post_id, href)
      select
        p.author_id, new.profile_id, 'post_interest',
        'Someone is interested in your post',
        coalesce(p.title, left(p.body, 80)),
        new.post_id,
        '/campus/post/' || new.post_id::text
      from public.posts p
      where p.id = new.post_id
        and p.author_id <> new.profile_id;
    end if;
  elsif tg_op = 'DELETE' then
    update public.posts set vote_score = vote_score - old.value, updated_at = now() where id = old.post_id;
  elsif tg_op = 'UPDATE' then
    update public.posts set vote_score = vote_score - old.value + new.value, updated_at = now() where id = new.post_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists post_votes_score on public.post_votes;
create trigger post_votes_score
after insert or update or delete on public.post_votes
for each row execute function private.bump_post_vote_score();

create or replace function private.set_post_university()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.university_id is null then
    if new.community_id is not null then
      select university_id into new.university_id from public.communities where id = new.community_id;
    else
      new.university_id := private.current_university_id();
    end if;
  end if;
  -- Only enforce campus match for real authenticated sessions
  if auth.uid() is not null
     and private.current_university_id() is not null
     and new.university_id is distinct from private.current_university_id() then
    raise exception 'Posts must stay on your campus';
  end if;
  return new;
end;
$$;

drop trigger if exists posts_set_university on public.posts;
create trigger posts_set_university
before insert or update on public.posts
for each row execute function private.set_post_university();

-- Auto-sync communities when onboarding completes / profile campus fields change
create or replace function private.profiles_sync_communities()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.onboarding_completed_at is not null
     and new.university_id is not null
     and (
       tg_op = 'INSERT'
       or old.onboarding_completed_at is distinct from new.onboarding_completed_at
       or old.major_id is distinct from new.major_id
       or old.residence_hall_id is distinct from new.residence_hall_id
       or old.year is distinct from new.year
       or old.university_id is distinct from new.university_id
     ) then
    perform set_config('request.jwt.claim.sub', coalesce(new.auth_user_id::text, ''), true);
    -- Call ensure logic directly without relying on auth.uid()
    perform private.sync_communities_for_profile(new.id);
  end if;
  return new;
end;
$$;

create or replace function private.sync_communities_for_profile(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.profiles%rowtype;
  uni public.universities%rowtype;
  major_name text;
  hall_name text;
  cid uuid;
  interest_rec record;
begin
  select * into p from public.profiles where id = p_profile_id;
  if p.university_id is null then return; end if;
  select * into uni from public.universities where id = p.university_id;

  cid := private.ensure_community(p.university_id, 'campus', uni.name, uni.slug, 'Campus-wide community for ' || uni.name);
  perform private.join_community_if_allowed(cid, p_profile_id);

  if p.major_id is not null then
    select name into major_name from public.majors where id = p.major_id;
    cid := private.ensure_community(p.university_id, 'major', major_name, 'major-' || private.slugify(major_name), major_name || ' students at ' || uni.abbreviation, p.major_id);
    perform private.join_community_if_allowed(cid, p_profile_id);
  end if;

  if p.year is not null then
    cid := private.ensure_community(p.university_id, 'year', p.year::text || 's', 'year-' || lower(p.year::text), p.year::text || ' cohort at ' || uni.abbreviation, null, null, null, p.year);
    perform private.join_community_if_allowed(cid, p_profile_id);
  end if;

  if p.residence_hall_id is not null then
    select name into hall_name from public.residence_halls where id = p.residence_hall_id;
    cid := private.ensure_community(p.university_id, 'residence', hall_name, 'residence-' || private.slugify(hall_name), 'Neighbors in ' || hall_name, null, p.residence_hall_id);
    perform private.join_community_if_allowed(cid, p_profile_id);
  end if;

  for interest_rec in
    select i.id, i.name, i.slug
    from public.user_interests ui
    join public.interests i on i.id = ui.interest_id
    where ui.user_id = p_profile_id
  loop
    cid := private.ensure_community(p.university_id, 'interest', interest_rec.name, 'interest-' || interest_rec.slug, interest_rec.name || ' at ' || uni.abbreviation, null, null, interest_rec.id);
    perform private.join_community_if_allowed(cid, p_profile_id);
  end loop;
end;
$$;

-- Rewrite public.sync_my_communities to use shared helper
create or replace function public.sync_my_communities()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid := private.current_profile_id();
begin
  if pid is null then raise exception 'Not authenticated'; end if;
  perform private.sync_communities_for_profile(pid);
  return jsonb_build_object(
    'joined', coalesce((
      select jsonb_agg(community_id)
      from public.community_members
      where profile_id = pid
    ), '[]'::jsonb)
  );
end;
$$;

drop trigger if exists profiles_sync_communities on public.profiles;
create trigger profiles_sync_communities
after insert or update of onboarding_completed_at, major_id, residence_hall_id, year, university_id
on public.profiles
for each row execute function private.profiles_sync_communities();

create or replace function private.user_interests_sync_communities()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform private.sync_communities_for_profile(coalesce(new.user_id, old.user_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists user_interests_sync_communities on public.user_interests;
create trigger user_interests_sync_communities
after insert or delete on public.user_interests
for each row execute function private.user_interests_sync_communities();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.post_comments enable row level security;
alter table public.post_votes enable row level security;
alter table public.post_saves enable row level security;
alter table public.notifications enable row level security;

drop policy if exists communities_select_campus on public.communities;
create policy communities_select_campus on public.communities
  for select to authenticated
  using (
    university_id is not distinct from private.current_university_id()
    and (
      is_discoverable
      or is_auto
      or created_by = private.current_profile_id()
      or private.is_community_member(id)
    )
  );

drop policy if exists communities_insert_custom on public.communities;
create policy communities_insert_custom on public.communities
  for insert to authenticated
  with check (
    university_id = private.current_university_id()
    and created_by = private.current_profile_id()
    and kind = 'custom'
    and is_auto = false
  );

drop policy if exists communities_update_owner on public.communities;
create policy communities_update_owner on public.communities
  for update to authenticated
  using (created_by = private.current_profile_id())
  with check (
    created_by = private.current_profile_id()
    and university_id = private.current_university_id()
  );

drop policy if exists community_members_insert_own on public.community_members;
create policy community_members_insert_own on public.community_members
  for insert to authenticated
  with check (
    profile_id = private.current_profile_id()
    and private.can_view_community(community_id)
    and private.passes_community_constraints(community_id, profile_id)
  );

drop policy if exists posts_select_campus on public.posts;
create policy posts_select_campus on public.posts
  for select to authenticated
  using (
    university_id is not distinct from private.current_university_id()
    and (
      community_id is null
      or private.can_view_community(community_id)
    )
  );

drop policy if exists posts_insert_own on public.posts;
create policy posts_insert_own on public.posts
  for insert to authenticated
  with check (
    author_id = private.current_profile_id()
    and university_id = private.current_university_id()
    and (
      community_id is null
      or (
        private.is_community_member(community_id)
        and private.can_view_community(community_id)
      )
    )
  );

create policy post_comments_select on public.post_comments
  for select to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_id
        and p.university_id is not distinct from private.current_university_id()
    )
  );

create policy post_comments_insert_own on public.post_comments
  for insert to authenticated
  with check (
    author_id = private.current_profile_id()
    and exists (
      select 1 from public.posts p
      where p.id = post_id
        and p.university_id = private.current_university_id()
    )
  );

create policy post_comments_delete_own on public.post_comments
  for delete to authenticated
  using (author_id = private.current_profile_id());

create policy post_votes_select on public.post_votes
  for select to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_id
        and p.university_id is not distinct from private.current_university_id()
    )
  );

create policy post_votes_own on public.post_votes
  for all to authenticated
  using (profile_id = private.current_profile_id())
  with check (profile_id = private.current_profile_id());

create policy post_saves_own on public.post_saves
  for all to authenticated
  using (profile_id = private.current_profile_id())
  with check (profile_id = private.current_profile_id());

create policy notifications_select_own on public.notifications
  for select to authenticated
  using (recipient_id = private.current_profile_id());

create policy notifications_update_own on public.notifications
  for update to authenticated
  using (recipient_id = private.current_profile_id())
  with check (recipient_id = private.current_profile_id());

grant select, insert, update on public.communities to authenticated;
grant select, insert, update, delete on public.community_members to authenticated;
grant select, insert, update on public.posts to authenticated;
grant select, insert, delete on public.post_comments to authenticated;
grant select, insert, update, delete on public.post_votes to authenticated;
grant select, insert, update, delete on public.post_saves to authenticated;
grant select, update on public.notifications to authenticated;

grant execute on function public.sync_my_communities() to authenticated;
grant execute on function public.create_campus_group(text, text, text, boolean, int, uuid, public.year_level, uuid, uuid) to authenticated;
grant execute on function public.create_plan_from_post(uuid, text, text, timestamptz) to authenticated;
grant execute on function public.create_circle_from_post(uuid, text) to authenticated;
grant execute on function public.campus_search(text, int) to authenticated;
