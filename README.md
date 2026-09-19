# Circle

College friendships that actually happen.

Circle places students into small groups and helps turn introductions into actual plans.

- **Path 1** — identity, `.edu` auth, campus catalog, onboarding
- **Path 2** — matching / Circles (demo matching still runs offline)
- **Path 3** — private Circles / hangouts (schema ready; chat/plans next)
- **Path 4** — Campus communities & public groups (`/campus`)
- **Path 5** — Trust & Safety: private Circle Karma, blocks, reports, Code of Conduct, Circle rules (`/trust`)

See [SCHEMA.md](./SCHEMA.md).

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Supabase env vars, **demo matching** still runs offline (`/matching`, `/circle`) so Path 2 is not blocked.

## Campus communities

After onboarding, open **`/campus`**:

- Auto communities from university / major / year / residence / interests
- Community feeds (Hot / New / Top) with comments, interest votes, saves
- Public group creation (`/campus/groups/new`)
- Campus search (`/campus/search`)
- Post → Plan and Post → Circle (writes real `circles` / `activities`)
- In-app notifications

## Environment

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | Legacy anon JWT (publishable key also works) |
| `NEXT_PUBLIC_SITE_URL` | browser | Auth email redirect origin (`http://localhost:3000` locally) |
| `SUPABASE_SERVICE_ROLE_KEY` | server seed scripts only | `npm run seed:campus` / `seed:test`. Never expose to the client |

Do not commit `.env.local`.

## Path 1 flow

1. Landing → **Find My Circle** (`/signup`)
2. School email (must end in `.edu`) → magic link / OTP
3. `/verify` → `/onboarding` (basics, university, interests, availability, Code of Conduct, optional vibe)
4. `/home` — real users stay here even with no demo circle
5. `/profile` to edit visibility and sign out
6. `/campus` — university-scoped communities and groups
7. `/trust` — private Karma, reliability, verification, blocks, community rules

Matching UI at `/matching` and `/circle` supports **real Supabase matching** for onboarded users and keeps the **localStorage demo** when Supabase is off / demo onboarding is used. Discover students at `/people`.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run seed:campus              # needs SUPABASE_SERVICE_ROLE_KEY
npm run seed:test -- 100         # optional synthetic students; is_synthetic = true
npm run seed:test -- 1000 ut-austin
```

Developer matching harness (local only): `/dev/matching`. Trust & Safety UI: `/trust`. Campus: `/campus`.

## Schema

Full table map, ownership, and “do not query” notes: **[SCHEMA.md](./SCHEMA.md)**.

Path 2 handoff for Path 3: consume `get_my_active_circle()`, then build chat/plans on `circles` / `circle_members` / `activities`.

Campus (product Path 4): `sync_my_communities`, `create_campus_group`, `create_plan_from_post`, `create_circle_from_post`, `campus_search`.

Trust & Safety (product Path 5): private Circle Karma, blocks, reports, Code of Conduct, Circle rules — never expose numeric Karma publicly.

Generated types: `src/lib/supabase/database.types.ts`. Use `InterestRow` for catalog interests — Path 2’s demo `Interest` union lives in `src/lib/types.ts`.
