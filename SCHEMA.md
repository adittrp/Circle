# Circle schema

Canonical user id is **`profiles.id`**. `auth.users.id` is stored as `profiles.auth_user_id` and is null for synthetic/test students.

Do not query `profiles.email`. Use `student_directory` for other students. Filter `is_synthetic = false` out of production matching.

RLS helpers live in the **`private`** schema (`current_profile_id`, `current_university_id`, `is_circle_member`, `is_community_member`, `can_view_community`, `sync_communities_for_profile`). Do not recreate them in `public`, and do not use `user_metadata` in policies.

## Path numbering

| Product path | Owns | SCHEMA / migration label |
| --- | --- | --- |
| Path 1 | Identity / campus catalog | Path 1 |
| Path 2 | Matching | Matching RPCs + circle explainability columns |
| Path 3 | Private Circles + hangouts | Circles / activities / messages / hangout RPCs |
| **Path 4** | **Campus communities & public groups** | Communities / posts / notifications |
| Path 5 | Trust / safety | Blocks, reports, Karma, verifications |

## Path 1 — Identity / campus

| Object | Purpose |
| --- | --- |
| `universities` | Campus catalog (name, slug, colors, logo path) |
| `university_email_domains` | Maps `.edu` domains to a university |
| `majors` | Per-university majors |
| `residence_halls` | Per-university housing, including off-campus |
| `campus_locations` | Hangout / gym / library / dining spots for later plans |
| `interests` | Shared interest catalog |
| `profiles` | Student identity. Own row is editable; email is not granted to `authenticated` |
| `user_interests` | Join: profile ↔ interest |
| `user_availability` | Weekday + `time_window` (`morning` / `afternoon` / `evening`) |
| `user_preferences` | Optional vibe answers. **Never read another student's row** |
| `student_directory` | Visibility-aware public profile view. Security invoker. Hides incomplete + synthetic users |
| `avatars` storage bucket | Own-folder write, public read |

Signup trigger `private.handle_new_user` requires a `.edu` email, creates a profile + preferences row, and records `profile_verifications` (`edu_email`).

## Path 2 — Discovery & Matching (implemented)

Real matching uses SECURITY DEFINER RPCs (authenticated cannot insert other members or read others' preferences):

| Object / RPC | Purpose |
| --- | --- |
| `get_matching_pool(include_synthetic)` | Same-university eligible candidates + matching signals |
| `form_matched_circle(companion_ids, why, score, meta)` | Persist Circle + memberships + matching_rounds row |
| `invite_student_to_circle(invitee_id)` | Invite discovered student (status `invited`) |
| `get_my_active_circle()` | Load caller's active Circle + visibility-aware members |
| `circles.why_together` / `match_score` / `match_meta` / `formed_by` | Explainability + debug meta |
| `circle_members.status` | `active` \| `invited` |

Production matching excludes `is_synthetic` unless the pool is too small (or `NEXT_PUBLIC_MATCH_INCLUDE_SYNTHETIC=true` / harness). Blocks are honored when Path 5 data exists.

Routes: `/people`, `/people/[id]`, `/matching` (real + demo), `/circle` reveal, `/dev/matching` harness (dev only). APIs under `/api/matching/*`.

Path 3 consumes the same `circles` / `circle_members` rows via `/circles/[id]` — do not rebuild matching.

## Path 3 — Circles / hangouts

The **circle** is the persistent object, not a 1:1 match. Matching, Campus post→Circle, and hangout bootstrap all write the same tables.

| Object | Purpose |
| --- | --- |
| `circles` | Group on a campus; optional `title` / `source_post_id` when created from a campus post |
| `circle_members` | Membership. Partial unique `(circle_id, profile_id)` while `left_at` is null |
| `activities` | Plans owned by a circle. Optional `campus_location_id` + `location_label`. `mood = 'first_mission'` is unique per circle while not cancelled |
| `activity_rsvps` | Own RSVP: `pending` / `in` / `maybe` / `cant` |
| `activity_feedback` | Rate the **hang**, never other people. Circle members can read hang feedback to steer suggestions |
| `matching_rounds` | Optional batch-matching stub |
| `messages` | Circle chat. `is_system` for join/plan/RSVP/nudge copy. Exactly one of `circle_id` or `community_id` |
| `message_reactions` | Optional emoji reactions on chat |
| `create_hangout_circle(university_id)` | Creates circle + first membership atomically (needed because `INSERT … RETURNING` must pass SELECT RLS before membership exists) |

Realtime: `messages`, `activities`, `activity_rsvps`, `message_reactions`.

Select note: creators can read circles where `formed_by = current_profile_id()` so `INSERT … RETURNING` works before membership exists. `circle_rules` is consumed when Path 5 wrote a row — hangouts do not own that table.

Routes: `/circles`, `/circles/[id]`, `/circles/join/[id]` (auth required).

## Path 4 — Campus communities (product)

University-scoped social layer. Online interaction should lead toward real-world connection.

| Object | Purpose |
| --- | --- |
| `communities` | Campus-scoped groups. `kind`: `campus` (university), `major`, `residence`, `interest`, `year`, `class`, `custom`. Auto communities set `is_auto`. Public groups use `custom` + `is_discoverable` / constraints / `rules` / `member_limit` |
| `community_members` | Own join/leave (`member_role`) |
| `posts` | Community discussion. `intent`, `category`, `university_id`, `suggested_activity_id` (post→plan), `suggested_circle_id` (post→Circle), counters |
| `post_comments` | Threaded replies on posts (not giant community chat) |
| `post_votes` | Interest / ranking (`1` or `-1`). Drives Hot/Top |
| `post_saves` | Save for later |
| `notifications` | In-app notifications shared across paths |

### Public RPCs (authenticated)

| RPC | Purpose |
| --- | --- |
| `sync_my_communities()` | Ensure + join university / major / year / residence / interest communities from profile |
| `create_campus_group(...)` | Create discoverable/private custom group |
| `create_plan_from_post(...)` | Author turns post into Circle + activity |
| `create_circle_from_post(...)` | Author turns post into Circle; interested voters may be added |
| `campus_search(query, limit)` | People / communities / Circles / posts (permission-aware) |

Auto-sync also runs from profile onboarding triggers and `user_interests` changes via `private.sync_communities_for_profile`.

Reports may include `post_id` / `community_id` hooks for Path 5.

## Path 5 — Trust / safety

| Object | Purpose |
| --- | --- |
| `blocks` | Unique pair, no self-block. Users manage **their own** blocks. Blocked people are not notified. |
| `reports` | Reporter insert/select only. Subject never sees the row. Moderators can review. Category enum + optional details. May reference `post_id` / `community_id`. A report does **not** change Karma. |
| `karma_events` | Private reliability events. Product name: **Circle Karma**. View alias: `reputation_events`. |
| `user_reputation` | Private aggregate (karma, RSVP counts, standing). Owner read only. |
| `moderation_actions` | Safety-team only. Confirmed actions may write karma. |
| `circle_rules` | Structured Circle boundaries (no drinking, public campus, etc.) for matching/activity generation. |
| `profile_verifications` | `.edu` signup writes `edu_email`. Shown as **University Verified**. |
| `user_verifications` | Optional identity-provider statuses (`unverified` / `pending` / `verified` / `failed`). Mock provider never fakes success. |
| `safety_acknowledgements` | Code of Conduct agreement during onboarding. |
| `activity_attendance` | Self-marked attended / no-show. |
| `circle_leave_feedback` | Private leave reasons. |
| `public_trust_badges` | Public **university_verified** only — never a numeric score. |
| RPCs | `record_own_karma_event`, `apply_moderation_action`, `filter_match_candidates`, `leave_circle` |

## What not to query

- `profiles.email` (column grant revoked for `authenticated`)
- `user_preferences` of anyone except yourself
- Synthetic rows (`profiles.is_synthetic`) in production matching or `student_directory` (already excluded)
- `auth.users.raw_user_meta_data` / `user_metadata` in RLS
- Public RPC for private identity helpers (they are not in `public`)
- Exact private room numbers (residence communities are hall-level only)
- Numeric Karma / reputation scores in public UI

## Auth / session

- Magic link + OTP via `@supabase/ssr` cookies
- Next.js 16 `src/proxy.ts` (not `middleware.ts`)
- Unauthenticated `/onboarding`, `/home`, `/profile`, `/campus`, `/people`, `/trust`, `/circles`, `/dev/matching` → `/signin`
- Authenticated incomplete → `/onboarding`
- Authenticated complete → `/home`
- `/matching` and `/circle` stay open for the Path 2 demo; authenticated onboarded users use real matching
- `/people`, `/dev/matching`, `/trust`, `/campus`, and `/circles` require auth + completed onboarding
