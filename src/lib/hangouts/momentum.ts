import type { CircleRow } from "@/lib/supabase/database.types";
import type { CircleMomentum, HangoutActivity, HangoutRsvp, MomentumStage } from "./types";

export const MOMENTUM_FLOW: MomentumStage[] = [
  "Introduced",
  "Met Once",
  "Getting Together",
  "Active Circle",
];

export function stageFromMeetups(completedMeetups: number): MomentumStage {
  if (completedMeetups <= 0) return "Introduced";
  if (completedMeetups === 1) return "Met Once";
  if (completedMeetups === 2) return "Getting Together";
  return "Active Circle";
}

export function dbStageForMeetups(completedMeetups: number): CircleRow["stage"] {
  if (completedMeetups <= 0) return "introduced";
  if (completedMeetups === 1) return "met_once";
  if (completedMeetups === 2) return "met_again";
  return "regular";
}

export function displayStage(stage: CircleRow["stage"] | MomentumStage): MomentumStage {
  if (stage === "introduced" || stage === "Introduced") return "Introduced";
  if (stage === "met_once" || stage === "Met Once") return "Met Once";
  if (stage === "met_again" || stage === "Getting Together") return "Getting Together";
  return "Active Circle";
}

/** Scaffolding should ease off once a group is hanging on its own. */
export function shouldBackOff(completedMeetups: number, stage?: CircleRow["stage"]) {
  return completedMeetups >= 3 || stage === "regular";
}

export function rsvpCounts(rsvps: { status: HangoutRsvp | string }[], memberCount: number) {
  const going = rsvps.filter((r) => r.status === "in").length;
  const maybe = rsvps.filter((r) => r.status === "maybe").length;
  return { going, maybe, total: Math.max(memberCount, rsvps.length) };
}

export function computeCircleMomentum(
  circle: Pick<CircleRow, "formed_at" | "completed_meetups" | "stage">,
  activities: HangoutActivity[],
  memberCount: number,
  now = new Date()
): CircleMomentum {
  const completed = activities.filter((a) => a.status === "completed");
  const completedMeetups = Math.max(circle.completed_meetups, completed.length);
  const twoWeeksAgo = now.getTime() - 14 * 24 * 60 * 60 * 1000;
  const recentHangouts = completed.filter((a) => {
    const stamp = a.starts_at ?? a.created_at;
    return new Date(stamp).getTime() >= twoWeeksAgo;
  }).length;

  const active = new Set<string>();
  const recentCutoff = now.getTime() - 21 * 24 * 60 * 60 * 1000;
  for (const activity of activities) {
    const stamp = new Date(activity.starts_at ?? activity.created_at).getTime();
    if (stamp < recentCutoff && activity.status !== "upcoming") continue;
    for (const rsvp of activity.rsvps) {
      if (rsvp.status === "in") active.add(rsvp.profile_id);
    }
  }

  const formed = new Date(circle.formed_at).getTime();
  const weeksTogether = Math.max(
    1,
    Math.ceil((now.getTime() - formed) / (7 * 24 * 60 * 60 * 1000))
  );

  const meetupScore = Math.min(40, completedMeetups * 14);
  const recencyScore = Math.min(25, recentHangouts * 12);
  const activeScore = Math.min(25, active.size * 5);
  const togetherScore = Math.min(10, weeksTogether * 2);
  const percent = Math.min(
    96,
    Math.round(meetupScore + recencyScore + activeScore + togetherScore) || 8
  );

  return {
    percent,
    completedMeetups,
    activeMembers: Math.max(active.size, completedMeetups > 0 ? 1 : 0),
    weeksTogether,
    stage: stageFromMeetups(completedMeetups),
    recentHangouts,
  };
}

export function memberCountForDisplay(memberCount: number) {
  return Math.max(memberCount, 1);
}
