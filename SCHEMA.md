# Circle schema

Canonical user id is **`profiles.id`**. `auth.users.id` is stored as `profiles.auth_user_id` and is null for synthetic/test students.

Do not query `profiles.email`. Use `student_directory` for other students. Filter `is_synthetic = false` out of production matching.

RLS helpers live in the **`private`** schema (`current_profile_id`, `current_university_id`, `is_circle_member`, `is_community_member`). Do not recreate them in `public`, and do not use `user_metadata` in policies.

## Path 1 — Identity / campus (this team)

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

## Path 2 — Circles / activities (empty, ready)

The **circle** is the persistent object, not a 1:1 match.

| Object | Purpose |
| --- | --- |
| `circles` | Group on a campus; `stage` is `introduced` → `met_once` → `met_again` → `regular` |
| `circle_members` | Membership. Partial unique `(circle_id, profile_id)` while `left_at` is null |
| `activities` | Plans owned by a circle. Optional `campus_location_id` + `location_label` |
| `activity_rsvps` | Own RSVP: `pending` / `in` / `maybe` / `cant` |
| `activity_feedback` | Rate the **hang**, never other people. Unique per (activity, profile) |
| `matching_rounds` | Optional batch-matching stub |

Users can insert a circle for their own university and manage their own membership/RSVP/feedback. Members can read circle rows they belong to.

## Path 3 — Circles / hangouts (this team)

Plans, RSVPs, first mission, “I want to do something,” Circle chat, feedback, and Circle Momentum. Uses **Path 2 tables** plus `messages`.

| Object | Purpose |
| --- | --- |
| `circles` / `circle_members` | Persistent group Path 2 matching (or a hangout bootstrap) puts you in |
| `activities` | Plans. `mood = 'first_mission'` is unique per circle while not cancelled |
| `activity_rsvps` | Own RSVP: `pending` / `in` / `maybe` / `cant` |
| `activity_feedback` | Rate the **hang**, never other people. Members can read circle hang feedback to steer suggestions |
| `messages` | Circle chat. `is_system` for join/plan/RSVP/nudge copy. Exactly one of `circle_id` or `community_id` |
| `message_reactions` | Optional emoji reactions on chat |
| `campus_locations` | University catalog for suggestions (Path 1) |
| `circle_rules` | Consumed if Path 4 wrote a row. Do not own this table |
| `create_hangout_circle(university_id)` | Path 3 RPC: creates circle + first membership atomically |

Realtime: `messages`, `activities`, `activity_rsvps`, `message_reactions`.

Select note: creators can read circles where `formed_by = current_profile_id()` so `INSERT … RETURNING` works before membership exists.

## Path 3b — Communities / posts (reserved)

Campus-wide Reddit-like communities stay on `communities` / `posts`. Hangouts must not mix that UX with Circle chat.

## Path 4 — Trust / safety (empty, ready)

| Object | Purpose |
| --- | --- |
| `blocks` | Unique pair, no self-block. Users manage their own blocks |
| `reports` | Reporter can insert/select their reports. Subject may be a profile, circle, or activity |
| `karma_events` | Reliability events: `rsvp_kept`, `no_show`, `meetup_completed`. **Not a scientific friendship score** |
| `profile_verifications` | Stub. `.edu` signup already writes `edu_email` |

## What not to query

- `profiles.email` (column grant revoked for `authenticated`)
- `user_preferences` of anyone except yourself
- Synthetic rows (`profiles.is_synthetic`) in production matching or `student_directory` (already excluded)
- `auth.users.raw_user_meta_data` / `user_metadata` in RLS
- Public RPC for identity helpers (they are not in `public`)

## Auth / session

- Magic link + OTP via `@supabase/ssr` cookies
- Next.js 16 `src/proxy.ts` (not `middleware.ts`)
- Unauthenticated `/onboarding`, `/home`, `/profile` → `/signin`
- Authenticated incomplete → `/onboarding`
- Authenticated complete → `/home`
- `/circles` is Path 3 hangouts (auth required)
- `/matching` and `/circle` stay open for the Path 2 demo
