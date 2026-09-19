# Circle schema

Canonical user id is **`profiles.id`**. `auth.users.id` is stored as `profiles.auth_user_id` and is null for synthetic/test students.

Do not query `profiles.email`. Use `student_directory` for other students. Filter `is_synthetic = false` out of production matching.

RLS helpers live in the **`private`** schema (`current_profile_id`, `current_university_id`, `is_circle_member`, `is_community_member`, `can_view_community`, `sync_communities_for_profile`). Do not recreate them in `public`, and do not use `user_metadata` in policies.

## Path numbering

| Product path | Owns | SCHEMA / migration label |
| --- | --- | --- |
| Path 1 | Identity / campus catalog | Path 1 |
| Path 2 | Matching | (app + matching tables stubs) |
| Path 3 | Private Circles + hangouts | SCHEMA Path 2 (+ hangout extensions) |
| **Path 4** | **Campus communities & public groups** | SCHEMA Path 3 communities/posts (extended) |
| Path 5 | Trust / safety | SCHEMA Path 4 trust tables |

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

## Path 2 / 3 — Circles / activities / hangouts

The **circle** is the persistent object, not a 1:1 match.

| Object | Purpose |
| --- | --- |
| `circles` | Group on a campus; optional `title` / `source_post_id` when created from a campus post |
| `circle_members` | Membership. Partial unique `(circle_id, profile_id)` while `left_at` is null |
| `activities` | Plans owned by a circle. Optional `campus_location_id` + `location_label` |
| `activity_rsvps` | Own RSVP: `pending` / `in` / `cant` |
| `activity_feedback` | Rate the **hang**, never other people |
| `matching_rounds` | Optional batch-matching stub |

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
| `notifications` | In-app notifications shared with Paths 2/3/5 |
| `messages` | Chat for **Circles** (and membership-gated community chat only if needed — prefer posts for large communities) |

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
| `blocks` | Unique pair, no self-block |
| `reports` | Reporter insert/select; subjects may include profile, circle, activity, post, community |
| `karma_events` | Reliability events — **not** a friendship score |
| `profile_verifications` | Stub; `.edu` signup writes `edu_email` |

## What not to query

- `profiles.email` (column grant revoked for `authenticated`)
- `user_preferences` of anyone except yourself
- Synthetic rows (`profiles.is_synthetic`) in production matching or `student_directory` (already excluded)
- `auth.users.raw_user_meta_data` / `user_metadata` in RLS
- Public RPC for private identity helpers (they are not in `public`)
- Exact private room numbers (residence communities are hall-level only)

## Auth / session

- Magic link + OTP via `@supabase/ssr` cookies
- Next.js 16 `src/proxy.ts` (not `middleware.ts`)
- Unauthenticated `/onboarding`, `/home`, `/profile`, `/campus` → `/signin`
- Authenticated incomplete → `/onboarding`
- Authenticated complete → `/home`
- `/matching` and `/circle` stay open for the Path 2 demo
