export type Year =
  | "Freshman"
  | "Sophomore"
  | "Junior"
  | "Senior"
  | "Graduate";

export type Interest =
  | "Gaming"
  | "Gym"
  | "Sports"
  | "Food"
  | "Music"
  | "Movies"
  | "Parties"
  | "Outdoors"
  | "Studying"
  | "Coding"
  | "Exploring Austin"
  | "Coffee"
  | "Concerts"
  | "Intramurals";

export type AvailabilitySlot =
  | "Monday evening"
  | "Tuesday evening"
  | "Wednesday evening"
  | "Thursday evening"
  | "Friday evening"
  | "Saturday afternoon"
  | "Saturday evening"
  | "Sunday afternoon";

export type FridayNight =
  | "Going out"
  | "Movie or games"
  | "Random adventure"
  | "Probably studying"
  | "Depends who's asking";

export type FoodText =
  | "Already putting my shoes on"
  | "Where?"
  | "Maybe"
  | "Absolutely not";

export type IdealGroupSize = "2–3" | "4–5" | "6–8" | "The more the better";

export type PlanningStyle =
  | "I'm making the plan"
  | "I'll suggest something"
  | "I'll show up"
  | "Please just tell me where to be";

export type SleepSchedule =
  | "Early bird"
  | "Normal"
  | "Night owl"
  | "Sleep schedule? Never heard of it";

export type LookingFor =
  | "A close friend group"
  | "People to explore with"
  | "Study friends"
  | "People to go out with"
  | "Gym / activity friends"
  | "A little of everything";

export type ActivityMood =
  | "Food"
  | "Active"
  | "Chill"
  | "Study"
  | "Go Out"
  | "Surprise Me";

export type FeedbackEmoji = "😕" | "😐" | "🙂" | "🔥";

export type HangAgain = "Yes" | "Maybe" | "No";

export type CircleStage =
  | "Introduced"
  | "Met Once"
  | "Met Again"
  | "Regular Group";

export type RsvpStatus = "pending" | "in" | "cant";

export type DemoPhase =
  | "landing"
  | "onboarding"
  | "matching"
  | "reveal"
  | "home";

export interface Availability {
  slots: AvailabilitySlot[];
}

export interface VibeAnswers {
  fridayNight: FridayNight | null;
  foodText: FoodText | null;
  idealGroupSize: IdealGroupSize | null;
  socialEnergy: number; // 0 introvert → 100 extrovert
  planningStyle: PlanningStyle | null;
  interests: Interest[];
  sleepSchedule: SleepSchedule | null;
  lookingFor: LookingFor[];
}

export interface CollegeProfile {
  firstName: string;
  university: string;
  year: Year | "";
  major: string;
  dorm: string;
  hometown: string;
}

export interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  major: string;
  year: Year;
  dorm: string;
  hometown: string;
  interests: Interest[];
  availability: AvailabilitySlot[];
  socialEnergy: number;
  planningStyle: PlanningStyle;
  fridayNight: FridayNight;
  foodText: FoodText;
  idealGroupSize: IdealGroupSize;
  sleepSchedule: SleepSchedule;
  lookingFor: LookingFor[];
  activityPreferences: ActivityMood[];
}

export interface User {
  id: string;
  profile: CollegeProfile;
  vibe: VibeAnswers;
  availability: AvailabilitySlot[];
  isDemo: boolean;
}

export interface CircleMember {
  studentId: string;
  isCurrentUser: boolean;
}

export interface Circle {
  id: string;
  memberIds: string[];
  formedAt: string;
  stage: CircleStage;
  completedMeetups: number;
  whyThisCircle: string[];
}

export interface Activity {
  id: string;
  title: string;
  emoji: string;
  description: string;
  location: string;
  dateLabel: string;
  time: string;
  reason: string;
  estimatedDuration: string;
  mood: ActivityMood | "First Mission";
  status: "upcoming" | "completed" | "cancelled";
  rsvps: Record<string, RsvpStatus>;
  createdAt: string;
  isSpontaneous?: boolean;
}

export interface ActivityFeedback {
  activityId: string;
  emoji: FeedbackEmoji;
  hangAgain: HangAgain;
  submittedAt: string;
}

export interface CircleStrength {
  percent: number;
  completedMeetups: number;
  activeMembers: number;
  weeksTogether: number;
  stage: CircleStage;
}

export interface SuggestedActivity {
  title: string;
  emoji: string;
  description: string;
  location: string;
  date: string;
  time: string;
  reason: string;
  estimatedDuration: string;
  mood: ActivityMood | "First Mission";
}

export interface DemoState {
  version: number;
  phase: DemoPhase;
  user: User | null;
  circle: Circle | null;
  activities: Activity[];
  feedback: ActivityFeedback[];
  pendingFeedbackActivityId: string | null;
  reshuffleRequested: boolean;
  extensionInbox: ExtensionPayload[];
}

export interface ExtensionPayload {
  id: string;
  title: string;
  url: string;
  selectedText?: string;
  receivedAt: string;
}
