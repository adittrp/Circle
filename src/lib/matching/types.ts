import type { YearLevel } from "@/lib/supabase/database.types";

export type AvailabilitySlotKey = `${number}:${"morning" | "afternoon" | "evening"}`;

export interface MatchCandidate {
  id: string;
  firstName: string;
  lastName?: string | null;
  avatarUrl?: string | null;
  universityId: string;
  year: YearLevel | null;
  majorId?: string | null;
  majorName?: string | null;
  residenceHallId?: string | null;
  residenceName?: string | null;
  hometown?: string | null;
  bio?: string | null;
  isSynthetic?: boolean;
  interestIds: string[];
  interestNames: string[];
  /** Canonical slots like "4:evening" (weekday:window). */
  availability: AvailabilitySlotKey[];
  socialEnergy: number;
  planningStyle: string | null;
  sleepSchedule: string | null;
  groupSize: string | null;
  weekendStyle?: string | null;
  lookingFor?: string[];
}

export interface MatchWeights {
  interestOverlap: number;
  scheduleOverlap: number;
  proximityScore: number;
  socialCompatibility: number;
  activityCompatibility: number;
  yearCompatibility: number;
  majorCompatibility: number;
  groupBalance: number;
}

export const DEFAULT_MATCH_WEIGHTS: MatchWeights = {
  interestOverlap: 0.26,
  scheduleOverlap: 0.22,
  proximityScore: 0.1,
  socialCompatibility: 0.1,
  activityCompatibility: 0.1,
  yearCompatibility: 0.07,
  majorCompatibility: 0.05,
  groupBalance: 0.15,
};

export interface PairScore {
  candidate: MatchCandidate;
  score: number;
  breakdown: Record<string, number>;
}

export interface GroupScoreBreakdown {
  avgPair: number;
  balance: number;
  schedule: number;
  interests: number;
  majorDiversity: number;
  total: number;
}

export interface MatchResult {
  seeker: MatchCandidate;
  companions: MatchCandidate[];
  groupSize: number;
  score: number;
  breakdown: GroupScoreBreakdown;
  pairScores: PairScore[];
  why: string[];
  eligibleCount: number;
  shortlistCount: number;
  combinationsEvaluated: number;
  runtimeMs: number;
  usedSyntheticFill: boolean;
}

export function slotKey(weekday: number, timeWindow: string): AvailabilitySlotKey {
  return `${weekday}:${timeWindow}` as AvailabilitySlotKey;
}

export function formatSlotLabel(slot: AvailabilitySlotKey): string {
  const [day, window] = slot.split(":") as [string, string];
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const d = days[Number(day)] ?? "sometime";
  return `${d} ${window}`;
}

export function targetCompanionCount(groupSizePref: string | null | undefined): number {
  switch (groupSizePref) {
    case "2–3":
      return 2;
    case "6–8":
    case "The more the better":
      return 5;
    case "4–5":
    default:
      return 4;
  }
}
