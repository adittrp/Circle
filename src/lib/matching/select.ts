import { scoreGroup, scorePair } from "./score";
import {
  DEFAULT_MATCH_WEIGHTS,
  type MatchCandidate,
  type MatchResult,
  type MatchWeights,
  targetCompanionCount,
} from "./types";
import { generateWhyTogether } from "./why";

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map((c) => [first, ...c]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

export interface SelectOptions {
  weights?: MatchWeights;
  companionCount?: number;
  shortlistSize?: number;
  maxCombinations?: number;
  preferredIds?: string[];
  isDemo?: boolean;
}

/**
 * Select companions that maximize group chemistry + role balance.
 * Scores GROUPS, not just top pairwise matches.
 */
export function selectCircleCompanions(
  seeker: MatchCandidate,
  pool: MatchCandidate[],
  options: SelectOptions = {}
): MatchResult {
  const started = performance.now();
  const weights = options.weights ?? DEFAULT_MATCH_WEIGHTS;
  const companionCount =
    options.companionCount ?? targetCompanionCount(seeker.groupSize);
  const shortlistSize = options.shortlistSize ?? 16;
  const maxCombinations = options.maxCombinations ?? 2000;

  if (options.isDemo && options.preferredIds?.length) {
    const preferred = options.preferredIds
      .map((id) => pool.find((p) => p.id === id))
      .filter((p): p is MatchCandidate => Boolean(p));
    if (preferred.length === companionCount) {
      const breakdown = scoreGroup(seeker, preferred, weights);
      const pairScores = preferred.map((c) => scorePair(seeker, c, weights));
      return {
        seeker,
        companions: preferred,
        groupSize: companionCount + 1,
        score: breakdown.total,
        breakdown,
        pairScores,
        why: generateWhyTogether(seeker, preferred),
        eligibleCount: pool.length,
        shortlistCount: preferred.length,
        combinationsEvaluated: 1,
        runtimeMs: performance.now() - started,
        usedSyntheticFill: preferred.some((p) => p.isSynthetic),
      };
    }
  }

  const sameUni = pool.filter((p) => p.universityId === seeker.universityId);
  const ranked = sameUni
    .map((s) => scorePair(seeker, s, weights))
    .sort((a, b) => b.score - a.score);

  const needed = Math.min(companionCount, ranked.length);
  const shortlist = ranked
    .slice(0, Math.min(shortlistSize, ranked.length))
    .map((r) => r.candidate);

  let best = shortlist.slice(0, needed);
  let bestBreakdown = scoreGroup(seeker, best, weights);
  let evaluated = 1;

  if (needed >= 2 && shortlist.length >= needed) {
    const combos = combinations(shortlist, needed);
    const limited =
      combos.length > maxCombinations ? combos.slice(0, maxCombinations) : combos;
    for (const combo of limited) {
      evaluated += 1;
      const breakdown = scoreGroup(seeker, combo, weights);
      if (breakdown.total > bestBreakdown.total) {
        bestBreakdown = breakdown;
        best = combo;
      }
    }
  }

  const pairScores = best.map((c) => scorePair(seeker, c, weights));

  return {
    seeker,
    companions: best,
    groupSize: best.length + 1,
    score: bestBreakdown.total,
    breakdown: bestBreakdown,
    pairScores,
    why: generateWhyTogether(seeker, best),
    eligibleCount: sameUni.length,
    shortlistCount: shortlist.length,
    combinationsEvaluated: evaluated,
    runtimeMs: performance.now() - started,
    usedSyntheticFill: best.some((p) => p.isSynthetic),
  };
}
