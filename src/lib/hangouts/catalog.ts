import type { HangoutMood } from "./types";

export interface CatalogItem {
  title: string;
  emoji: string;
  description: string;
  durationMinutes: number;
  tags: string[];
}

const FOOD: CatalogItem[] = [
  {
    title: "Taco Run",
    emoji: "🌮",
    description: "A low-key food run to break the ice — no agenda, just something good to eat.",
    durationMinutes: 75,
    tags: ["food", "easy"],
  },
  {
    title: "Coffee Catch-up",
    emoji: "☕",
    description: "Easy conversation fuel on campus. Sit, talk, no pressure.",
    durationMinutes: 45,
    tags: ["coffee", "easy", "low-cost"],
  },
  {
    title: "Dining Hall Hang",
    emoji: "🍽️",
    description: "Grab a tray and actually eat together instead of “we should get food sometime.”",
    durationMinutes: 60,
    tags: ["food", "easy", "low-cost"],
  },
];

const ACTIVE: CatalogItem[] = [
  {
    title: "Pickup Basketball",
    emoji: "🏀",
    description: "Show up, shoot around, keep it casual.",
    durationMinutes: 75,
    tags: ["sports", "gym"],
  },
  {
    title: "Gym Session",
    emoji: "💪",
    description: "Lift or walk the track together — headphones optional.",
    durationMinutes: 60,
    tags: ["gym", "fitness"],
  },
  {
    title: "Campus Walk",
    emoji: "🚶",
    description: "Stretch your legs and talk between-classes energy.",
    durationMinutes: 40,
    tags: ["walk", "easy", "low-cost"],
  },
];

const CHILL: CatalogItem[] = [
  {
    title: "Union Hang",
    emoji: "🎮",
    description: "Low-key games and hanging out somewhere public on campus.",
    durationMinutes: 90,
    tags: ["games", "easy"],
  },
  {
    title: "Lounge + Playlists",
    emoji: "🎧",
    description: "Claim a cozy corner, swap music, no agenda.",
    durationMinutes: 75,
    tags: ["music", "easy"],
  },
];

const STUDY: CatalogItem[] = [
  {
    title: "Study Block",
    emoji: "📚",
    description: "Co-working with an optional snack break halfway.",
    durationMinutes: 90,
    tags: ["study", "easy", "low-cost"],
  },
  {
    title: "Quiet Focus Hour",
    emoji: "✏️",
    description: "Headphones in, check-in after sixty minutes.",
    durationMinutes: 60,
    tags: ["study", "low-cost"],
  },
];

const GO_OUT: CatalogItem[] = [
  {
    title: "Campus Night Walk",
    emoji: "🎉",
    description: "Wander the main drag, people-watch, grab a treat.",
    durationMinutes: 90,
    tags: ["night", "easy"],
  },
  {
    title: "See What's On",
    emoji: "🎵",
    description: "Check a campus event board and decide together.",
    durationMinutes: 120,
    tags: ["event", "music"],
  },
];

const EXPLORE: CatalogItem[] = [
  {
    title: "Explore Campus",
    emoji: "🗺",
    description: "Pick a building or green you haven't hung out in yet.",
    durationMinutes: 60,
    tags: ["explore", "easy", "low-cost"],
  },
  {
    title: "Photo Walk",
    emoji: "📸",
    description: "Walk a loop, take bad photos, call it a hang.",
    durationMinutes: 50,
    tags: ["explore", "walk", "low-cost"],
  },
];

export function catalogForMood(mood: HangoutMood): CatalogItem[] {
  switch (mood) {
    case "First Mission":
    case "Food":
      return FOOD;
    case "Active":
      return ACTIVE;
    case "Chill":
      return CHILL;
    case "Study":
      return STUDY;
    case "Go Out":
      return GO_OUT;
    case "Explore":
      return EXPLORE;
    case "Surprise Me":
      return [...FOOD, ...ACTIVE, ...CHILL, ...EXPLORE];
    default:
      return FOOD;
  }
}
