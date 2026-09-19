import { describe, expect, it } from "vitest";
import { matchCircle, scorePairDemo, userToCandidate, studentToCandidate } from "@/lib/matching/algorithm";
import { planningBalance, scoreGroup, scorePair } from "@/lib/matching/score";
import { selectCircleCompanions } from "@/lib/matching/select";
import type { MatchCandidate } from "@/lib/matching/types";
import { SEED_STUDENTS } from "@/data/students";
import type { StudentProfile, User } from "@/lib/types";

function baseCandidate(overrides: Partial<MatchCandidate> = {}): MatchCandidate {
  return {
    id: "a",
    firstName: "Alex",
    universityId: "ut",
    year: "Sophomore",
    majorName: "Computer Science",
    residenceName: "Jester West",
    interestIds: ["gaming", "food"],
    interestNames: ["Gaming", "Food"],
    availability: ["4:evening", "5:evening"],
    socialEnergy: 60,
    planningStyle: "I'll suggest something",
    sleepSchedule: "Normal",
    groupSize: "4–5",
    ...overrides,
  };
}

const demoUser: User = {
  id: "user-demo",
  isDemo: true,
  availability: ["Thursday evening", "Friday evening", "Saturday afternoon"],
  profile: {
    firstName: "Alex",
    university: "University of Texas at Austin",
    year: "Sophomore",
    major: "Computer Science",
    dorm: "Jester West",
    hometown: "Austin, TX",
  },
  vibe: {
    fridayNight: "Movie or games",
    foodText: "Where?",
    idealGroupSize: "4–5",
    socialEnergy: 55,
    planningStyle: "I'll suggest something",
    interests: ["Gaming", "Food", "Coffee"],
    sleepSchedule: "Normal",
    lookingFor: ["A close friend group"],
  },
};

describe("matching invariants", () => {
  it("never selects candidates from another university", () => {
    const seeker = baseCandidate({ id: "me", universityId: "ut" });
    const pool = [
      baseCandidate({ id: "same", universityId: "ut", interestIds: ["gaming"], interestNames: ["Gaming"] }),
      baseCandidate({
        id: "other",
        universityId: "tamu",
        interestIds: ["gaming", "food", "music"],
        interestNames: ["Gaming", "Food", "Music"],
        availability: ["4:evening", "5:evening", "6:afternoon"],
      }),
    ];
    const result = selectCircleCompanions(seeker, pool, { companionCount: 1 });
    expect(result.companions.every((c) => c.universityId === "ut")).toBe(true);
    expect(result.companions.find((c) => c.id === "other")).toBeUndefined();
  });

  it("raises score when availability overlaps", () => {
    const seeker = baseCandidate();
    const shared = baseCandidate({
      id: "shared",
      availability: ["4:evening", "5:evening"],
    });
    const disjoint = baseCandidate({
      id: "disjoint",
      availability: ["1:morning"],
    });
    expect(scorePair(seeker, shared).score).toBeGreaterThan(scorePair(seeker, disjoint).score);
  });

  it("raises score when interests overlap", () => {
    const seeker = baseCandidate({ interestIds: ["a", "b", "c"], interestNames: ["A", "B", "C"] });
    const close = baseCandidate({ id: "c1", interestIds: ["a", "b"], interestNames: ["A", "B"] });
    const far = baseCandidate({ id: "c2", interestIds: ["z"], interestNames: ["Z"] });
    expect(scorePair(seeker, close).score).toBeGreaterThan(scorePair(seeker, far).score);
  });

  it("group balance penalizes all-followers vs mixed roles", () => {
    const allFollowers = planningBalance([
      "Please just tell me where to be",
      "Please just tell me where to be",
      "Please just tell me where to be",
    ]);
    const mixed = planningBalance([
      "I'm making the plan",
      "I'll suggest something",
      "I'll show up",
    ]);
    expect(mixed).toBeGreaterThan(allFollowers);
  });

  it("group scoring prefers balanced planning styles", () => {
    const seeker = baseCandidate({ planningStyle: "Please just tell me where to be" });
    const followers = [
      baseCandidate({ id: "f1", planningStyle: "Please just tell me where to be" }),
      baseCandidate({ id: "f2", planningStyle: "Please just tell me where to be" }),
      baseCandidate({ id: "f3", planningStyle: "Please just tell me where to be" }),
    ];
    const mixed = [
      baseCandidate({ id: "m1", planningStyle: "I'm making the plan" }),
      baseCandidate({ id: "m2", planningStyle: "I'll suggest something" }),
      baseCandidate({ id: "m3", planningStyle: "I'll show up" }),
    ];
    expect(scoreGroup(seeker, mixed).total).toBeGreaterThan(scoreGroup(seeker, followers).total);
  });

  it("demo matchCircle returns curated group for demo users", () => {
    const matched = matchCircle(demoUser, SEED_STUDENTS as StudentProfile[], 4);
    expect(matched).toHaveLength(4);
    expect(matched.map((m) => m.id).sort()).toEqual(["s01", "s02", "s03", "s08"].sort());
  });

  it("demo adapters preserve university isolation via selectCircleCompanions", () => {
    const seeker = userToCandidate(demoUser, "ut");
    const pool = (SEED_STUDENTS as StudentProfile[]).map((s) => studentToCandidate(s, "ut"));
    const other = studentToCandidate(SEED_STUDENTS[0] as StudentProfile, "tamu");
    const result = selectCircleCompanions(seeker, [...pool, other], { companionCount: 4 });
    expect(result.companions.every((c) => c.universityId === "ut")).toBe(true);
  });

  it("pair scoring works through demo wrapper", () => {
    const scored = scorePairDemo(demoUser, SEED_STUDENTS[0] as StudentProfile);
    expect(scored.score).toBeGreaterThan(0);
    expect(scored.breakdown.interestOverlap).toBeGreaterThanOrEqual(0);
  });
});
