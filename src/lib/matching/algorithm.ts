import { AVAILABILITY_SLOTS, DORMS } from "@/lib/constants";
import type {
  AvailabilitySlot,
  Interest,
  StudentProfile,
  User,
} from "@/lib/types";
import { selectCircleCompanions } from "./select";
import { scoreGroup, scorePair } from "./score";
import {
  type AvailabilitySlotKey,
  type MatchCandidate,
} from "./types";
import { generateWhyTogether } from "./why";

const DEMO_SLOT_MAP: Record<AvailabilitySlot, AvailabilitySlotKey> = {
  "Monday evening": "1:evening",
  "Tuesday evening": "2:evening",
  "Wednesday evening": "3:evening",
  "Thursday evening": "4:evening",
  "Friday evening": "5:evening",
  "Saturday afternoon": "6:afternoon",
  "Saturday evening": "6:evening",
  "Sunday afternoon": "0:afternoon",
};

export function demoSlotsToKeys(slots: AvailabilitySlot[]): AvailabilitySlotKey[] {
  return slots.map((s) => DEMO_SLOT_MAP[s]).filter(Boolean);
}

export function studentToCandidate(student: StudentProfile, universityId = "demo-ut"): MatchCandidate {
  return {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    avatarUrl: student.avatar,
    universityId,
    year: student.year,
    majorName: student.major,
    residenceName: student.dorm,
    hometown: student.hometown,
    interestIds: student.interests,
    interestNames: student.interests,
    availability: demoSlotsToKeys(student.availability),
    socialEnergy: student.socialEnergy,
    planningStyle: student.planningStyle,
    sleepSchedule: student.sleepSchedule,
    groupSize: student.idealGroupSize,
    lookingFor: student.lookingFor,
    isSynthetic: false,
  };
}

export function userToCandidate(user: User, universityId = "demo-ut"): MatchCandidate {
  return {
    id: user.id,
    firstName: user.profile.firstName || "You",
    universityId,
    year: (user.profile.year || null) as MatchCandidate["year"],
    majorName: user.profile.major || null,
    residenceName: user.profile.dorm || null,
    hometown: user.profile.hometown || null,
    interestIds: user.vibe.interests,
    interestNames: user.vibe.interests,
    availability: demoSlotsToKeys(user.availability),
    socialEnergy: user.vibe.socialEnergy,
    planningStyle: user.vibe.planningStyle,
    sleepSchedule: user.vibe.sleepSchedule,
    groupSize: user.vibe.idealGroupSize,
    lookingFor: user.vibe.lookingFor,
    isSynthetic: false,
  };
}

/** Backward-compatible demo API used by DemoContext. */
export function scorePairDemo(user: User, candidate: StudentProfile) {
  const seeker = userToCandidate(user);
  const other = studentToCandidate(candidate);
  const scored = scorePair(seeker, other);
  return {
    student: candidate,
    score: scored.score,
    breakdown: scored.breakdown,
  };
}

export function scoreGroupDemo(user: User, members: StudentProfile[]): number {
  return scoreGroup(userToCandidate(user), members.map((m) => studentToCandidate(m))).total;
}

export function matchCircle(
  user: User,
  pool: StudentProfile[],
  groupSize = 4,
  options?: { excludedIds?: Iterable<string> }
): StudentProfile[] {
  const seeker = userToCandidate(user);
  const candidates = pool.map((p) => studentToCandidate(p));
  const result = selectCircleCompanions(seeker, candidates, {
    companionCount: groupSize,
    isDemo: user.isDemo,
    preferredIds: ["s01", "s02", "s03", "s08"],
    excludedIds: options?.excludedIds,
  });
  const byId = new Map(pool.map((p) => [p.id, p]));
  return result.companions.map((c) => byId.get(c.id)!).filter(Boolean);
}

export function generateWhyThisCircle(user: User, members: StudentProfile[]): string[] {
  return generateWhyTogether(
    userToCandidate(user),
    members.map((m) => studentToCandidate(m))
  );
}

// Re-export dorm helper remnants for any older imports.
export { DORMS, AVAILABILITY_SLOTS };
export type { Interest };
