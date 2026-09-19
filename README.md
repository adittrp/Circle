# Circle

College friendships that actually happen.

Circle places students into small groups and helps turn introductions into actual plans.

- **Path 1** — identity, `.edu` auth, campus catalog, onboarding
- **Path 2** — people discovery and matching (demo matching still at `/matching`)
- **Path 3** — Circles & hangouts: plans, RSVPs, chat, first mission, Circle Momentum

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Supabase env vars, **demo matching** still runs offline (`/matching`, `/circle`) so Path 2 is not blocked.

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
3. `/verify` → `/onboarding` (basics, university, interests, availability, optional vibe)
4. `/home` — real users stay here even with no demo circle
5. `/profile` to edit visibility and sign out

Matching UI at `/matching` and `/circle` is still the localStorage demo (Path 2).

## Path 3 hangouts

After onboarding, `/home` and `/circles` load real membership, plans, RSVPs, and chat from Supabase.

1. Start or join a Circle (`/circles`, invite link `/circles/join/[id]`)
2. First mission is generated from availability + campus locations
3. RSVP · create a plan · **I want to do something**
4. Chat is secondary; system messages log joins and new plans
5. Mark a plan done → hang feedback → Circle Momentum

`create_hangout_circle(university_id)` creates the circle + first membership atomically (needed because `INSERT … RETURNING` must pass SELECT RLS before membership exists). Creators can also `SELECT` rows where `formed_by = current_profile_id()`.

Two signed-in members of the same Circle see each other’s plans and RSVPs after refresh or over Realtime.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run seed:campus   # needs SUPABASE_SERVICE_ROLE_KEY
npm run seed:test     # optional synthetic students; is_synthetic = true
```

## Schema

Full table map, ownership, and “do not query” notes: **[SCHEMA.md](./SCHEMA.md)**.

Generated types: `src/lib/supabase/database.types.ts`. Use `InterestRow` for catalog interests — Path 2’s demo `Interest` union lives in `src/lib/types.ts`.
