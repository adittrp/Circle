export const YEAR_LEVELS = [
  "Freshman",
  "Sophomore",
  "Junior",
  "Senior",
  "Graduate",
] as const;

export const WEEKDAYS = [
  { id: 1, label: "Monday", short: "Mon" },
  { id: 2, label: "Tuesday", short: "Tue" },
  { id: 3, label: "Wednesday", short: "Wed" },
  { id: 4, label: "Thursday", short: "Thu" },
  { id: 5, label: "Friday", short: "Fri" },
  { id: 6, label: "Saturday", short: "Sat" },
  { id: 0, label: "Sunday", short: "Sun" },
] as const;

export const AVAILABILITY_WINDOWS = [
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
] as const;

export const INTEREST_CATEGORIES = [
  "Sports",
  "Fitness",
  "Gaming",
  "Music",
  "Food",
  "Outdoors",
  "Movies",
  "Technology",
  "Art",
  "Campus Life",
  "Nightlife",
  "Studying",
  "Travel",
] as const;

export const COMMON_MAJORS = [
  "Accounting",
  "Biology",
  "Business Administration",
  "Chemistry",
  "Communications",
  "Computer Science",
  "Economics",
  "Education",
  "Electrical Engineering",
  "English",
  "Finance",
  "History",
  "Kinesiology",
  "Marketing",
  "Mathematics",
  "Mechanical Engineering",
  "Nursing",
  "Political Science",
  "Psychology",
  "Undeclared",
] as const;
