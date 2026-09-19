-- Path 3 hangouts: maybe RSVPs, system chat, reactions, member-visible hang feedback, realtime.
-- Consumes Path 2 circle/activity tables. Does not recreate private RLS helpers.

do $$ begin
  alter type public.rsvp_status add value if not exists 'maybe';
exception
  when duplicate_object then null;
end $$;

alter table public.messages
  add column if not exists is_system boolean not null default false;

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, profile_id)
);

create index if not exists message_reactions_message_idx
  on public.message_reactions (message_id);

create unique index if not exists activities_first_mission_unique
  on public.activities (circle_id)
  where mood = 'first_mission' and status <> 'cancelled';

drop policy if exists activity_feedback_select_own on public.activity_feedback;

create policy activity_feedback_select_circle on public.activity_feedback
  for select to authenticated
  using (
    exists (
      select 1 from public.activities a
      where a.id = activity_id and private.is_circle_member(a.circle_id)
    )
  );

alter table public.message_reactions enable row level security;

drop policy if exists message_reactions_select on public.message_reactions;
create policy message_reactions_select on public.message_reactions
  for select to authenticated
  using (
    exists (
      select 1 from public.messages m
      where m.id = message_id
        and m.circle_id is not null
        and private.is_circle_member(m.circle_id)
    )
  );

drop policy if exists message_reactions_write_own on public.message_reactions;
create policy message_reactions_write_own on public.message_reactions
  for all to authenticated
  using (profile_id = (select private.current_profile_id()))
  with check (profile_id = (select private.current_profile_id()));

grant select, insert, update, delete on public.message_reactions to authenticated;

create or replace function private.circle_system_message(p_circle uuid, p_author uuid, p_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_author is null or p_body is null or length(trim(p_body)) = 0 then
    return;
  end if;
  insert into public.messages (circle_id, author_id, body, is_system)
  values (p_circle, p_author, left(trim(p_body), 500), true);
end;
$$;

revoke all on function private.circle_system_message(uuid, uuid, text) from public, anon;
grant execute on function private.circle_system_message(uuid, uuid, text) to service_role;

create or replace function private.on_circle_member_hangouts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  member_name text;
begin
  if tg_op = 'INSERT' and new.left_at is null then
    select coalesce(nullif(trim(first_name), ''), 'Someone') into member_name
    from public.profiles where id = new.profile_id;
    perform private.circle_system_message(
      new.circle_id,
      new.profile_id,
      member_name || ' joined the Circle.'
    );
    update public.circles c
      set active_member_count = (
        select count(*)::int from public.circle_members m
        where m.circle_id = new.circle_id and m.left_at is null
      )
      where c.id = new.circle_id;
  elsif tg_op = 'UPDATE' and old.left_at is null and new.left_at is not null then
    update public.circles c
      set active_member_count = (
        select count(*)::int from public.circle_members m
        where m.circle_id = new.circle_id and m.left_at is null
      )
      where c.id = new.circle_id;
  end if;
  return new;
end;
$$;

drop trigger if exists circle_members_hangouts_aiu on public.circle_members;
create trigger circle_members_hangouts_aiu
after insert or update of left_at on public.circle_members
for each row execute function private.on_circle_member_hangouts();

create or replace function private.on_activity_created_hangouts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_name text;
begin
  if new.created_by is null then
    return new;
  end if;
  select coalesce(nullif(trim(first_name), ''), 'Someone') into actor_name
  from public.profiles where id = new.created_by;
  perform private.circle_system_message(
    new.circle_id,
    new.created_by,
    actor_name || ' created ' || coalesce(new.emoji || ' ', '') || new.title || '.'
  );
  return new;
end;
$$;

drop trigger if exists activities_hangouts_ai on public.activities;
create trigger activities_hangouts_ai
after insert on public.activities
for each row execute function private.on_activity_created_hangouts();

create or replace function private.on_rsvp_hangouts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  going int;
  members int;
  act record;
  msg text;
begin
  select * into act from public.activities where id = new.activity_id;
  if act is null then
    return new;
  end if;
  select count(*)::int into going
  from public.activity_rsvps
  where activity_id = new.activity_id and status = 'in';
  select count(*)::int into members
  from public.circle_members
  where circle_id = act.circle_id and left_at is null;
  if going >= 3 or (members > 0 and going = members) then
    msg := going || ' / ' || members || ' people are going to ' || coalesce(act.emoji || ' ', '') || act.title || '.';
    if not exists (
      select 1 from public.messages m
      where m.circle_id = act.circle_id
        and m.is_system
        and m.body = msg
    ) then
      perform private.circle_system_message(act.circle_id, new.profile_id, msg);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists activity_rsvps_hangouts_aiu on public.activity_rsvps;
create trigger activity_rsvps_hangouts_aiu
after insert or update of status on public.activity_rsvps
for each row execute function private.on_rsvp_hangouts();

do $$ begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.activity_rsvps;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.activities;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.message_reactions;
  exception when duplicate_object then null;
  end;
end $$;
