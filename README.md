# Circle

College friendships that actually happen.

Circle places students into small groups (~5) and acts as an **AI social coordinator** — matching for group chemistry, finding mutual availability, and suggesting real-world plans until the group no longer needs the app.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No API keys or Supabase required — **demo mode** runs fully offline with seed data and deterministic AI fallbacks.

## Demo flow (~90 seconds)

1. Landing → **Find My Circle**
2. Onboarding (profile → vibe check → availability)
3. Matching animation
4. Circle reveal + **Why this Circle?**
5. **First Mission** RSVP
6. Home dashboard → **I want to do something**
7. Circle Strength + optional feedback after marking a plan done
8. Settings → **Reset demo** to restart for judges

## Architecture

```
src/
  app/           # Routes: /, /onboarding, /matching, /circle, /home
  components/    # UI + feature components
  context/       # DemoProvider (localStorage persistence)
  data/          # ~60 synthetic UT Austin students
  lib/
    matching/    # Group compatibility + balance algorithm
    ai/          # SocialCoordinator (swappable provider)
    types.ts     # Shared domain types
    storage.ts   # Demo persistence
```

### Key modules

- **`matchCircle`** — optimizes *group* score (interests, schedule, proximity, social fit, year) plus planning-style balance
- **`SocialCoordinator`** — generates First Mission + spontaneous plans; `MockSocialCoordinator` by default; swap via `setSocialCoordinator`
- **Demo store** — all important state persists in `localStorage` (`circle-demo-v1`)

## Resetting the demo

Use **Settings → Reset demo** on the home screen, or the **Reset demo** link on the landing page when mid-flow.

## Tech

Next.js · React · TypeScript · Tailwind CSS · Framer Motion · Lucide
