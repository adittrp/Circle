-- Path 4: Trust, reputation, rules, verification, and safety.
-- Extends existing blocks / reports / karma_events / profile_verifications.
-- Canonical user id remains public.profiles.id.
-- RLS helpers stay in private.* (see 20260919170000).

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.community_standing as enum (
    'good', 'limited', 'restricted', 'suspended'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.report_category as enum (
    'harassment',
    'spam',
    'threatening_behavior',
    'hate_discrimination',
    'unsafe_behavior',
    'fake_account',
    'inappropriate_content',
    'other'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.moderation_action_type as enum (
    'dismiss_report',
    'confirm_violation',
    'confirm_harassment',
    'confirm_spam',
    'restrict_account',
    'suspend_account',
    'restore_account'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.verification_status as enum (
    'unverified', 'pending', 'verified', 'failed'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.attendance_status as enum ('attended', 'no_show');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.circle_leave_reason as enum (
    'not_clicking',
    'schedule',
    'no_longer_interested',
    'felt_uncomfortable',
    'other'
  );
exception when duplicate_object then null;
end $$;

alter type public.karma_kind add value if not exists 'rsvp_accepted';
alter type public.karma_kind add value if not exists 'late_cancellation';
alter type public.karma_kind add value if not exists 'plan_organized';
alter type public.karma_kind add value if not exists 'consistent_participation';
alter type public.karma_kind add value if not exists 'university_verified';
alter type public.karma_kind add value if not exists 'identity_verified';
alter type public.karma_kind add value if not exists 'confirmed_spam';
alter type public.karma_kind add value if not exists 'confirmed_harassment';
alter type public.karma_kind add value if not exists 'confirmed_rule_violation';

alter type public.verification_method add value if not exists 'identity_provider';
alter type public.report_status add value if not exists 'confirmed';

-- ---------------------------------------------------------------------------
-- Extend reports (keep reason text for Path 4 stub compatibility)
-- ---------------------------------------------------------------------------
alter table public.reports
  add column if not exists category public.report_category not null default 'other';

alter table public.karma_events
  add column if not exists delta int not null default 0,
  add column if not exists source_key text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists report_id uuid references public.reports (id) on delete set null;

create unique index if not exists karma_events_source_key_idx
  on public.karma_events (profile_id, source_key)
  where source_key is not null;

-- reputation_events is the product name; karma_events is the stored table.
create or replace view public.reputation_events
with (security_invoker = true) as
select
  id,
  profile_id,
  kind,
  delta,
  source_id,
  source_key,
  report_id,
  metadata,
  created_at
from public.karma_events;

-- ---------------------------------------------------------------------------
-- New tables
-- ---------------------------------------------------------------------------
create table if not exists public.user_reputation (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  karma int not null default 500,
  plans_accepted int not null default 0,
  plans_attended int not null default 0,
  late_cancellations int not null default 0,
  no_shows int not null default 0,
  standing public.community_standing not null default 'good',
  updated_at timestamptz not null default now()
);

create table if not exists public.safety_moderators (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports (id) on delete set null,
  target_profile_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete restrict,
  action public.moderation_action_type not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.circle_rules (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null unique references public.circles (id) on delete cascade,
  no_drinking boolean not null default false,
  no_smoking boolean not null default false,
  study_focused boolean not null default false,
  age_18_plus boolean not null default false,
  no_parties boolean not null default false,
  public_campus_only boolean not null default true,
  low_cost boolean not null default false,
  accessibility_needed boolean not null default false,
  early_evening boolean not null default false,
  notes text,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_verifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  method public.verification_method not null,
  status public.verification_status not null default 'unverified',
  provider text not null default 'none',
  evidence_digest text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, method)
);

create table if not exists public.safety_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  document_key text not null,
  document_version int not null,
  acknowledged_at timestamptz not null default now(),
  unique (profile_id, document_key, document_version)
);

create table if not exists public.activity_attendance (
  activity_id uuid not null references public.activities (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  status public.attendance_status not null,
  marked_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (activity_id, profile_id)
);

create table if not exists public.circle_leave_feedback (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  circle_id uuid not null references public.circles (id) on delete cascade,
  reason public.circle_leave_reason not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists user_reputation_standing_idx on public.user_reputation (standing);
create index if not exists moderation_actions_target_idx on public.moderation_actions (target_profile_id, created_at desc);
create index if not exists user_verifications_profile_idx on public.user_verifications (profile_id);
create index if not exists safety_ack_profile_idx on public.safety_acknowledgements (profile_id);
create index if not exists reports_subject_idx on public.reports (subject_profile_id);
create index if not exists reports_status_idx on public.reports (status);

-- University Verified only — never karma.
create or replace view public.public_trust_badges
with (security_invoker = true) as
select
  p.id as profile_id,
  exists (
    select 1
    from public.profile_verifications v
    where v.profile_id = p.id
      and v.method = 'edu_email'
  ) as university_verified
from public.profiles p
where p.is_synthetic = false;

-- ---------------------------------------------------------------------------
-- Reputation math (server-side so clients cannot invent confirmed penalties)
-- ---------------------------------------------------------------------------
create or replace function private.karma_delta(kind public.karma_kind)
returns int
language sql
immutable
as $$
  select case kind
    when 'rsvp_kept' then 12
    when 'meetup_completed' then 12
    when 'plan_organized' then 18
    when 'consistent_participation' then 8
    when 'university_verified' then 40
    when 'identity_verified' then 25
    when 'rsvp_accepted' then 0
    when 'late_cancellation' then -8
    when 'no_show' then -20
    when 'confirmed_spam' then -40
    when 'confirmed_harassment' then -80
    when 'confirmed_rule_violation' then -50
    else 0
  end
$$;

create or replace function private.ensure_reputation(pid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_reputation (profile_id)
  values (pid)
  on conflict (profile_id) do nothing;
end;
$$;

create or replace function private.apply_karma_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  weekly int;
  applied int;
  severe int;
  rep public.user_reputation%rowtype;
begin
  perform private.ensure_reputation(new.profile_id);

  if new.delta is null or new.delta = 0 then
    new.delta := private.karma_delta(new.kind);
  end if;

  if new.delta > 0 then
    select coalesce(sum(delta), 0) into weekly
    from public.karma_events
    where profile_id = new.profile_id
      and delta > 0
      and created_at > now() - interval '7 days';
    applied := least(new.delta, greatest(0, 48 - weekly));
    new.delta := applied;
  end if;

  update public.user_reputation
  set
    karma = least(1200, greatest(100, karma + new.delta)),
    plans_accepted = plans_accepted + case when new.kind = 'rsvp_accepted' then 1 else 0 end,
    plans_attended = plans_attended + case when new.kind in ('rsvp_kept', 'meetup_completed') then 1 else 0 end,
    late_cancellations = late_cancellations + case when new.kind = 'late_cancellation' then 1 else 0 end,
    no_shows = no_shows + case when new.kind = 'no_show' then 1 else 0 end,
    updated_at = now()
  where profile_id = new.profile_id;

  select * into rep from public.user_reputation where profile_id = new.profile_id;
  select count(*) into severe
  from public.karma_events
  where profile_id = new.profile_id
    and kind in ('confirmed_harassment', 'confirmed_rule_violation');

  if rep.standing is distinct from 'suspended' then
    update public.user_reputation
    set standing = case
      when severe >= 2 then 'restricted'::public.community_standing
      when severe = 1 or rep.no_shows >= 3 then 'limited'::public.community_standing
      else 'good'::public.community_standing
    end
    where profile_id = new.profile_id
      and standing is distinct from 'suspended';
  end if;

  return new;
end;
$$;

drop trigger if exists karma_events_apply on public.karma_events;
create trigger karma_events_apply
before insert on public.karma_events
for each row execute function private.apply_karma_row();

drop trigger if exists profiles_ensure_reputation on public.profiles;
create or replace function private.seed_reputation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform private.ensure_reputation(new.id);
  return new;
end;
$$;

drop trigger if exists profiles_ensure_reputation on public.profiles;
create trigger profiles_ensure_reputation
after insert on public.profiles
for each row execute function private.seed_reputation();

insert into public.user_reputation (profile_id)
select id from public.profiles
on conflict (profile_id) do nothing;

-- Own behavioral events only. Reports never write karma.
create or replace function public.record_own_karma_event(
  p_kind public.karma_kind,
  p_source_id uuid default null,
  p_source_key text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid := private.current_profile_id();
  allowed public.karma_kind[] := array[
    'rsvp_accepted',
    'rsvp_kept',
    'meetup_completed',
    'plan_organized',
    'consistent_participation',
    'late_cancellation',
    'no_show'
  ];
  new_id uuid;
begin
  if pid is null then
    raise exception 'Not signed in';
  end if;
  if not (p_kind = any (allowed)) then
    raise exception 'That event can only be recorded by the safety team';
  end if;

  if p_source_key is not null and exists (
    select 1 from public.karma_events e
    where e.profile_id = pid and e.source_key = p_source_key
  ) then
    return null;
  end if;

  insert into public.karma_events (profile_id, kind, source_id, source_key, metadata)
  values (pid, p_kind, p_source_id, p_source_key, coalesce(p_metadata, '{}'::jsonb))
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function private.is_safety_moderator(pid uuid default private.current_profile_id())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.safety_moderators m where m.profile_id = pid);
$$;

create or replace function public.apply_moderation_action(
  p_action public.moderation_action_type,
  p_target uuid,
  p_report_id uuid default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid := private.current_profile_id();
  action_id uuid;
  k public.karma_kind;
begin
  if not private.is_safety_moderator(pid) then
    raise exception 'Only the safety team can take this action';
  end if;

  insert into public.moderation_actions (report_id, target_profile_id, actor_id, action, notes)
  values (p_report_id, p_target, pid, p_action, p_notes)
  returning id into action_id;

  if p_report_id is not null then
    update public.reports
    set status = case p_action
      when 'dismiss_report' then 'dismissed'::public.report_status
      when 'confirm_violation' then 'confirmed'::public.report_status
      when 'confirm_harassment' then 'confirmed'::public.report_status
      when 'confirm_spam' then 'confirmed'::public.report_status
      else 'reviewing'::public.report_status
    end
    where id = p_report_id;
  end if;

  k := case p_action
    when 'confirm_spam' then 'confirmed_spam'::public.karma_kind
    when 'confirm_harassment' then 'confirmed_harassment'::public.karma_kind
    when 'confirm_violation' then 'confirmed_rule_violation'::public.karma_kind
    else null
  end;

  if k is not null then
    insert into public.karma_events (profile_id, kind, report_id, source_key)
    values (p_target, k, p_report_id, coalesce(p_report_id::text, action_id::text));
  end if;

  if p_action = 'suspend_account' then
    update public.user_reputation set standing = 'suspended', updated_at = now() where profile_id = p_target;
  elsif p_action = 'restrict_account' then
    update public.user_reputation set standing = 'restricted', updated_at = now() where profile_id = p_target;
  elsif p_action = 'restore_account' then
    update public.user_reputation set standing = 'good', updated_at = now() where profile_id = p_target;
  end if;

  return action_id;
end;
$$;

-- Matching may exclude blocked / suspended people without revealing who blocked whom.
create or replace function public.filter_match_candidates(candidate_ids uuid[])
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(cid), '{}'::uuid[])
  from unnest(candidate_ids) as cid
  where cid is distinct from private.current_profile_id()
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = private.current_profile_id() and b.blocked_id = cid)
         or (b.blocker_id = cid and b.blocked_id = private.current_profile_id())
    )
    and not exists (
      select 1 from public.user_reputation r
      where r.profile_id = cid and r.standing = 'suspended'
    )
$$;

create or replace function public.leave_circle(
  p_circle_id uuid,
  p_reason public.circle_leave_reason default null,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid := private.current_profile_id();
begin
  if pid is null then
    raise exception 'Not signed in';
  end if;

  update public.circle_members
  set left_at = now()
  where circle_id = p_circle_id
    and profile_id = pid
    and left_at is null;

  if p_reason is not null then
    insert into public.circle_leave_feedback (profile_id, circle_id, reason, notes)
    values (pid, p_circle_id, p_reason, p_notes);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.user_reputation enable row level security;
alter table public.safety_moderators enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.circle_rules enable row level security;
alter table public.user_verifications enable row level security;
alter table public.safety_acknowledgements enable row level security;
alter table public.activity_attendance enable row level security;
alter table public.circle_leave_feedback enable row level security;

drop policy if exists user_reputation_select_own on public.user_reputation;
create policy user_reputation_select_own on public.user_reputation
  for select to authenticated
  using (
    profile_id = (select private.current_profile_id())
    or (select private.is_safety_moderator())
  );

drop policy if exists safety_moderators_select_mod on public.safety_moderators;
create policy safety_moderators_select_mod on public.safety_moderators
  for select to authenticated
  using ((select private.is_safety_moderator()));

drop policy if exists moderation_actions_select_mod on public.moderation_actions;
create policy moderation_actions_select_mod on public.moderation_actions
  for select to authenticated
  using ((select private.is_safety_moderator()));

drop policy if exists reports_select_mod on public.reports;
create policy reports_select_mod on public.reports
  for select to authenticated
  using ((select private.is_safety_moderator()));

drop policy if exists reports_update_mod on public.reports;
create policy reports_update_mod on public.reports
  for update to authenticated
  using ((select private.is_safety_moderator()));

drop policy if exists circle_rules_select_member on public.circle_rules;
create policy circle_rules_select_member on public.circle_rules
  for select to authenticated
  using ((select private.is_circle_member(circle_id)));

drop policy if exists circle_rules_write_member on public.circle_rules;
create policy circle_rules_write_member on public.circle_rules
  for insert to authenticated
  with check (
    (select private.is_circle_member(circle_id))
    and updated_by = (select private.current_profile_id())
  );

drop policy if exists circle_rules_update_member on public.circle_rules;
create policy circle_rules_update_member on public.circle_rules
  for update to authenticated
  using ((select private.is_circle_member(circle_id)))
  with check (
    (select private.is_circle_member(circle_id))
    and updated_by = (select private.current_profile_id())
  );

drop policy if exists user_verifications_select_own on public.user_verifications;
create policy user_verifications_select_own on public.user_verifications
  for select to authenticated
  using (
    profile_id = (select private.current_profile_id())
    or (select private.is_safety_moderator())
  );

drop policy if exists user_verifications_write_own on public.user_verifications;
create policy user_verifications_write_own on public.user_verifications
  for all to authenticated
  using (profile_id = (select private.current_profile_id()))
  with check (profile_id = (select private.current_profile_id()));

drop policy if exists safety_ack_own on public.safety_acknowledgements;
create policy safety_ack_select_own on public.safety_acknowledgements
  for select to authenticated
  using (profile_id = (select private.current_profile_id()));

drop policy if exists safety_ack_insert_own on public.safety_acknowledgements;
create policy safety_ack_insert_own on public.safety_acknowledgements
  for insert to authenticated
  with check (profile_id = (select private.current_profile_id()));

drop policy if exists attendance_select_own on public.activity_attendance;
create policy attendance_select_own on public.activity_attendance
  for select to authenticated
  using (
    profile_id = (select private.current_profile_id())
    or marked_by = (select private.current_profile_id())
    or (select private.is_safety_moderator())
  );

drop policy if exists attendance_insert_own on public.activity_attendance;
create policy attendance_insert_own on public.activity_attendance
  for insert to authenticated
  with check (
    profile_id = (select private.current_profile_id())
    and marked_by = (select private.current_profile_id())
  );

drop policy if exists leave_feedback_own on public.circle_leave_feedback;
create policy leave_feedback_select_own on public.circle_leave_feedback
  for select to authenticated
  using (
    profile_id = (select private.current_profile_id())
    or (select private.is_safety_moderator())
  );

drop policy if exists leave_feedback_insert_own on public.circle_leave_feedback;
create policy leave_feedback_insert_own on public.circle_leave_feedback
  for insert to authenticated
  with check (profile_id = (select private.current_profile_id()));

-- Public badge: university verification only
grant select on public.public_trust_badges to authenticated, anon;
grant select on public.reputation_events to authenticated;

grant select on public.user_reputation to authenticated;
grant select, insert, update on public.circle_rules to authenticated;
grant select, insert, update, delete on public.user_verifications to authenticated;
grant select, insert on public.safety_acknowledgements to authenticated;
grant select, insert on public.activity_attendance to authenticated;
grant select, insert on public.circle_leave_feedback to authenticated;
grant select on public.moderation_actions to authenticated;
grant select on public.safety_moderators to authenticated;

grant execute on function public.record_own_karma_event(public.karma_kind, uuid, text, jsonb) to authenticated;
grant execute on function public.apply_moderation_action(public.moderation_action_type, uuid, uuid, text) to authenticated;
grant execute on function public.filter_match_candidates(uuid[]) to authenticated;
grant execute on function public.leave_circle(uuid, public.circle_leave_reason, text) to authenticated;

revoke all on public.reports from anon;
revoke all on public.karma_events from anon;
revoke all on public.user_reputation from anon;
revoke all on public.moderation_actions from anon;
revoke all on public.blocks from anon;

-- Award university_verified karma from Path 1 edu_email — clients cannot insert this kind.
create or replace function private.award_university_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.method = 'edu_email' then
    if not exists (
      select 1 from public.karma_events e
      where e.profile_id = new.profile_id and e.source_key = 'edu_email'
    ) then
      insert into public.karma_events (profile_id, kind, source_key)
      values (new.profile_id, 'university_verified', 'edu_email');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profile_verifications_university_karma on public.profile_verifications;
create trigger profile_verifications_university_karma
after insert on public.profile_verifications
for each row execute function private.award_university_verified();

