import { describe, expect, it } from "vitest";
import { computeAvailabilityOverlap, nextOccurrence } from "@/lib/hangouts/availability";
import { CampusAwareCoordinator, pickCampusLocation } from "@/lib/hangouts/coordinator";
import { computeCircleMomentum, shouldBackOff, stageFromMeetups } from "@/lib/hangouts/momentum";
import type { CoordinatorInput, HangoutMember } from "@/lib/hangouts/types";
import type { CampusLocation } from "@/lib/supabase/database.types";

function member(
  id: string,
  partial: Partial<HangoutMember> = {}
): HangoutMember {
  return {
    id,
    firstName: id,
    lastName: null,
    avatarUrl: null,
    year: "Sophomore",
    major: "Computer Science",
    residence: null,
    interestNames: ["Food", "Coffee"],
    availability: [
      { weekday: 4, time_window: "evening" },
      { weekday: 6, time_window: "afternoon" },
    ],
    isYou: id === "you",
    ...partial,
  };
}

const utLocations: CampusLocation[] = [
  {
    id: "loc-gym",
    university_id: "ut",
    name: "Gregory Gym",
    category: "gym",
    data_status: "verified",
  },
  {
    id: "loc-food",
    university_id: "ut",
    name: "Jester City Limits",
    category: "dining",
    data_status: "verified",
  },
];

const tamuLocations: CampusLocation[] = [
  {
    id: "loc-tamu-food",
    university_id: "tamu",
    name: "Sbisa Dining Hall",
    category: "dining",
    data_status: "needs_review",
  },
  {
    id: "loc-tamu-lib",
    university_id: "tamu",
    name: "Sterling C. Evans Library",
    category: "library",
    data_status: "verified",
  },
];

function input(overrides: Partial<CoordinatorInput> = {}): CoordinatorInput {
  return {
    circleId: "circle-1",
    universityName: "University of Texas at Austin",
    campusLocations: utLocations,
    members: [member("you"), member("a"), member("b"), member("c")],
    previousActivities: [],
    feedback: [],
    ...overrides,
  };
}

describe("availability overlap", () => {
  it("scores a shared Thursday evening higher as more members are free", () => {
    const four = computeAvailabilityOverlap([
      member("1"),
      member("2"),
      member("3"),
      member("4"),
    ]);
    const thursday = four.find((w) => w.weekday === 4 && w.time_window === "evening");
    expect(thursday?.count).toBe(4);
    expect(thursday?.total).toBe(4);

    const mixed = computeAvailabilityOverlap([
      member("1"),
      member("2", { availability: [{ weekday: 2, time_window: "evening" }] }),
    ]);
    const mixedThursday = mixed.find((w) => w.weekday === 4 && w.time_window === "evening");
    expect(mixedThursday?.count).toBe(1);
  });

  it("schedules the next matching weekday after now", () => {
    const now = new Date("2026-09-17T12:00:00"); // Thursday
    const next = nextOccurrence(4, "evening", now);
    expect(next.getDay()).toBe(4);
    expect(next.getHours()).toBe(19);
    expect(next.getTime()).toBeGreaterThan(now.getTime());
  });
});

describe("campus-aware coordinator", () => {
  const coordinator = new CampusAwareCoordinator();

  it("uses the selected university catalog, not a hardcoded UT spot", async () => {
    const suggestion = await coordinator.generateFirstMission(
      input({
        universityName: "Texas A&M University",
        campusLocations: tamuLocations,
      })
    );
    expect(suggestion.locationLabel).toBe("Sbisa Dining Hall");
    expect(suggestion.locationLabel).not.toMatch(/Jester|Gregory/);
  });

  it("prefers dining for a first mission", () => {
    const loc = pickCampusLocation(utLocations, "First Mission", 0, { publicOnly: true });
    expect(loc?.category).toBe("dining");
  });

  it("is deterministic for the same circle and history", async () => {
    const a = await coordinator.generateActivity(input({ mood: "Active" }));
    const b = await coordinator.generateActivity(input({ mood: "Active" }));
    expect(a.title).toBe(b.title);
    expect(a.startTime).toBe(b.startTime);
  });

  it("avoids negatively rated titles on the next suggestion", async () => {
    const first = await coordinator.generateActivity(input({ mood: "Active" }));
    const next = await coordinator.generateActivity(
      input({
        mood: "Active",
        previousActivities: [{ id: "act-1", title: first.title, mood: "Active", emoji: "🏀" }],
        feedback: [{ activityId: "act-1", emoji: "😕", hangAgain: "no" }],
      })
    );
    expect(next.title).not.toBe(first.title);
  });

  it("does not suggest drinking when circle rules ban it", async () => {
    const suggestion = await coordinator.generateActivity(
      input({
        mood: "Go Out",
        rules: {
          no_drinking: true,
          no_parties: true,
          public_campus_only: true,
          study_focused: false,
          no_smoking: false,
          early_evening: true,
          low_cost: false,
        },
      })
    );
    expect(`${suggestion.title} ${suggestion.description}`.toLowerCase()).not.toMatch(/bar|beer|alcohol/);
  });
});

describe("circle momentum", () => {
  it("maps meetup counts onto hangout stages", () => {
    expect(stageFromMeetups(0)).toBe("Introduced");
    expect(stageFromMeetups(1)).toBe("Met Once");
    expect(stageFromMeetups(2)).toBe("Getting Together");
    expect(stageFromMeetups(3)).toBe("Active Circle");
  });

  it("backs off after the group has met several times", () => {
    expect(shouldBackOff(0)).toBe(false);
    expect(shouldBackOff(3)).toBe(true);
  });

  it("treats completed plans as momentum, not friendship science", () => {
    const formed = new Date("2026-09-01T00:00:00Z").toISOString();
    const now = new Date("2026-09-19T00:00:00Z");
    const momentum = computeCircleMomentum(
      { formed_at: formed, completed_meetups: 2, stage: "met_again" },
      [
        {
          id: "1",
          circle_id: "c",
          title: "Taco Run",
          emoji: "🌮",
          description: null,
          campus_location_id: null,
          location_label: "Dining",
          starts_at: "2026-09-10T00:00:00Z",
          duration_minutes: 60,
          reason: null,
          mood: "Food",
          status: "completed",
          created_by: null,
          is_spontaneous: false,
          created_at: "2026-09-08T00:00:00Z",
          rsvps: [
            { activity_id: "1", profile_id: "a", status: "in", updated_at: formed },
            { activity_id: "1", profile_id: "b", status: "in", updated_at: formed },
          ],
        },
      ],
      4,
      now
    );
    expect(momentum.completedMeetups).toBe(2);
    expect(momentum.stage).toBe("Getting Together");
    expect(momentum.percent).toBeGreaterThan(8);
  });
});
