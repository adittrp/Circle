# Circle 🔵
**Team Name:** Circle | **Project Title:** Circle  

College friendships that actually happen. Circle places students into small groups and helps turn introductions into actual plans.

## 📖 Short Write-up
**Problem:** College campuses are massive and increasingly isolating. Despite being surrounded by thousands of peers, students often struggle to find genuine friend groups without relying on awkward icebreakers or superficial, swipe-based social apps.  
**Who it helps:** University students looking for authentic, small-group connections based on real compatibility—shared interests, overlapping schedules, and campus proximity.  
**Solution:** Circle is a web app that replaces the traditional social feed with intelligent group matching. Users build a profile highlighting their major, residence hall, interests, and availability. Instead of endless swiping, our algorithm curates a "Circle"—a balanced group of 4-6 students. We emphasize transparency by showing exactly *why* a group was matched, removing the friction of breaking the ice.  
**Impact:** Circle shrinks the campus. It moves students from “I don’t know anyone here” to “I have plans this week,” fostering real-world communities and building meaningful relationships.

---

## 👥 Team Roster
* **Ankur Lamsal** – [Role, e.g., Backend & Matching Algorithm] | [GitHub/LinkedIn]
* **[Name]** – [Role, e.g., Frontend & UI/UX] | [GitHub/LinkedIn]
* **[Name]** – [Role, e.g., Database & User Auth] | [GitHub/LinkedIn]

---

## 🚀 Quick Start & How to Reproduce the Demo

**1. Install & Run**
```bash
npm install
cp .env.example .env.local   # then fill keys
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

**2. Environment Variables (To Reproduce Demo)**
To run the full authenticated flow, fill in your `.env.local`:

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | Legacy anon JWT (publishable key also works) |
| `NEXT_PUBLIC_SITE_URL` | browser | Auth email redirect origin (`http://localhost:3000` locally) |
| `SUPABASE_SERVICE_ROLE_KEY` | server seed scripts only | `npm run seed:campus` / `seed:test`. Never expose to the client |

*(Note: Do not commit `.env.local`)*

**3. Offline Demo Fallback**
If you are evaluating this project and do not have Supabase environment variables, **demo matching** still runs completely offline via local storage at `/matching` and `/circle`, ensuring the core loop (Path 2) is never blocked.

---

## 🏗 Tech Stack & Architecture

**Languages:** 
* TypeScript (77%)
* PLpgSQL (21.9%)
* Other (1.1%)

**Tech Stack:**
* **Frontend:** Next.js, React, Tailwind CSS
* **Backend & Database:** Supabase (PostgreSQL, Row Level Security)
* **Authentication:** Supabase Auth (Email OTP / Magic Link requiring `.edu` domains)

**Architecture Flow:**
- **Path 1** — Identity, `.edu` auth, campus catalog, onboarding
- **Path 2** — Matching / Circles (demo matching runs offline or via DB)
- **Path 3** — Circles & hangouts: plans, RSVPs, chat, first mission, Circle Momentum (`/circles`)
- **Path 4** — Campus communities & public groups (`/campus`)
- **Path 5** — Trust & Safety: private Circle Karma, blocks, reports, Code of Conduct, Circle rules (`/trust`)

---

## 📊 Datasets & Synthetic Data Used

Because social matching requires scale to test, we built synthetic data generation to stress-test our algorithms.

* **Provenance & Generation:** We built a custom seeding script that generates realistic mock student profiles, including randomized (but logical) majors, residence halls, interests, and 7-day availability matrices. 
* **Commands used:** 
  * `npm run seed:test -- 100` (Seeds 100 synthetic students; `is_synthetic = true`)
  * `npm run seed:test -- 1000 ut-austin` (Stress tests matching with 1,000 users scoped to a specific university)
* **Impact:** This allowed us to populate our database via the `SUPABASE_SERVICE_ROLE_KEY` and prove that our matching algorithm functions dynamically at scale.

---

## 🧭 App Flow Breakdown

### Path 1 Flow (Onboarding)
1. Landing → **Find My Circle** (`/signup`)
2. School email (must end in `.edu`) → magic link / OTP
3. `/verify` → `/onboarding` (basics, university, interests, availability, Code of Conduct, optional vibe)
4. `/home` — real users stay here even with no demo circle
5. `/profile` to edit visibility and sign out
6. `/campus` — university-scoped communities and groups
7. `/circles` — hangouts, plans, RSVPs, chat
8. `/trust` — private Karma, reliability, verification, blocks, community rules

*Matching UI at `/matching` and `/circle` supports **real Supabase matching** for onboarded users and keeps the **localStorage demo** when Supabase is off. Discover students at `/people`.*

### Campus Communities (`/campus`)
After onboarding, users can explore:
- Auto communities from university / major / year / residence / interests
- Community feeds (Hot / New / Top) with comments, interest votes, saves
- Public group creation (`/campus/groups/new`) & Campus search (`/campus/search`)
- Post → Plan and Post → Circle (writes real `circles` / `activities`)

### Circles & Hangouts (`/circles`)
After matching or starting a hangout:
1. Start or join a Circle (`/circles`, invite link `/circles/join/[id]`)
2. First mission is generated from availability + campus locations
3. RSVP · create a plan · **I want to do something**
4. Chat is secondary; system messages log joins and new plans
5. Mark a plan done → hang feedback → Circle Momentum

*(Note: `create_hangout_circle(university_id)` creates the circle + first membership atomically. Matched Circles and Campus posts use the same `circles` / `circle_members` tables).*

---

## 🛠 Available Scripts

```bash
npm run dev             # Start dev server
npm run lint            # Run ESLint
npm run typecheck       # TypeScript checks
npm run test            # Run test suite
npm run build           # Production build
npm run seed:campus     # Seeds campus data (needs SUPABASE_SERVICE_ROLE_KEY)
npm run seed:test -- 100 # Seeds 100 synthetic users
```
*Developer matching harness (local only): `/dev/matching`.*

---

## 🗄 Schema Notes

Full table map, ownership, and “do not query” notes are documented in **[SCHEMA.md](./SCHEMA.md)**.

* **Path 2 handoff for Path 3:** consume `get_my_active_circle()` / `circle_members`, then build chat/plans on `circles` / `activities` via `/circles/[id]`.
* **Campus (Path 4):** `sync_my_communities`, `create_campus_group`, `create_plan_from_post`, `create_circle_from_post`, `campus_search`.
* **Trust & Safety (Path 5):** private Circle Karma, blocks, reports, Code of Conduct, Circle rules — never expose numeric Karma publicly.
* **Types:** Generated types: `src/lib/supabase/database.types.ts`. Use `InterestRow` for catalog interests — Path 2’s demo `Interest` union lives in `src/lib/types.ts`.

---

## 🚧 Known Limitations & Next Steps

**Known Limitations:**
* **Manual Match Trigger:** The matching algorithm currently runs when the user explicitly interacts with the flow, rather than passively matching in the background via cron jobs.
* **Basic Chat:** The chat system within `/circles` is functional for coordinating plans, but currently lacks real-time typing indicators and read receipts.
* **Location Proximity:** Proximity matching relies on static residence hall selection rather than dynamic geolocation mapping.

**Next Steps:**
* **Real-time WebSockets:** Upgrade the Circle hubs to use full real-time subscriptions for instant messaging.
* **Event API Integration:** Pull in actual university event feeds so newly formed Circles have immediate, verifiable suggestions for their "First Mission."
* **ML-Weighted Interests:** Implement a system to assign "weight" to shared interests, prioritizing niche overlap over broad hobbies.
