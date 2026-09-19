import type {
  ActivityRow,
  ActivityRsvpRow,
  AvailabilityWindow,
  CampusLocation,
  CircleRulesRow,
  CircleRow,
  LocationCategory,
} from "@/lib/supabase/database.types";

export type HangoutMood =
  | "Food"
  | "Active"
  | "Chill"
  | "Study"
  | "Go Out"
  | "Explore"
  | "Surprise Me"
  | "First Mission";

export type HangoutRsvp = "pending" | "in" | "maybe" | "cant";

export type MomentumStage =
  | "Introduced"
  | "Met Once"
  | "Getting Together"
  | "Active Circle";

export interface AvailabilitySlot {
  weekday: number;
  time_window: AvailabilityWindow;
}

export interface HangoutMember {
  id: string;
  firstName: string;
  lastName: string | null;
  avatarUrl: string | null;
  year: string | null;
  major: string | null;
  residence: string | null;
  interestNames: string[];
  availability: AvailabilitySlot[];
  isYou: boolean;
}

export interface OverlapWindow {
  weekday: number;
  time_window: AvailabilityWindow;
  count: number;
  total: number;
  label: string;
}

export interface HangoutActivity extends ActivityRow {
  rsvps: ActivityRsvpRow[];
}

export interface CoordinatorInput {
  circleId: string;
  universityName: string;
  campusLocations: CampusLocation[];
  members: HangoutMember[];
  previousActivities: Array<{
    id: string;
    title: string;
    mood: string | null;
    emoji: string | null;
  }>;
  feedback: Array<{
    activityId: string;
    emoji: string | null;
    hangAgain: string | null;
  }>;
  mood?: HangoutMood;
  spontaneous?: boolean;
  now?: Date;
  rules?: Pick<
    CircleRulesRow,
    | "no_drinking"
    | "no_parties"
    | "public_campus_only"
    | "study_focused"
    | "no_smoking"
    | "early_evening"
    | "low_cost"
  > | null;
}

export interface CoordinatorSuggestion {
  title: string;
  category: HangoutMood;
  emoji: string;
  description: string;
  locationId: string | null;
  locationLabel: string;
  startTime: string;
  durationMinutes: number;
  reason: string;
}

export interface SocialCoordinator {
  generateFirstMission(input: CoordinatorInput): Promise<CoordinatorSuggestion>;
  generateActivity(input: CoordinatorInput): Promise<CoordinatorSuggestion>;
}

export interface CircleMomentum {
  percent: number;
  completedMeetups: number;
  activeMembers: number;
  weeksTogether: number;
  stage: MomentumStage;
  recentHangouts: number;
}

export interface HangoutBundle {
  circle: CircleRow;
  members: HangoutMember[];
  activities: HangoutActivity[];
  feedback: Array<{
    activity_id: string;
    profile_id: string;
    emoji: string | null;
    hang_again: string | null;
  }>;
  locations: CampusLocation[];
  universityName: string;
  rules: CircleRulesRow | null;
}

export const MOOD_TO_LOCATION: Record<HangoutMood, LocationCategory> = {
  Food: "dining",
  "First Mission": "dining",
  Active: "gym",
  Chill: "hangout",
  Study: "library",
  "Go Out": "hangout",
  Explore: "hangout",
  "Surprise Me": "hangout",
};

export const HANGOUT_MOODS: { mood: HangoutMood; emoji: string; label: string }[] = [
  { mood: "Food", emoji: "🍔", label: "Food" },
  { mood: "Active", emoji: "🏀", label: "Active" },
  { mood: "Chill", emoji: "🎮", label: "Chill" },
  { mood: "Study", emoji: "📚", label: "Study" },
  { mood: "Go Out", emoji: "🎉", label: "Go Out" },
  { mood: "Explore", emoji: "🗺", label: "Explore" },
  { mood: "Surprise Me", emoji: "🎲", label: "Surprise Me" },
];
