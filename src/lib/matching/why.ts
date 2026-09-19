import { formatSlotLabel, type MatchCandidate } from "./types";

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/**
 * Human-readable "Why we put you together" lines from real shared data.
 * No fake percentages.
 */
export function generateWhyTogether(
  seeker: MatchCandidate,
  companions: MatchCandidate[]
): string[] {
  const all = [seeker, ...companions];
  const observations: string[] = [];

  const interestCounts = new Map<string, number>();
  for (const person of all) {
    for (const i of new Set(person.interestNames)) {
      interestCounts.set(i, (interestCounts.get(i) ?? 0) + 1);
    }
  }
  const sharedAtLeast2 = [...interestCounts.entries()].filter(([, c]) => c >= 2);
  if (sharedAtLeast2.length) {
    observations.push(
      `You have ${plural(sharedAtLeast2.length, "shared interest")} across the group.`
    );
  }
  const strong = sharedAtLeast2.sort((a, b) => b[1] - a[1]).slice(0, 3);
  for (const [name, count] of strong) {
    observations.push(
      count === all.length
        ? `Everyone is into ${name.toLowerCase()}.`
        : `${count} of you share ${name.toLowerCase()}.`
    );
  }

  const slotCounts = new Map<string, number>();
  for (const person of all) {
    for (const s of new Set(person.availability)) {
      slotCounts.set(s, (slotCounts.get(s) ?? 0) + 1);
    }
  }
  const bestSlot = [...slotCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (bestSlot && bestSlot[1] >= Math.ceil(all.length * 0.6)) {
    const label = formatSlotLabel(
      bestSlot[0] as `${number}:${"morning" | "afternoon" | "evening"}`
    );
    observations.push(
      bestSlot[1] === all.length
        ? `All of you are free ${label.toLowerCase()}.`
        : `${bestSlot[1]} of you are free ${label.toLowerCase()}.`
    );
  }

  const hallCounts = new Map<string, number>();
  for (const p of all) {
    if (!p.residenceName) continue;
    hallCounts.set(p.residenceName, (hallCounts.get(p.residenceName) ?? 0) + 1);
  }
  const sameHall = [...hallCounts.entries()].find(([, c]) => c >= 2);
  if (sameHall) {
    observations.push(`${sameHall[1]} of you live near ${sameHall[0]}.`);
  } else if (all.filter((p) => p.residenceName).length >= 3) {
    observations.push("You're all on the same campus — close enough to make plans stick.");
  }

  const yearCounts = new Map<string, number>();
  for (const p of all) {
    if (!p.year) continue;
    yearCounts.set(p.year, (yearCounts.get(p.year) ?? 0) + 1);
  }
  const topYear = [...yearCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topYear && topYear[1] >= 2) {
    const label =
      topYear[0] === "Freshman" && topYear[1] > 1
        ? "freshmen"
        : `${topYear[0].toLowerCase()}${topYear[1] > 1 ? "s" : ""}`;
    observations.push(`${topYear[1]} of you are ${label}.`);
  }

  const majorCounts = new Map<string, number>();
  for (const p of all) {
    if (!p.majorName) continue;
    majorCounts.set(p.majorName, (majorCounts.get(p.majorName) ?? 0) + 1);
  }
  const topMajor = [...majorCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topMajor && topMajor[1] >= 2) {
    observations.push(`${topMajor[1]} of you study ${topMajor[0]}.`);
  }

  const sleepCounts = new Map<string, number>();
  for (const p of all) {
    if (!p.sleepSchedule) continue;
    sleepCounts.set(p.sleepSchedule, (sleepCounts.get(p.sleepSchedule) ?? 0) + 1);
  }
  const nightOwls = sleepCounts.get("Night owl") ?? 0;
  if (nightOwls >= 3) {
    observations.push(
      nightOwls === all.length
        ? "All of you are night owls."
        : `${nightOwls} of you are night owls.`
    );
  }

  const styles = all.map((p) => p.planningStyle).filter(Boolean) as string[];
  const hasInitiator = styles.some(
    (s) => s === "I'm making the plan" || s === "I'll suggest something"
  );
  const hasFollower = styles.some(
    (s) => s === "Please just tell me where to be" || s === "I'll show up"
  );
  if (hasInitiator && hasFollower) {
    observations.push(
      "The group mixes people who start plans with people happy to join them."
    );
  }

  return [...new Set(observations)].slice(0, 5);
}
