-- Product Path 4 (Campus Communities). Extends SCHEMA Path 3 foundation.
-- Enum values only — use in a follow-up migration.

alter type public.community_kind add value if not exists 'residence';
alter type public.community_kind add value if not exists 'year';
alter type public.community_kind add value if not exists 'class';
alter type public.community_kind add value if not exists 'custom';

do $$ begin
  create type public.post_intent as enum (
    'discussion',
    'looking_for_people',
    'plan_idea'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_kind as enum (
    'post_reply',
    'post_interest',
    'post_became_circle',
    'post_became_plan',
    'community_invite',
    'group_invite',
    'system'
  );
exception when duplicate_object then null;
end $$;
