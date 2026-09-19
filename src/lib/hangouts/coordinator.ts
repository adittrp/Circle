import type { CampusLocation } from "@/lib/supabase/database.types";
import {
  bestOverlap,
  nextOccurrence,
  spontaneousStart,
} from "./availability";
import { catalogForMood, type CatalogItem } from "./catalog";
import type {
  CoordinatorInput,
  CoordinatorSuggestion,
  HangoutMood,
  SocialCoordinator,
} from "./types";
import { MOOD_TO_LOCATION } from "./types";

const UNSAFE_LOCATION = /\b(bar|apartment|house|airbnb|residence hall room)\b/i;
const DRINKING = /\b(bar|drink|alcohol|beer|shots)\b/i;
const PARTY = /\b(party|club|bar crawl)\b/i;

export function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function sharedInterestNames(input: CoordinatorInput): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const member of input.members) {
    for (const name of new Set(member.interestNames)) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function resolveMood(input: CoordinatorInput, shared: { name: string; count: number }[]): HangoutMood {
  if (input.mood && input.mood !== "Surprise Me") return input.mood;
  if (input.rules?.study_focused) return "Study";
  const top = shared[0]?.name.toLowerCase() ?? "";
  if (/(gym|sport|fitness|intramural)/.test(top)) return "Active";
  if (/(food|coffee|dining)/.test(top)) return "Food";
  if (/(study|coding|library)/.test(top)) return "Study";
  if (/(party|concert|night)/.test(top)) return "Go Out";
  if (/(explore|outdoor|travel)/.test(top)) return "Explore";
  return "Chill";
}

function allowedItem(item: CatalogItem, input: CoordinatorInput, firstMission: boolean) {
  const blob = `${item.title} ${item.description}`.toLowerCase();
  if (input.rules?.no_drinking && DRINKING.test(blob)) return false;
  if (input.rules?.no_parties && PARTY.test(blob)) return false;
  if ((firstMission || input.rules?.public_campus_only) && UNSAFE_LOCATION.test(blob)) return false;
  if (input.rules?.low_cost && !item.tags.includes("low-cost") && !item.tags.includes("easy")) {
    return item.tags.includes("food") || item.tags.includes("study");
  }
  return true;
}

function likedMoods(input: CoordinatorInput): Set<string> {
  const byId = new Map(input.previousActivities.map((a) => [a.id, a]));
  const liked = new Set<string>();
  for (const row of input.feedback) {
    const activity = byId.get(row.activityId);
    if (!activity?.mood) continue;
    if (row.emoji === "🔥" || row.emoji === "🙂" || row.hangAgain === "yes") {
      liked.add(activity.mood);
    }
  }
  return liked;
}

function avoidedTitles(input: CoordinatorInput): Set<string> {
  const byId = new Map(input.previousActivities.map((a) => [a.id, a]));
  const avoided = new Set<string>();
  for (const row of input.feedback) {
    const activity = byId.get(row.activityId);
    if (!activity) continue;
    if (row.emoji === "😕" || row.hangAgain === "no") avoided.add(activity.title);
  }
  return avoided;
}

export function pickCampusLocation(
  locations: CampusLocation[],
  mood: HangoutMood,
  seed: number,
  opts: { publicOnly?: boolean } = {}
): CampusLocation | null {
  const category = MOOD_TO_LOCATION[mood];
  const safe = locations.filter((loc) => {
    if (UNSAFE_LOCATION.test(loc.name)) return false;
    if (opts.publicOnly && loc.category === "dining") return true;
    return true;
  });
  const preferred = safe.filter((loc) => loc.category === category);
  const verified = (preferred.length ? preferred : safe).sort((a, b) => {
    if (a.data_status === b.data_status) return a.name.localeCompare(b.name);
    return a.data_status === "verified" ? -1 : 1;
  });
  if (!verified.length) return null;
  return verified[seed % verified.length];
}

function buildReason(
  input: CoordinatorInput,
  overlapLabel: string | null,
  shared: { name: string; count: number }[],
  firstMission: boolean
) {
  const total = Math.max(input.members.length, 1);
  const foodCount = Math.max(
    0,
    ...shared.filter((s) => /food|coffee|dining/.test(s.name.toLowerCase())).map((s) => s.count)
  );
  const top = shared.filter((s) => s.count >= Math.max(2, Math.ceil(total / 2))).slice(0, 3);
  const sharedPhrase = top.map((t) => t.name.toLowerCase()).join(", ");

  if (firstMission && overlapLabel && foodCount >= Math.max(2, Math.ceil(total * 0.6))) {
    return `${overlapLabel}, and ${foodCount} of you said you like trying new food.`;
  }
  if (overlapLabel && sharedPhrase) {
    return `${overlapLabel}, and you share ${sharedPhrase}.`;
  }
  if (overlapLabel) return `${overlapLabel} — an easy time to actually meet.`;
  if (sharedPhrase) return `You share ${sharedPhrase} — keeping this low-friction.`;
  return `An easy hang on the ${input.universityName} campus.`;
}

function suggestionFromParts(
  input: CoordinatorInput,
  mood: HangoutMood,
  item: CatalogItem,
  firstMission: boolean
): CoordinatorSuggestion {
  const overlap = bestOverlap(input.members);
  const seed = hashSeed(
    [
      input.circleId,
      mood,
      item.title,
      ...(input.previousActivities.map((a) => a.title)),
      ...(input.feedback.map((f) => f.emoji ?? "")),
    ].join("|")
  );
  const location = pickCampusLocation(input.campusLocations, mood, seed, {
    publicOnly: firstMission || Boolean(input.rules?.public_campus_only),
  });
  const now = input.now ?? new Date();
  const start = input.spontaneous
    ? spontaneousStart(now)
    : overlap
      ? nextOccurrence(overlap.weekday, overlap.time_window, now, Boolean(input.rules?.early_evening))
      : nextOccurrence(4, "evening", now, Boolean(input.rules?.early_evening));

  const shared = sharedInterestNames(input);
  const reason = buildReason(
    input,
    overlap ? `${overlap.count}/${overlap.total} free ${overlap.label.toLowerCase()}` : null,
    shared,
    firstMission
  );

  return {
    title: item.title,
    category: firstMission ? "First Mission" : mood,
    emoji: item.emoji,
    description: item.description,
    locationId: location?.id ?? null,
    locationLabel: location?.name ?? `On the ${input.universityName} campus`,
    startTime: start.toISOString(),
    durationMinutes: item.durationMinutes,
    reason,
  };
}

export class CampusAwareCoordinator implements SocialCoordinator {
  async generateFirstMission(input: CoordinatorInput): Promise<CoordinatorSuggestion> {
    const shared = sharedInterestNames(input);
    let mood: HangoutMood = "Food";
    if (input.rules?.study_focused) mood = "Study";
    else if (shared.some((s) => /food|coffee/.test(s.name.toLowerCase()) && s.count >= 2)) mood = "Food";
    const items = catalogForMood(mood === "Study" ? "Study" : "First Mission").filter((item) =>
      allowedItem(item, input, true)
    );
    const pick = items[0] ?? catalogForMood("First Mission")[0];
    return suggestionFromParts(input, mood === "Study" ? "Study" : "Food", pick, true);
  }

  async generateActivity(input: CoordinatorInput): Promise<CoordinatorSuggestion> {
    const shared = sharedInterestNames(input);
    const mood = resolveMood(input, shared);
    const liked = likedMoods(input);
    const avoided = avoidedTitles(input);
    let items = catalogForMood(mood).filter((item) => allowedItem(item, input, false));
    items = items.filter((item) => !avoided.has(item.title));
    if (!items.length) items = catalogForMood("Chill").filter((item) => allowedItem(item, input, false));
    if (liked.has(mood) && items.length > 1) {
      items = [...items.filter((i) => i.tags.includes("easy")), ...items];
    }
    const seed = hashSeed(
      [input.circleId, mood, ...(input.previousActivities.map((a) => a.title))].join("|")
    );
    const pick = items[seed % items.length] ?? catalogForMood("Food")[0];
    return suggestionFromParts(input, mood, pick, false);
  }
}

let coordinator: SocialCoordinator = new CampusAwareCoordinator();

export function getHangoutCoordinator(): SocialCoordinator {
  return coordinator;
}

export function setHangoutCoordinator(next: SocialCoordinator) {
  coordinator = next;
}
