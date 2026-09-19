import { describe, expect, it } from "vitest";
import { MockSocialCoordinator } from "@/lib/ai/socialCoordinator";
import { matchCircle } from "@/lib/matching/algorithm";
import { emptyVibe } from "@/lib/storage";
import type { StudentProfile, User } from "@/lib/types";
import {
  activityViolatesRules,
  canReadReputation,
  canSeeReport,
  filterActivitiesByRules,
  isBlockedEitherWay,
  privilegesForKarma,
} from "./core";
import { applyKarma, emptyMem } from "./memory";

function demoUser(id = "user-a"): User {
  return {
    id,
    isDemo: false,
    profile: {
      firstName: "Alex",
      university: "University of Texas at Austin",
      year: "Sophomore",
      major: "CS",
      dorm: "Jester West",
      hometown: "Austin",
    },
    vibe: { ...emptyVibe(), interests: ["Food", "Coffee"] },
    availability: ["Thursday evening", "Saturday afternoon"],
  };
}

function student(id: string, name: string): StudentProfile {
  return {
    id,
    firstName: name,
    lastName: "",
    avatar: "",
    major: "CS",
    year: "Sophomore",
    dorm: "Jester West",
    hometown: "Austin",
    interests: ["Food", "Coffee"],
    availability: ["Thursday evening", "Saturday afternoon"],
    socialEnergy: 50,
    planningStyle: "I'll show up",
    fridayNight: "Movie or games",
    foodText: "Where?",
    idealGroupSize: "4–5",
    sleepSchedule: "Normal",
    lookingFor: ["A close friend group"],
    activityPreferences: ["Food"],
  };
}

describe("blocks and matching", () => {
  it("does not match blocked users in either direction", () => {
    const blocks = [{ blocker_id: "user-a", blocked_id: "s-blocked" }];
    expect(isBlockedEitherWay(blocks, "user-a", "s-blocked")).toBe(true);
    const pool = [
      student("s-blocked", "Blake"),
      student("s-ok", "Casey"),
      student("s-ok2", "Drew"),
      student("s-ok3", "Eden"),
      student("s-ok4", "Fin"),
    ].filter((s) => !isBlockedEitherWay(blocks, "user-a", s.id));
    const matched = matchCircle(demoUser(), pool, 4);
    expect(matched.map((m) => m.id)).not.toContain("s-blocked");
  });
});

describe("private reputation", () => {
  it("does not let another normal user fetch private karma", () => {
    const state = emptyMem("user-a");
    applyKarma(state, "user-a", "rsvp_kept", "attended:1");
    expect(canReadReputation("user-b", "user-a")).toBe(false);
    expect(canReadReputation("user-a", "user-a")).toBe(true);
    expect(state.reputation["user-a"].karma).toBeGreaterThan(500);
  });
});

describe("reports privacy", () => {
  it("does not show reports to the reported user", () => {
    const report = {
      reporter_id: "user-a",
      subject_profile_id: "user-b",
    };
    expect(canSeeReport("user-b", report)).toBe(false);
    expect(canSeeReport("user-a", report)).toBe(true);
  });

  it("does not change karma from an unconfirmed report", () => {
    const state = emptyMem("user-b");
    const before = state.reputation["user-b"].karma;
    state.reports.push({
      id: "r1",
      reporter_id: "user-a",
      subject_profile_id: "user-b",
      category: "spam",
    });
    expect(state.reputation["user-b"].karma).toBe(before);
  });
});

describe("circle rules", () => {
  it("never suggests a bar when the Circle has no drinking", () => {
    const rules = {
      noDrinking: true,
      noSmoking: false,
      studyFocused: false,
      age18Plus: false,
      noParties: false,
      publicCampusOnly: true,
      lowCost: false,
      accessibilityNeeded: false,
      earlyEvening: false,
    };
    const catalog = [
      { title: "Coffee Catch-up", tags: ["campus_public", "food"] as const },
      { title: "Go to a bar", tags: ["drinking", "bar"] as const, location: "A bar on 6th" },
    ];
    expect(activityViolatesRules(catalog[1], rules)).toBe(true);
    expect(filterActivitiesByRules(catalog, rules).map((a) => a.title)).toEqual(["Coffee Catch-up"]);
  });
});

describe("social coordinator safety", () => {
  it("does not recommend a bar or house for a first meet", async () => {
    const coordinator = new MockSocialCoordinator();
    const suggestion = await coordinator.generateFirstMission({
      user: demoUser(),
      members: [student("s-ok", "Casey"), student("s-ok2", "Drew")],
      safety: {
        firstMeet: true,
        rules: {
          noDrinking: true,
          noSmoking: false,
          studyFocused: false,
          age18Plus: false,
          noParties: true,
          publicCampusOnly: true,
          lowCost: false,
          accessibilityNeeded: false,
          earlyEvening: false,
        },
      },
    });
    expect(suggestion.title.toLowerCase()).not.toMatch(/bar|house party/);
    expect(suggestion.location.toLowerCase()).not.toMatch(/apartment|house party|bar/);
  });
});

describe("attendance karma", () => {
  it("applies no-show events to the correct user only", () => {
    const state = emptyMem("user-a");
    applyKarma(state, "user-a", "no_show", "noshow:9");
    expect(state.reputation["user-a"].no_shows).toBe(1);
    expect(state.reputation["user-a"].karma).toBeLessThan(500);
    expect(state.reputation["user-b"]).toBeUndefined();
    expect(state.events.every((e) => e.profile_id === "user-a")).toBe(true);
  });

  it("creates a positive reputation event when attending a confirmed activity", () => {
    const state = emptyMem("user-a");
    applyKarma(state, "user-a", "rsvp_kept", "attended:10");
    applyKarma(state, "user-a", "plan_organized", "organized:10");
    expect(state.events.map((e) => e.kind)).toEqual(["rsvp_kept", "plan_organized"]);
    expect(state.reputation["user-a"].plans_attended).toBe(1);
    expect(state.reputation["user-a"].karma).toBeGreaterThan(500);
  });
});

describe("privileges", () => {
  it("lets new users keep core access", () => {
    const privileges = privilegesForKarma(500, "good");
    expect(privileges.maxPublicCircles).toBe(1);
    expect(privileges.maxActivitySize).toBeGreaterThanOrEqual(8);
  });
});
