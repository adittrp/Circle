import type { AvailabilitySlot, Interest, StudentProfile } from "@/lib/types";
import { DORMS, INTERESTS, MAJORS } from "@/lib/constants";

type SeedPartial = Omit<
  StudentProfile,
  "avatar" | "lastName" | "activityPreferences"
> & { lastName?: string };

function avatarFor(name: string, hue: number) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${hue}, 72%, 58%)"/>
        <stop offset="100%" stop-color="hsl(${(hue + 40) % 360}, 65%, 45%)"/>
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="64" fill="url(#g)"/>
    <text x="64" y="74" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-size="42" font-weight="700">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function moodsFromInterests(interests: Interest[]) {
  const moods: StudentProfile["activityPreferences"] = [];
  if (interests.some((i) => ["Food", "Coffee", "Exploring Austin"].includes(i)))
    moods.push("Food");
  if (interests.some((i) => ["Gym", "Sports", "Intramurals", "Outdoors"].includes(i)))
    moods.push("Active");
  if (interests.some((i) => ["Gaming", "Movies", "Music"].includes(i)))
    moods.push("Chill");
  if (interests.some((i) => ["Studying", "Coding"].includes(i))) moods.push("Study");
  if (interests.some((i) => ["Parties", "Concerts"].includes(i))) moods.push("Go Out");
  if (moods.length === 0) moods.push("Surprise Me");
  return moods;
}

const raw: SeedPartial[] = [
  {
    id: "s01",
    firstName: "Maya",
    major: "Psychology",
    year: "Sophomore",
    dorm: "Jester West",
    hometown: "Houston, TX",
    interests: ["Food", "Exploring Austin", "Coffee", "Movies", "Gym"],
    availability: ["Tuesday evening", "Thursday evening", "Saturday afternoon"],
    socialEnergy: 62,
    planningStyle: "I'll suggest something",
    fridayNight: "Movie or games",
    foodText: "Where?",
    idealGroupSize: "4–5",
    sleepSchedule: "Night owl",
    lookingFor: ["People to explore with", "A close friend group"],
  },
  {
    id: "s02",
    firstName: "Jordan",
    major: "Computer Science",
    year: "Junior",
    dorm: "San Jacinto",
    hometown: "Dallas, TX",
    interests: ["Gaming", "Coding", "Food", "Gym", "Movies"],
    availability: ["Tuesday evening", "Wednesday evening", "Friday evening", "Saturday evening"],
    socialEnergy: 48,
    planningStyle: "I'll show up",
    fridayNight: "Movie or games",
    foodText: "Already putting my shoes on",
    idealGroupSize: "4–5",
    sleepSchedule: "Night owl",
    lookingFor: ["Gym / activity friends", "A little of everything"],
  },
  {
    id: "s03",
    firstName: "Sam",
    major: "Business",
    year: "Sophomore",
    dorm: "Jester East",
    hometown: "Austin, TX",
    interests: ["Exploring Austin", "Food", "Parties", "Concerts", "Sports"],
    availability: ["Tuesday evening", "Thursday evening", "Friday evening", "Saturday evening"],
    socialEnergy: 78,
    planningStyle: "I'm making the plan",
    fridayNight: "Going out",
    foodText: "Already putting my shoes on",
    idealGroupSize: "6–8",
    sleepSchedule: "Night owl",
    lookingFor: ["People to go out with", "People to explore with"],
  },
  {
    id: "s04",
    firstName: "Riley",
    major: "Biology",
    year: "Freshman",
    dorm: "Kinsolving",
    hometown: "San Antonio, TX",
    interests: ["Gym", "Studying", "Coffee", "Outdoors", "Food"],
    availability: ["Monday evening", "Tuesday evening", "Sunday afternoon"],
    socialEnergy: 55,
    planningStyle: "I'll suggest something",
    fridayNight: "Probably studying",
    foodText: "Maybe",
    idealGroupSize: "4–5",
    sleepSchedule: "Normal",
    lookingFor: ["Gym / activity friends", "Study friends"],
  },
  {
    id: "s05",
    firstName: "Casey",
    major: "Design",
    year: "Junior",
    dorm: "Duren",
    hometown: "Plano, TX",
    interests: ["Music", "Coffee", "Exploring Austin", "Movies", "Concerts"],
    availability: ["Wednesday evening", "Thursday evening", "Saturday afternoon"],
    socialEnergy: 58,
    planningStyle: "I'll suggest something",
    fridayNight: "Random adventure",
    foodText: "Where?",
    idealGroupSize: "4–5",
    sleepSchedule: "Night owl",
    lookingFor: ["People to explore with", "A close friend group"],
  },
  {
    id: "s06",
    firstName: "Avery",
    major: "Engineering",
    year: "Senior",
    dorm: "Moore-Hill",
    hometown: "Round Rock, TX",
    interests: ["Coding", "Gaming", "Studying", "Coffee", "Movies"],
    availability: ["Monday evening", "Wednesday evening", "Sunday afternoon"],
    socialEnergy: 35,
    planningStyle: "Please just tell me where to be",
    fridayNight: "Probably studying",
    foodText: "Maybe",
    idealGroupSize: "2–3",
    sleepSchedule: "Night owl",
    lookingFor: ["Study friends"],
  },
  {
    id: "s07",
    firstName: "Taylor",
    major: "Communications",
    year: "Sophomore",
    dorm: "Jester West",
    hometown: "Fort Worth, TX",
    interests: ["Parties", "Concerts", "Music", "Food", "Exploring Austin"],
    availability: ["Friday evening", "Saturday evening", "Thursday evening"],
    socialEnergy: 85,
    planningStyle: "I'm making the plan",
    fridayNight: "Going out",
    foodText: "Already putting my shoes on",
    idealGroupSize: "The more the better",
    sleepSchedule: "Sleep schedule? Never heard of it",
    lookingFor: ["People to go out with"],
  },
  {
    id: "s08",
    firstName: "Quinn",
    major: "Economics",
    year: "Junior",
    dorm: "San Jacinto",
    hometown: "El Paso, TX",
    interests: ["Sports", "Gym", "Intramurals", "Food", "Movies"],
    availability: ["Tuesday evening", "Thursday evening", "Saturday afternoon"],
    socialEnergy: 70,
    planningStyle: "I'll show up",
    fridayNight: "Depends who's asking",
    foodText: "Where?",
    idealGroupSize: "4–5",
    sleepSchedule: "Normal",
    lookingFor: ["Gym / activity friends", "A close friend group"],
  },
  {
    id: "s09",
    firstName: "Blake",
    major: "Government",
    year: "Senior",
    dorm: "Duren",
    hometown: "McAllen, TX",
    interests: ["Studying", "Coffee", "Music", "Outdoors", "Food"],
    availability: ["Monday evening", "Sunday afternoon", "Wednesday evening"],
    socialEnergy: 42,
    planningStyle: "Please just tell me where to be",
    fridayNight: "Probably studying",
    foodText: "Absolutely not",
    idealGroupSize: "2–3",
    sleepSchedule: "Early bird",
    lookingFor: ["Study friends"],
  },
  {
    id: "s10",
    firstName: "Harper",
    major: "Radio-Television-Film",
    year: "Sophomore",
    dorm: "Jester East",
    hometown: "Los Angeles, CA",
    interests: ["Movies", "Music", "Concerts", "Coffee", "Exploring Austin"],
    availability: ["Tuesday evening", "Friday evening", "Saturday afternoon"],
    socialEnergy: 66,
    planningStyle: "I'll suggest something",
    fridayNight: "Movie or games",
    foodText: "Where?",
    idealGroupSize: "4–5",
    sleepSchedule: "Night owl",
    lookingFor: ["People to explore with", "A little of everything"],
  },
];

// Generate remaining students programmatically for diversity
const firstNames = [
  "Noah", "Liam", "Emma", "Olivia", "Ethan", "Mia", "Lucas", "Sofia", "Leo", "Aria",
  "Kai", "Zoe", "Miles", "Nora", "Owen", "Ivy", "Theo", "Luna", "Ezra", "Chloe",
  "Ian", "Grace", "Nate", "Ellie", "Drew", "Piper", "Cole", "Sadie", "Jake", "Ruby",
  "Ben", "Hazel", "Max", "Willow", "Ryan", "Alice", "Adam", "Nina", "Chris", "Leah",
  "Alexis", "Parker", "Morgan", "Jamie", "Cameron", "Devon", "Skyler", "Reese", "Finley", "Rowan",
];

const hometowns = [
  "Houston, TX", "Dallas, TX", "Austin, TX", "San Antonio, TX", "Plano, TX",
  "Frisco, TX", "Katy, TX", "Sugar Land, TX", "Chicago, IL", "Denver, CO",
  "Phoenix, AZ", "Atlanta, GA", "Seattle, WA", "Miami, FL", "New Orleans, LA",
];

const planningStyles = [
  "I'm making the plan",
  "I'll suggest something",
  "I'll show up",
  "Please just tell me where to be",
] as const;

const fridayOptions = [
  "Going out",
  "Movie or games",
  "Random adventure",
  "Probably studying",
  "Depends who's asking",
] as const;

const foodOptions = [
  "Already putting my shoes on",
  "Where?",
  "Maybe",
  "Absolutely not",
] as const;

const sleepOptions = [
  "Early bird",
  "Normal",
  "Night owl",
  "Sleep schedule? Never heard of it",
] as const;

const lookingOptions = [
  "A close friend group",
  "People to explore with",
  "Study friends",
  "People to go out with",
  "Gym / activity friends",
  "A little of everything",
] as const;

const years = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"] as const;

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length];
}

function pickN<T>(arr: readonly T[], i: number, n: number): T[] {
  const start = i % arr.length;
  const out: T[] = [];
  for (let k = 0; k < n; k++) out.push(arr[(start + k * 3) % arr.length]);
  return [...new Set(out)];
}

function slotsFor(i: number): AvailabilitySlot[] {
  const all: AvailabilitySlot[] = [
    "Monday evening",
    "Tuesday evening",
    "Wednesday evening",
    "Thursday evening",
    "Friday evening",
    "Saturday afternoon",
    "Saturday evening",
    "Sunday afternoon",
  ];
  // Ensure some share Tuesday/Thursday for demo matching quality
  if (i % 3 === 0) return pickN(all, i, 3).concat(["Tuesday evening"] as AvailabilitySlot[]);
  if (i % 3 === 1) return pickN(all, i, 3).concat(["Thursday evening"] as AvailabilitySlot[]);
  return pickN(all, i, 4);
}

for (let i = 0; i < 50; i++) {
  const firstName = firstNames[i];
  const interests = pickN(INTERESTS, i, 4 + (i % 3)) as Interest[];
  raw.push({
    id: `s${String(i + 11).padStart(2, "0")}`,
    firstName,
    major: pick(MAJORS, i),
    year: pick(years, i),
    dorm: pick(DORMS, i),
    hometown: pick(hometowns, i),
    interests,
    availability: [...new Set(slotsFor(i))],
    socialEnergy: 25 + ((i * 17) % 70),
    planningStyle: pick(planningStyles, i),
    fridayNight: pick(fridayOptions, i),
    foodText: pick(foodOptions, i),
    idealGroupSize: pick(["2–3", "4–5", "6–8", "The more the better"] as const, i),
    sleepSchedule: pick(sleepOptions, i),
    lookingFor: pickN(lookingOptions, i, 1 + (i % 2)),
  });
}

export const SEED_STUDENTS: StudentProfile[] = raw.map((s, idx) => {
  const full = `${s.firstName} ${s.lastName ?? ""}`.trim();
  return {
    ...s,
    lastName: s.lastName ?? "",
    avatar: avatarFor(full || s.firstName, (idx * 47) % 360),
    activityPreferences: moodsFromInterests(s.interests),
  };
});

export function getStudentById(id: string): StudentProfile | undefined {
  return SEED_STUDENTS.find((s) => s.id === id);
}

export function getStudentsByIds(ids: string[]): StudentProfile[] {
  return ids
    .map((id) => getStudentById(id))
    .filter((s): s is StudentProfile => Boolean(s));
}
