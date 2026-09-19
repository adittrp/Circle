import type {
  AvailabilitySlot,
  Interest,
  LookingFor,
  PlanningStyle,
  Year,
} from "./types";

export const DEMO_USER_ID = "user-demo";
export const STORAGE_KEY = "circle-demo-v1";
export const DEMO_VERSION = 1;

export const UNIVERSITY = "University of Texas at Austin";

export const YEARS: Year[] = [
  "Freshman",
  "Sophomore",
  "Junior",
  "Senior",
  "Graduate",
];

export const DORMS = [
  "Jester West",
  "Jester East",
  "San Jacinto",
  "Duren",
  "Moore-Hill",
  "Kinsolving",
] as const;

export const MAJORS = [
  "Computer Science",
  "Business",
  "Psychology",
  "Biology",
  "Engineering",
  "Communications",
  "Economics",
  "Design",
  "Government",
  "Mathematics",
  "Radio-Television-Film",
  "Nursing",
] as const;

export const INTERESTS: Interest[] = [
  "Gaming",
  "Gym",
  "Sports",
  "Food",
  "Music",
  "Movies",
  "Parties",
  "Outdoors",
  "Studying",
  "Coding",
  "Exploring Austin",
  "Coffee",
  "Concerts",
  "Intramurals",
];

export const AVAILABILITY_SLOTS: AvailabilitySlot[] = [
  "Monday evening",
  "Tuesday evening",
  "Wednesday evening",
  "Thursday evening",
  "Friday evening",
  "Saturday afternoon",
  "Saturday evening",
  "Sunday afternoon",
];

export const PLANNING_STYLES: PlanningStyle[] = [
  "I'm making the plan",
  "I'll suggest something",
  "I'll show up",
  "Please just tell me where to be",
];

export const LOOKING_FOR_OPTIONS: LookingFor[] = [
  "A close friend group",
  "People to explore with",
  "Study friends",
  "People to go out with",
  "Gym / activity friends",
  "A little of everything",
];

export const CAMPUS_LOCATIONS = [
  "Gregory Gym",
  "Texas Union",
  "PCL",
  "Jester City Limits",
  "Jester 2nd Floor Dining",
  "Caffe Medici (West Campus)",
  "South Mall Lawn",
  "The Drag",
  "RecSports Outdoor Center",
  "Union Underground",
] as const;

export const MATCHING_MESSAGES = [
  "Finding people nearby...",
  "Comparing schedules...",
  "Finding shared interests...",
  "Balancing your group...",
  "Building your Circle...",
];

export const WEIGHTS = {
  interestOverlap: 0.28,
  scheduleOverlap: 0.24,
  proximityScore: 0.12,
  socialCompatibility: 0.12,
  activityCompatibility: 0.12,
  yearCompatibility: 0.07,
  groupBalance: 0.15,
} as const;
