# Circle

College friendships that actually happen.

This repo owns **Path 1** (identity) and **Path 4** (campus communities). Paths 2/3/5 integrate via shared schema — see [SCHEMA.md](./SCHEMA.md).

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Supabase env vars, **demo matching** still runs offline (`/matching`, `/circle`).

## Path 4 — Campus

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

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run seed:campus
npm run seed:test
```

## Schema

Full table map and path boundaries: **[SCHEMA.md](./SCHEMA.md)**.
