import { DORMS, WEIGHTS } from "@/lib/constants";
import type {
  AvailabilitySlot,
  Interest,
  PlanningStyle,
  StudentProfile,
  User,
  Year,
} from "@/lib/types";

export interface ScoredCandidate {
  student: StudentProfile;
  score: number;
  breakdown: Record<string, number>;
}

function overlap<T>(a: T[], b: T[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  const shared = a.filter((x) => setB.has(x)).length;
  return shared / Math.max(a.length, b.length);
}

function dormProximity(a: string, b: string): number {
  if (a === b) return 1;
  const jester = ["Jester West", "Jester East"];
  if (jester.includes(a) && jester.includes(b)) return 0.85;
  const idxA = DORMS.indexOf(a as (typeof DORMS)[number]);
  const idxB = DORMS.indexOf(b as (typeof DORMS)[number]);
  if (idxA < 0 || idxB < 0) return 0.4;
  const dist = Math.abs(idxA - idxB);
  return Math.max(0.25, 1 - dist * 0.15);
}

function yearScore(a: Year | "", b: Year): number {
  if (!a) return 0.5;
  const order: Year[] = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"];
  const d = Math.abs(order.indexOf(a) - order.indexOf(b));
  if (d === 0) return 1;
  if (d === 1) return 0.8;
  if (d === 2) return 0.55;
  return 0.3;
}

function socialCompat(userEnergy: number, other: number): number {
  const diff = Math.abs(userEnergy - other);
  return Math.max(0, 1 - diff / 100);
}

function activityCompat(userInterests: Interest[], other: StudentProfile): number {
  return overlap(userInterests, other.interests);
}

function userAsSignals(user: User) {
  return {
    interests: user.vibe.interests,
    availability: user.availability,
    dorm: user.profile.dorm,
    year: user.profile.year as Year | "",
    socialEnergy: user.vibe.socialEnergy,
    planningStyle: user.vibe.planningStyle as PlanningStyle,
    sleepSchedule: user.vibe.sleepSchedule,
    lookingFor: user.vibe.lookingFor,
  };
}

export function scorePair(
  user: User,
  candidate: StudentProfile
): ScoredCandidate {
  const u = userAsSignals(user);
  const interestOverlap = overlap(u.interests, candidate.interests);
  const scheduleOverlap = overlap(u.availability, candidate.availability);
  const proximityScore = dormProximity(u.dorm, candidate.dorm);
  const socialCompatibility = socialCompat(u.socialEnergy, candidate.socialEnergy);
  const activityCompatibility = activityCompat(u.interests, candidate);
  const yearCompatibility = yearScore(u.year, candidate.year);

  const score =
    interestOverlap * WEIGHTS.interestOverlap +
    scheduleOverlap * WEIGHTS.scheduleOverlap +
    proximityScore * WEIGHTS.proximityScore +
    socialCompatibility * WEIGHTS.socialCompatibility +
    activityCompatibility * WEIGHTS.activityCompatibility +
    yearCompatibility * WEIGHTS.yearCompatibility;

  return {
    student: candidate,
    score,
    breakdown: {
      interestOverlap,
      scheduleOverlap,
      proximityScore,
      socialCompatibility,
      activityCompatibility,
      yearCompatibility,
    },
  };
}

function planningBalance(styles: PlanningStyle[]): number {
  const counts = {
    initiator: styles.filter((s) => s === "I'm making the plan").length,
    suggester: styles.filter((s) => s === "I'll suggest something").length,
    showUp: styles.filter((s) => s === "I'll show up").length,
    follower: styles.filter((s) => s === "Please just tell me where to be").length,
  };

  // Penalize all-followers or all-initiators
  if (counts.follower === styles.length) return 0.1;
  if (counts.initiator === styles.length) return 0.35;
  if (counts.initiator + counts.suggester === 0) return 0.25;

  // Reward mixed roles
  const rolesPresent =
    (counts.initiator > 0 ? 1 : 0) +
    (counts.suggester > 0 ? 1 : 0) +
    (counts.showUp > 0 ? 1 : 0) +
    (counts.follower > 0 ? 1 : 0);

  return 0.45 + rolesPresent * 0.13;
}

function groupScheduleOverlap(slotsLists: AvailabilitySlot[][]): number {
  if (slotsLists.length === 0) return 0;
  const counts = new Map<AvailabilitySlot, number>();
  for (const slots of slotsLists) {
    for (const s of new Set(slots)) {
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
  }
  const best = Math.max(...counts.values(), 0);
  return best / slotsLists.length;
}

function groupInterestOverlap(lists: Interest[][]): number {
  const counts = new Map<Interest, number>();
  for (const list of lists) {
    for (const i of new Set(list)) {
      counts.set(i, (counts.get(i) ?? 0) + 1);
    }
  }
  const shared = [...counts.values()].filter((c) => c >= 3).length;
  return Math.min(1, shared / 4);
}

export function scoreGroup(
  user: User,
  members: StudentProfile[]
): number {
  const u = userAsSignals(user);
  const pairScores = members.map((m) => scorePair(user, m).score);
  const avgPair = pairScores.reduce((a, b) => a + b, 0) / members.length;

  const styles = [u.planningStyle, ...members.map((m) => m.planningStyle)].filter(
    Boolean
  ) as PlanningStyle[];
  const balance = planningBalance(styles);

  const schedule = groupScheduleOverlap([
    u.availability,
    ...members.map((m) => m.availability),
  ]);
  const interests = groupInterestOverlap([
    u.interests,
    ...members.map((m) => m.interests),
  ]);

  return (
    avgPair * 0.55 +
    balance * WEIGHTS.groupBalance +
    schedule * 0.18 +
    interests * 0.12
  );
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map((c) => [first, ...c]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

/**
 * Select 4 companions that maximize group compatibility + role balance.
 * Searches top pairwise candidates then evaluates group combinations.
 * Demo mode prefers a curated high-chemistry group when scores are close.
 */
export function matchCircle(
  user: User,
  pool: StudentProfile[],
  groupSize = 4,
  options?: { excludedIds?: Iterable<string> }
): StudentProfile[] {
  const excluded = new Set(options?.excludedIds ?? []);
  const eligible = pool.filter((p) => !excluded.has(p.id) && p.id !== user.id);

  const preferredIds = ["s01", "s02", "s03", "s08"];
  const preferred = preferredIds
    .map((id) => eligible.find((p) => p.id === id))
    .filter((p): p is StudentProfile => Boolean(p));

  if (preferred.length === groupSize && user.isDemo) {
    return preferred;
  }

  const ranked = eligible
    .map((s) => scorePair(user, s))
    .sort((a, b) => b.score - a.score);

  const shortlist = ranked.slice(0, Math.min(16, ranked.length)).map((r) => r.student);

  let best: StudentProfile[] = shortlist.slice(0, groupSize);
  let bestScore = scoreGroup(user, best);

  const combos = combinations(shortlist, groupSize);
  const limited = combos.length > 2000 ? combos.slice(0, 2000) : combos;

  for (const combo of limited) {
    const s = scoreGroup(user, combo);
    if (s > bestScore) {
      bestScore = s;
      best = combo;
    }
  }

  return best;
}
