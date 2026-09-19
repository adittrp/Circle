import type {
  AvailabilitySlot,
  Interest,
  StudentProfile,
  User,
} from "@/lib/types";

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export function generateWhyThisCircle(
  user: User,
  members: StudentProfile[]
): string[] {
  const all = [
    {
      interests: user.vibe.interests,
      availability: user.availability,
      sleep: user.vibe.sleepSchedule,
      lookingFor: user.vibe.lookingFor,
      dorm: user.profile.dorm,
    },
    ...members.map((m) => ({
      interests: m.interests,
      availability: m.availability,
      sleep: m.sleepSchedule,
      lookingFor: m.lookingFor,
      dorm: m.dorm,
    })),
  ];

  const observations: string[] = [];

  // Shared interests
  const interestCounts = new Map<Interest, number>();
  for (const person of all) {
    for (const i of new Set(person.interests)) {
      interestCounts.set(i, (interestCounts.get(i) ?? 0) + 1);
    }
  }
  const sharedInterests = [...interestCounts.entries()]
    .filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1]);

  const totalShared = [...interestCounts.entries()].filter(([, c]) => c >= 2).length;
  if (totalShared > 0) {
    observations.push(`You have ${plural(totalShared, "shared interest")} across the group.`);
  }

  for (const [interest, count] of sharedInterests.slice(0, 2)) {
    if (interest === "Exploring Austin") {
      observations.push(
        count === 5
          ? "Everyone wants to explore Austin."
          : `${count} of you want to explore Austin.`
      );
    } else if (interest === "Gym" || interest === "Sports" || interest === "Intramurals") {
      observations.push(`${count} of you are looking for gym / activity buddies.`);
    } else if (interest === "Food") {
      observations.push(`${count} of you get excited about food plans.`);
    } else {
      observations.push(`${count} of you are into ${interest.toLowerCase()}.`);
    }
  }

  // Sleep
  const sleepCounts = new Map<string, number>();
  for (const p of all) {
    if (!p.sleep) continue;
    sleepCounts.set(p.sleep, (sleepCounts.get(p.sleep) ?? 0) + 1);
  }
  const nightOwls = sleepCounts.get("Night owl") ?? 0;
  if (nightOwls >= 3) {
    observations.push(
      nightOwls === 5
        ? "All five of you are night owls."
        : `${nightOwls} of you are night owls.`
    );
  }

  // Availability
  const slotCounts = new Map<AvailabilitySlot, number>();
  for (const p of all) {
    for (const s of new Set(p.availability)) {
      slotCounts.set(s, (slotCounts.get(s) ?? 0) + 1);
    }
  }
  const bestSlot = [...slotCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (bestSlot && bestSlot[1] >= 3) {
    observations.push(
      bestSlot[1] === 5
        ? `Everyone is free ${bestSlot[0].toLowerCase()}.`
        : `${bestSlot[1]} of you are free ${bestSlot[0].toLowerCase()}.`
    );
  }

  // Looking for
  const lookingCounts = new Map<string, number>();
  for (const p of all) {
    for (const l of p.lookingFor) {
      lookingCounts.set(l, (lookingCounts.get(l) ?? 0) + 1);
    }
  }
  const topLooking = [...lookingCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topLooking && topLooking[1] >= 3) {
    observations.push(
      `${topLooking[1]} of you said you're looking for ${topLooking[0].toLowerCase()}.`
    );
  }

  // Proximity
  const dormCounts = new Map<string, number>();
  for (const p of all) {
    dormCounts.set(p.dorm, (dormCounts.get(p.dorm) ?? 0) + 1);
  }
  const sameDorm = [...dormCounts.entries()].find(([, c]) => c >= 2);
  if (sameDorm) {
    observations.push(`${sameDorm[1]} of you live in ${sameDorm[0]}.`);
  } else {
    observations.push("You're all within a short walk of each other on campus.");
  }

  // Dedupe and limit
  return [...new Set(observations)].slice(0, 5);
}
