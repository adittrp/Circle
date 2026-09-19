import type { CommunityStanding, KarmaKind, ReportCategory } from "@/lib/supabase/database.types";

export const CONDUCT_DOCUMENT_KEY = "code_of_conduct";
export const CONDUCT_DOCUMENT_VERSION = 1;
export const KARMA_START = 500;
export const KARMA_FLOOR = 100;
export const KARMA_CEILING = 1200;

export const EVENT_DELTA: Record<KarmaKind, number> = {
  rsvp_kept: 12,
  meetup_completed: 12,
  plan_organized: 18,
  consistent_participation: 8,
  university_verified: 40,
  identity_verified: 25,
  rsvp_accepted: 0,
  late_cancellation: -8,
  no_show: -20,
  confirmed_spam: -40,
  confirmed_harassment: -80,
  confirmed_rule_violation: -50,
};

export function clampKarma(value: number) {
  return Math.min(KARMA_CEILING, Math.max(KARMA_FLOOR, value));
}

export function standingLabel(standing: CommunityStanding) {
  switch (standing) {
    case "good":
      return "Good";
    case "limited":
      return "Needs a little care";
    case "restricted":
      return "Limited for now";
    case "suspended":
      return "Paused";
  }
}

export function reliabilityFromCounts(plansAccepted: number, plansAttended: number) {
  if (plansAccepted === 0) {
    return {
      label: "Getting started" as const,
      message: "Show up when you say you will — people will be able to count on you.",
    };
  }
  const ratio = plansAttended / plansAccepted;
  if (plansAccepted >= 6 && ratio >= 0.85) {
    return {
      label: "Excellent" as const,
      message: "Great job — people can count on you.",
    };
  }
  if (ratio >= 0.7) {
    return {
      label: "Great" as const,
      message: "You're showing up. That is what makes Circles work.",
    };
  }
  return {
    label: "Building" as const,
    message: "Keep going. Reliability grows every time you follow through.",
  };
}

export function privilegesForKarma(karma: number, standing: CommunityStanding) {
  const usable = standing === "suspended" ? KARMA_FLOOR : karma;
  const extraCircles = usable >= 700 && standing === "good";
  const largerActivities = usable >= 780 && standing !== "restricted" && standing !== "suspended";
  const largerCommunities = usable >= 900 && standing === "good";
  return {
    matchingCooldownHours: standing === "limited" ? 48 : standing === "restricted" ? 72 : 24,
    maxPublicCircles: extraCircles ? 2 : 1,
    maxCommunityMembers: largerCommunities ? 200 : 80,
    maxActivitySize: largerActivities ? 16 : 8,
    canCreateExtraPublicCircles: extraCircles,
    canOrganizeLargerActivities: largerActivities,
  };
}

export type CircleRuleSet = {
  noDrinking: boolean;
  noSmoking: boolean;
  studyFocused: boolean;
  age18Plus: boolean;
  noParties: boolean;
  publicCampusOnly: boolean;
  lowCost: boolean;
  accessibilityNeeded: boolean;
  earlyEvening: boolean;
  notes?: string;
};

export function defaultCircleRules(): CircleRuleSet {
  return {
    noDrinking: false,
    noSmoking: false,
    studyFocused: false,
    age18Plus: false,
    noParties: false,
    publicCampusOnly: true,
    lowCost: false,
    accessibilityNeeded: false,
    earlyEvening: false,
  };
}

export type ActivityConstraintTag =
  | "campus_public"
  | "food"
  | "low_cost"
  | "study"
  | "active"
  | "chill"
  | "drinking"
  | "bar"
  | "smoking"
  | "party"
  | "private_residence"
  | "late_night"
  | "paid";

export function activityViolatesRules(
  activity: { title: string; tags: readonly ActivityConstraintTag[]; location?: string },
  rules: CircleRuleSet
) {
  const tags = new Set(activity.tags);
  if (rules.noDrinking && (tags.has("drinking") || tags.has("bar"))) return true;
  if (rules.noSmoking && tags.has("smoking")) return true;
  if (rules.noParties && tags.has("party")) return true;
  if (rules.publicCampusOnly && (tags.has("private_residence") || tags.has("bar"))) return true;
  if (rules.studyFocused && (tags.has("party") || tags.has("bar") || tags.has("drinking"))) return true;
  if (rules.lowCost && tags.has("paid")) return true;
  if (rules.earlyEvening && tags.has("late_night")) return true;
  if (activity.location && rules.noDrinking && /\bbar\b|club/i.test(activity.location)) return true;
  if (activity.location && rules.publicCampusOnly && /apartment|house|residence|dorm room/i.test(activity.location))
    return true;
  return false;
}

export function filterActivitiesByRules<T extends { title: string; tags: readonly ActivityConstraintTag[] }>(
  activities: T[],
  rules: CircleRuleSet
) {
  return activities.filter((a) => !activityViolatesRules(a, rules));
}

export function isBlockedEitherWay(
  blocks: Array<{ blocker_id: string; blocked_id: string }>,
  a: string,
  b: string
) {
  return blocks.some(
    (row) =>
      (row.blocker_id === a && row.blocked_id === b) || (row.blocker_id === b && row.blocked_id === a)
  );
}

export function canReadReputation(actorId: string, targetId: string, moderator = false) {
  return moderator || actorId === targetId;
}

export function canSeeReport(
  actorId: string,
  report: { reporter_id: string; subject_profile_id: string | null },
  moderator = false
) {
  if (moderator) return true;
  if (report.subject_profile_id === actorId) return false;
  return report.reporter_id === actorId;
}

export const CODE_OF_CONDUCT = {
  title: "Circle Code of Conduct",
  intro: "Circle helps students meet in real life. These rules keep that from getting weird, unsafe, or unkind.",
  items: [
    { id: "respect", title: "Respect other students", body: "Treat people like classmates, not content." },
    { id: "harassment", title: "No harassment", body: "Do not follow, pressure, insult, or repeatedly contact someone who asked for space." },
    { id: "hate", title: "No hate speech", body: "No slurs, dehumanizing language, or targeting people for who they are." },
    { id: "threats", title: "No threats", body: "Do not threaten anyone, online or in person." },
    { id: "boundaries", title: "Respect boundaries", body: "If someone says no — to a plan, a photo, a ride — that is the end of it." },
    { id: "pressure", title: "Do not pressure anyone into activities", body: "Circles are optional. Nobody owes you their time." },
    { id: "spam", title: "No spam", body: "Don't flood chats, drop ads, or recruit for unrelated projects." },
    { id: "impersonate", title: "Do not impersonate other students", body: "Use your own name and university email." },
    { id: "campus", title: "Follow university and public-location rules", body: "Meet where you are allowed to be." },
  ],
  footer: "If something feels off, you can leave a Circle, block someone, or report it.",
} as const;

export const CIRCLE_RULE_OPTIONS: Array<{ key: keyof CircleRuleSet; title: string; description: string }> = [
  { key: "noDrinking", title: "No drinking", description: "Plans should not involve alcohol." },
  { key: "noSmoking", title: "No smoking / vaping", description: "Keep meetups smoke-free." },
  { key: "studyFocused", title: "Study-focused", description: "Prefer libraries and quiet work." },
  { key: "age18Plus", title: "18+ only", description: "Where legally and product-appropriate." },
  { key: "noParties", title: "No parties", description: "Skip loud nightlife and house parties." },
  { key: "publicCampusOnly", title: "Public campus meetups only", description: "Stay in shared campus or public spaces." },
  { key: "lowCost", title: "Low-cost activities", description: "Keep plans cheap or free." },
  { key: "accessibilityNeeded", title: "Accessibility considerations", description: "Prefer step-free, well-lit spots." },
  { key: "earlyEvening", title: "Early-evening activities", description: "Wrap up earlier rather than late-night." },
];

export const REPORT_CATEGORIES: Array<{ id: ReportCategory; label: string }> = [
  { id: "harassment", label: "Harassment" },
  { id: "spam", label: "Spam" },
  { id: "threatening_behavior", label: "Threatening behavior" },
  { id: "hate_discrimination", label: "Hate / discrimination" },
  { id: "unsafe_behavior", label: "Unsafe behavior" },
  { id: "fake_account", label: "Fake account" },
  { id: "inappropriate_content", label: "Inappropriate content" },
  { id: "other", label: "Other" },
];

export const LEAVE_REASONS = [
  { id: "not_clicking" as const, label: "Not clicking with the group" },
  { id: "schedule" as const, label: "Schedule doesn't work" },
  { id: "no_longer_interested" as const, label: "No longer interested" },
  { id: "felt_uncomfortable" as const, label: "Felt uncomfortable", safetyRelated: true },
  { id: "other" as const, label: "Other" },
];

export const KARMA_EXPLAINER = {
  title: "How Circle Karma works",
  lead: "Circle rewards behavior that makes groups work.",
  positives: ["Show up when you say you will", "Help organize plans", "Participate constructively"],
  negatives:
    "Your Karma may decrease for repeated no-shows or confirmed violations of Circle's community rules.",
  privacy: "Your exact Karma is private. Other students see things like University Verified — not a score.",
  reports: "A report by itself does not change anyone's Karma. Only a confirmed safety-team decision can.",
};

export function pickFirstMeetLocation(dorm: string, rules: CircleRuleSet) {
  if (rules.noDrinking || rules.publicCampusOnly) {
    if (dorm.toLowerCase().includes("jester")) return "Jester City Limits";
    return "Texas Union";
  }
  return dorm.toLowerCase().includes("jester") ? "Jester City Limits" : "Texas Union";
}

export function coordinatorSafetyPrompt(rules: CircleRuleSet, firstMeet: boolean) {
  const lines = [
    "Safety constraints for suggested activities:",
    "- Do not recommend private residences as first-meet locations.",
    "- Prefer dining halls, libraries, student unions, rec centers, and campus coffee shops.",
  ];
  if (firstMeet || rules.publicCampusOnly) lines.push("- Public campus locations only.");
  if (rules.noDrinking) lines.push("- Never recommend bars, clubs, or drinking.");
  if (rules.noSmoking) lines.push("- No smoking or vaping venues.");
  if (rules.noParties) lines.push("- No parties or nightlife events.");
  if (rules.studyFocused) lines.push("- Prefer study-friendly, quieter plans.");
  if (rules.lowCost) lines.push("- Keep activities free or low-cost.");
  if (rules.earlyEvening) lines.push("- Prefer early evening, not late night.");
  if (rules.accessibilityNeeded) lines.push("- Prefer accessible, well-lit meeting points.");
  return lines.join("\n");
}
