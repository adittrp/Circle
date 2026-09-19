import type { Activity, Circle, CircleStage, CircleStrength } from "@/lib/types";

export function computeCircleStage(completedMeetups: number): CircleStage {
  if (completedMeetups <= 0) return "Introduced";
  if (completedMeetups === 1) return "Met Once";
  if (completedMeetups === 2) return "Met Again";
  return "Regular Group";
}

export function computeCircleStrength(
  circle: Circle,
  activities: Activity[]
): CircleStrength {
  const completed = activities.filter((a) => a.status === "completed");
  const upcoming = activities.filter((a) => a.status === "upcoming");

  let attendanceSum = 0;
  let attendanceCount = 0;
  for (const a of [...completed, ...upcoming]) {
    const statuses = Object.values(a.rsvps);
    if (statuses.length === 0) continue;
    const ins = statuses.filter((s) => s === "in").length;
    attendanceSum += ins / statuses.length;
    attendanceCount++;
  }

  const avgAttendance = attendanceCount ? attendanceSum / attendanceCount : 0;
  const activeMembers = new Set<string>();
  for (const a of activities) {
    for (const [id, status] of Object.entries(a.rsvps)) {
      if (status === "in") activeMembers.add(id);
    }
  }

  const formed = new Date(circle.formedAt).getTime();
  const weeksTogether = Math.max(
    1,
    Math.ceil((Date.now() - formed) / (7 * 24 * 60 * 60 * 1000))
  );

  const meetupScore = Math.min(40, completed.length * 14);
  const attendanceScore = Math.round(avgAttendance * 35);
  const activeScore = Math.min(25, activeMembers.size * 5);
  const percent = Math.min(96, Math.round(meetupScore + attendanceScore + activeScore));

  const stage = computeCircleStage(completed.length);

  return {
    percent: completed.length === 0 && upcoming.some((a) => Object.values(a.rsvps).includes("in"))
      ? Math.max(18, percent)
      : percent || 8,
    completedMeetups: completed.length,
    activeMembers: Math.max(activeMembers.size, 1),
    weeksTogether,
    stage,
  };
}

export const STAGE_FLOW: CircleStage[] = [
  "Introduced",
  "Met Once",
  "Met Again",
  "Regular Group",
];
