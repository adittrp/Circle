# Path 2 → Path 3 handoff

## What Path 2 shipped

Real discovery + Find My Circle on Supabase, while keeping localStorage demo matching.

### Routes
| Route | Mode |
| --- | --- |
| `/home` | Authenticated: Find My Circle / existing Circle CTAs |
| `/people` | Campus directory (filters + invite) |
| `/people/[id]` | Visibility-aware public profile |
| `/matching` | Real match animation for onboarded users; demo otherwise |
| `/circle` | Real reveal (`why_together`) or demo reveal |
| `/dev/matching` | Dry-run / persist harness (non-production) |

### APIs
- `POST /api/matching/find-circle` — run group match + persist
- `POST /api/matching/invite` — invite discovered student
- `GET /api/matching/my-circle` — load active Circle

### RPCs (SECURITY DEFINER)
- `get_matching_pool(include_synthetic)`
- `form_matched_circle(companion_ids, why, score, meta)`
- `invite_student_to_circle(invitee_id)`
- `get_my_active_circle()`

### Matching architecture
1. Load seeker signals (own profile/prefs/interests/availability)
2. Fetch eligible same-uni pool via RPC (excludes incomplete, blocked, active-circle members, synthetics by default)
3. If pool too small, optionally refill with synthetics
4. `selectCircleCompanions` scores **groups** (pair avg + planning balance + shared schedule/interests + major mix)
5. Persist Circle + members; store human reasons in `circles.why_together`

Core files: `src/lib/matching/{types,score,select,why,service,algorithm}.ts`

### Schema Path 3 should consume
- `circles` (+ `why_together`, `formed_by`, `match_meta`, `stage`)
- `circle_members` (`status`: `active` | `invited`)
- Prefer `get_my_active_circle()` for member cards

Do **not** rebuild matching. Do **not** read other students’ `user_preferences` from the client.

### Tests / seeds
- `npm run test` — university isolation, overlap, balance, demo curated group
- `npm run seed:test -- 100` / `1000` / `5000 [slug]` — synthetic scale data

### Demo mode
Still works via `DemoContext` + `/matching` + `/circle` when the user is not an onboarded Supabase identity.
