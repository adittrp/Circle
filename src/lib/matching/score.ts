import {
  DEFAULT_MATCH_WEIGHTS,
  type AvailabilitySlotKey,
  type GroupScoreBreakdown,
  type MatchCandidate,
  type MatchWeights,
  type PairScore,
} from "./types";

function overlapRatio(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  const shared = a.filter((x) => setB.has(x)).length;
  return shared / Math.max(a.length, b.length);
}

const YEAR_ORDER = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"] as const;

function yearScore(a: string | null, b: string | null): number {
  if (!a || !b) return 0.5;
  const d = Math.abs(YEAR_ORDER.indexOf(a as (typeof YEAR_ORDER)[number]) - YEAR_ORDER.indexOf(b as (typeof YEAR_ORDER)[number]));
  if (d < 0 || Number.isNaN(d)) return 0.5;
  if (d === 0) return 1;
  if (d === 1) return 0.8;
  if (d === 2) return 0.55;
  return 0.3;
}

function proximityScore(a?: string | null, b?: string | null): number {
  if (!a || !b) return 0.4;
  if (a === b) return 1;
  const an = a.toLowerCase();
  const bn = b.toLowerCase();
  if (an.includes("jester") && bn.includes("jester")) return 0.85;
  if (an.includes("west campus") && bn.includes("west campus")) return 0.75;
  if (an.includes("off") && bn.includes("off")) return 0.55;
  return 0.35;
}

function socialCompat(a: number, b: number): number {
  return Math.max(0, 1 - Math.abs(a - b) / 100);
}

function majorScore(a?: string | null, b?: string | null): number {
  if (!a || !b) return 0.45;
  if (a === b) return 1;
  const stem = /engineer|computer|math|physics|chemistry|biology|data/i;
  if (stem.test(a) && stem.test(b)) return 0.7;
  return 0.35;
}

export function scorePair(
  seeker: MatchCandidate,
  candidate: MatchCandidate,
  weights: MatchWeights = DEFAULT_MATCH_WEIGHTS
): PairScore {
  const interestOverlap = overlapRatio(seeker.interestIds, candidate.interestIds);
  const scheduleOverlap = overlapRatio(seeker.availability, candidate.availability);
  const proximity = proximityScore(seeker.residenceName, candidate.residenceName);
  const socialCompatibility = socialCompat(seeker.socialEnergy, candidate.socialEnergy);
  const activityCompatibility = overlapRatio(seeker.interestNames, candidate.interestNames);
  const yearCompatibility = yearScore(seeker.year, candidate.year);
  const majorCompatibility = majorScore(seeker.majorName, candidate.majorName);

  const score =
    interestOverlap * weights.interestOverlap +
    scheduleOverlap * weights.scheduleOverlap +
    proximity * weights.proximityScore +
    socialCompatibility * weights.socialCompatibility +
    activityCompatibility * weights.activityCompatibility +
    yearCompatibility * weights.yearCompatibility +
    majorCompatibility * weights.majorCompatibility;

  return {
    candidate,
    score,
    breakdown: {
      interestOverlap,
      scheduleOverlap,
      proximityScore: proximity,
      socialCompatibility,
      activityCompatibility,
      yearCompatibility,
      majorCompatibility,
    },
  };
}

export function planningBalance(styles: (string | null | undefined)[]): number {
  const normalized = styles.filter(Boolean) as string[];
  if (!normalized.length) return 0.5;

  const counts = {
    initiator: normalized.filter((s) => s === "I'm making the plan").length,
    suggester: normalized.filter((s) => s === "I'll suggest something").length,
    showUp: normalized.filter((s) => s === "I'll show up").length,
    follower: normalized.filter((s) => s === "Please just tell me where to be").length,
  };

  if (counts.follower === normalized.length) return 0.1;
  if (counts.initiator === normalized.length) return 0.35;
  if (counts.initiator + counts.suggester === 0) return 0.25;

  const rolesPresent =
    (counts.initiator > 0 ? 1 : 0) +
    (counts.suggester > 0 ? 1 : 0) +
    (counts.showUp > 0 ? 1 : 0) +
    (counts.follower > 0 ? 1 : 0);

  return 0.45 + rolesPresent * 0.13;
}

export function groupScheduleOverlap(lists: AvailabilitySlotKey[][]): number {
  if (!lists.length) return 0;
  const counts = new Map<string, number>();
  for (const slots of lists) {
    for (const s of new Set(slots)) {
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
  }
  const best = Math.max(...counts.values(), 0);
  return best / lists.length;
}

export function groupInterestOverlap(lists: string[][]): number {
  const counts = new Map<string, number>();
  for (const list of lists) {
    for (const i of new Set(list)) {
      counts.set(i, (counts.get(i) ?? 0) + 1);
    }
  }
  const shared = [...counts.values()].filter((c) => c >= 3).length;
  return Math.min(1, shared / 4);
}

function majorDiversity(majors: (string | null | undefined)[]): number {
  const named = majors.filter(Boolean) as string[];
  if (named.length <= 1) return 0.5;
  const unique = new Set(named).size;
  // Prefer some shared ground + some variety.
  const ratio = unique / named.length;
  if (ratio === 1) return 0.7;
  if (ratio >= 0.4) return 1;
  return 0.45;
}

export function scoreGroup(
  seeker: MatchCandidate,
  companions: MatchCandidate[],
  weights: MatchWeights = DEFAULT_MATCH_WEIGHTS
): GroupScoreBreakdown {
  if (!companions.length) {
    return { avgPair: 0, balance: 0, schedule: 0, interests: 0, majorDiversity: 0, total: 0 };
  }

  const pairScores = companions.map((c) => scorePair(seeker, c, weights).score);
  const avgPair = pairScores.reduce((a, b) => a + b, 0) / companions.length;
  const balance = planningBalance([
    seeker.planningStyle,
    ...companions.map((c) => c.planningStyle),
  ]);
  const schedule = groupScheduleOverlap([
    seeker.availability,
    ...companions.map((c) => c.availability),
  ]);
  const interests = groupInterestOverlap([
    seeker.interestNames,
    ...companions.map((c) => c.interestNames),
  ]);
  const majors = majorDiversity([
    seeker.majorName,
    ...companions.map((c) => c.majorName),
  ]);

  const total =
    avgPair * 0.52 +
    balance * weights.groupBalance +
    schedule * 0.16 +
    interests * 0.1 +
    majors * 0.07;

  return { avgPair, balance, schedule, interests, majorDiversity: majors, total };
}
