import { CAMPUS_LOCATIONS } from "@/lib/constants";
import {
  defaultCircleRules,
  filterActivitiesByRules,
  pickFirstMeetLocation,
  type ActivityConstraintTag,
  type CircleRuleSet,
} from "@/lib/trust/core";
import type {
  Activity,
  ActivityFeedback,
  ActivityMood,
  Interest,
  StudentProfile,
  SuggestedActivity,
  User,
} from "@/lib/types";

export interface CoordinatorInput {
  user: User;
  members: StudentProfile[];
  availabilityHint?: string;
  interests?: Interest[];
  previousActivities?: Activity[];
  feedback?: ActivityFeedback[];
  mood?: ActivityMood;
  spontaneous?: boolean;
  safety?: { firstMeet: boolean; rules: CircleRuleSet };
}

export interface SocialCoordinator {
  generateActivity(input: CoordinatorInput): Promise<SuggestedActivity>;
  generateFirstMission(input: CoordinatorInput): Promise<SuggestedActivity>;
}

function sharedInterests(user: User, members: StudentProfile[]): Interest[] {
  const counts = new Map<Interest, number>();
  for (const i of user.vibe.interests) counts.set(i, (counts.get(i) ?? 0) + 1);
  for (const m of members) {
    for (const i of m.interests) counts.set(i, (counts.get(i) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([i]) => i);
}

function bestSharedSlot(user: User, members: StudentProfile[]): string {
  const counts = new Map<string, number>();
  for (const s of user.availability) counts.set(s, (counts.get(s) ?? 0) + 1);
  for (const m of members) {
    for (const s of m.availability) counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return best?.[0] ?? "Thursday evening";
}

function slotToSchedule(slot: string): { date: string; time: string } {
  const map: Record<string, { date: string; time: string }> = {
    "Monday evening": { date: "Monday", time: "7:00 PM" },
    "Tuesday evening": { date: "Tuesday", time: "7:30 PM" },
    "Wednesday evening": { date: "Wednesday", time: "7:00 PM" },
    "Thursday evening": { date: "Thursday", time: "8:30 PM" },
    "Friday evening": { date: "Friday", time: "8:00 PM" },
    "Saturday afternoon": { date: "Saturday", time: "2:00 PM" },
    "Saturday evening": { date: "Saturday", time: "7:30 PM" },
    "Sunday afternoon": { date: "Sunday", time: "2:30 PM" },
  };
  return map[slot] ?? { date: "Thursday", time: "8:00 PM" };
}

function preferredLocation(
  mood: ActivityMood | "First Mission",
  dorm: string,
  safety?: { firstMeet: boolean; rules: CircleRuleSet }
): string {
  if (safety?.firstMeet) {
    return pickFirstMeetLocation(dorm, safety.rules ?? defaultCircleRules());
  }
  if (mood === "Active") return "Gregory Gym";
  if (mood === "Study") return "PCL";
  if (mood === "Chill") return "Texas Union";
  if (mood === "Go Out") {
    if (safety?.rules.noDrinking || safety?.rules.noParties) return "South Mall Lawn";
    return "The Drag";
  }
  if (mood === "Food" || mood === "First Mission") {
    if (dorm.includes("Jester")) return "Jester City Limits";
    return "Texas Union";
  }
  return CAMPUS_LOCATIONS[0];
}

function moodFromInterests(interests: Interest[]): ActivityMood {
  if (interests.includes("Gym") || interests.includes("Sports") || interests.includes("Intramurals"))
    return "Active";
  if (interests.includes("Food") || interests.includes("Exploring Austin") || interests.includes("Coffee"))
    return "Food";
  if (interests.includes("Studying") || interests.includes("Coding")) return "Study";
  if (interests.includes("Parties") || interests.includes("Concerts")) return "Go Out";
  return "Chill";
}

function activityCatalog(mood: ActivityMood | "First Mission"): Array<{
  title: string;
  emoji: string;
  description: string;
  duration: string;
  tags: ActivityConstraintTag[];
}> {
  switch (mood) {
    case "First Mission":
    case "Food":
      return [
        {
          title: "Taco Tuesday",
          emoji: "🌮",
          description: "A low-key food run to break the ice — no agenda, just good tacos.",
          duration: "60–90 min",
          tags: ["campus_public", "food", "low_cost"],
        },
        {
          title: "Late Night Food Run",
          emoji: "🍔",
          description: "Grab something greasy and walk it off around campus.",
          duration: "45–60 min",
          tags: ["campus_public", "food", "low_cost", "late_night"],
        },
        {
          title: "Coffee Catch-up",
          emoji: "☕",
          description: "Easy conversation fuel near campus.",
          duration: "45 min",
          tags: ["campus_public", "food", "low_cost"],
        },
        {
          title: "Go to a bar",
          emoji: "🍻",
          description: "Grab a drink off campus.",
          duration: "2 hrs",
          tags: ["drinking", "bar", "late_night"],
        },
      ];
    case "Active":
      return [
        {
          title: "Basketball",
          emoji: "🏀",
          description: "Pickup hoops — show up, shoot around, no pressure.",
          duration: "60–90 min",
          tags: ["campus_public", "active", "low_cost"],
        },
        {
          title: "Gym Session",
          emoji: "💪",
          description: "Lift or cardio together at Gregory.",
          duration: "60 min",
          tags: ["campus_public", "active", "low_cost"],
        },
        {
          title: "South Mall Walk",
          emoji: "🚶",
          description: "Stretch your legs and talk between classes energy.",
          duration: "30–45 min",
          tags: ["campus_public", "active", "low_cost"],
        },
      ];
    case "Chill":
      return [
        {
          title: "Union Hang",
          emoji: "🎮",
          description: "Low-key games and hanging out at the Union.",
          duration: "90 min",
          tags: ["campus_public", "chill", "low_cost"],
        },
        {
          title: "Movie Night Setup",
          emoji: "🎬",
          description: "Pick a film and claim a cozy corner.",
          duration: "2 hrs",
          tags: ["campus_public", "chill", "low_cost"],
        },
      ];
    case "Study":
      return [
        {
          title: "PCL Study Block",
          emoji: "📚",
          description: "Co-working with optional snack break halfway.",
          duration: "90 min",
          tags: ["campus_public", "study", "low_cost"],
        },
        {
          title: "Quiet Focus Hour",
          emoji: "✏️",
          description: "Headphones in, check-in after sixty minutes.",
          duration: "60 min",
          tags: ["campus_public", "study", "low_cost"],
        },
      ];
    case "Go Out":
      return [
        {
          title: "Drag Night Walk",
          emoji: "🎉",
          description: "Wander Guadalupe, people-watch, grab a treat.",
          duration: "90 min",
          tags: ["campus_public", "low_cost"],
        },
        {
          title: "Campus Concert Check",
          emoji: "🎵",
          description: "See what's happening and decide together.",
          duration: "2 hrs",
          tags: ["campus_public", "low_cost"],
        },
        {
          title: "House party",
          emoji: "🪩",
          description: "A private party off campus.",
          duration: "3 hrs",
          tags: ["party", "private_residence", "late_night", "drinking"],
        },
      ];
    case "Surprise Me":
    default:
      return [
        {
          title: "Campus Adventure",
          emoji: "🎲",
          description: "A spontaneous plan based on who's free right now.",
          duration: "60 min",
          tags: ["campus_public", "low_cost"],
        },
      ];
  }
}

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function positiveMoods(feedback: ActivityFeedback[] = []): Set<string> {
  return new Set(
    feedback.filter((f) => f.emoji === "🔥" || f.emoji === "🙂").map((f) => f.activityId)
  );
}

function applySafety<T extends { title: string; tags: ActivityConstraintTag[] }>(
  catalog: T[],
  safety?: { firstMeet: boolean; rules: CircleRuleSet }
): T[] {
  const rules = safety?.rules ?? defaultCircleRules();
  const constrained = safety?.firstMeet ? { ...rules, publicCampusOnly: true } : rules;
  const filtered = filterActivitiesByRules(catalog, constrained);
  return filtered.length > 0 ? filtered : catalog.filter((c) => c.tags.includes("campus_public"));
}

export class MockSocialCoordinator implements SocialCoordinator {
  async generateFirstMission(input: CoordinatorInput): Promise<SuggestedActivity> {
    const slot = bestSharedSlot(input.user, input.members);
    const schedule = slotToSchedule(slot);
    const safety = {
      firstMeet: true,
      rules: input.safety?.rules ?? defaultCircleRules(),
    };
    const catalog = applySafety(activityCatalog("First Mission"), safety);
    const pick = catalog[0];

    let exploreFood = 0;
    if (
      input.user.vibe.interests.includes("Food") ||
      input.user.vibe.interests.includes("Exploring Austin")
    )
      exploreFood++;
    for (const m of input.members) {
      if (m.interests.includes("Food") || m.interests.includes("Exploring Austin"))
        exploreFood++;
    }

    const reason =
      exploreFood >= 3
        ? `Everyone is free, and ${exploreFood} of you said you're interested in exploring Austin food.`
        : `Your schedules line up ${slot.toLowerCase()}, and this is an easy first hang.`;

    return {
      title: pick.title,
      emoji: pick.emoji,
      description: pick.description,
      location: preferredLocation("First Mission", input.user.profile.dorm || "Jester West", {
        firstMeet: true,
        rules: input.safety?.rules ?? defaultCircleRules(),
      }),
      date: schedule.date,
      time: schedule.time,
      reason,
      estimatedDuration: pick.duration,
      mood: "First Mission",
    };
  }

  async generateActivity(input: CoordinatorInput): Promise<SuggestedActivity> {
    const shared = sharedInterests(input.user, input.members);
    const mood =
      input.mood && input.mood !== "Surprise Me"
        ? input.mood
        : moodFromInterests(shared.length ? shared : input.user.vibe.interests);

    const catalog = applySafety(
      activityCatalog(mood === "Surprise Me" ? "Food" : mood),
      input.safety
    );
    const seed = hashSeed(
      [
        input.user.id,
        mood,
        ...(input.previousActivities?.map((a) => a.title) ?? []),
        ...(input.feedback?.map((f) => f.emoji) ?? []),
      ].join("|")
    );
    let pick = catalog[seed % catalog.length];

    // Bias toward positively rated activity types
    const liked = positiveMoods(input.feedback);
    const likedActivities = (input.previousActivities ?? []).filter((a) =>
      liked.has(a.id)
    );
    if (likedActivities.some((a) => a.emoji === "🏀") && mood === "Active") {
      pick = catalog.find((c) => c.title === "Basketball") ?? pick;
    }

    const slot = input.availabilityHint ?? bestSharedSlot(input.user, input.members);
    const schedule = input.spontaneous
      ? { date: "Tonight", time: "Leave in 15 minutes" }
      : slotToSchedule(slot);

    const freeCount = Math.min(
      5,
      2 + (shared.length % 3) + (input.spontaneous ? 1 : 0)
    );

    const reason = input.spontaneous
      ? `${freeCount} people in your Circle are free right now.`
      : shared[0]
        ? `Built around your shared love of ${shared[0].toLowerCase()}.`
        : "A simple plan that fits your group's vibe.";

    return {
      title: pick.title,
      emoji: pick.emoji,
      description: pick.description,
      location: preferredLocation(mood, input.user.profile.dorm || "Jester West", input.safety),
      date: schedule.date,
      time: schedule.time,
      reason,
      estimatedDuration: pick.duration,
      mood,
    };
  }
}

let coordinator: SocialCoordinator = new MockSocialCoordinator();

export function getSocialCoordinator(): SocialCoordinator {
  return coordinator;
}

/** Swap in an LLM-backed coordinator later without changing callers. */
export function setSocialCoordinator(next: SocialCoordinator) {
  coordinator = next;
}
