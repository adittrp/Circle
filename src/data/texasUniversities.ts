import { COMMON_MAJORS } from "@/lib/identity/catalog";
import type { DataStatus, LocationCategory } from "@/lib/supabase/database.types";

export interface UniversitySeed {
  slug: string;
  name: string;
  abbreviation: string;
  city: string;
  domains: string[];
  primaryColor: string;
  secondaryColor: string;
  logoPath: string;
  majors: string[];
  residenceHalls: { name: string; isOffCampus?: boolean; dataStatus: DataStatus }[];
  locations: { name: string; category: LocationCategory; dataStatus: DataStatus }[];
}

const offCampus = (dataStatus: DataStatus = "verified") => ({
  name: "Off-campus",
  isOffCampus: true,
  dataStatus,
});

/**
 * Texas campus catalog for Circle.
 * Brand colors: university primary/secondary accents (public brand guidelines).
 * Residence halls and locations marked `needs_review` must be verified before
 * treating them as authoritative in product copy.
 */
export const TEXAS_UNIVERSITIES: UniversitySeed[] = [
  {
    slug: "ut-austin",
    name: "University of Texas at Austin",
    abbreviation: "UT Austin",
    city: "Austin",
    domains: ["utexas.edu"],
    primaryColor: "#BF5700",
    secondaryColor: "#333F48",
    logoPath: "/universities/ut-austin.svg",
    majors: [...COMMON_MAJORS, "Radio-Television-Film", "Petroleum Engineering", "Government"],
    residenceHalls: [
      { name: "Jester West", dataStatus: "verified" },
      { name: "Jester East", dataStatus: "verified" },
      { name: "San Jacinto", dataStatus: "verified" },
      { name: "Duren", dataStatus: "verified" },
      { name: "Moore-Hill", dataStatus: "verified" },
      { name: "Kinsolving", dataStatus: "verified" },
      offCampus(),
    ],
    locations: [
      { name: "Gregory Gym", category: "gym", dataStatus: "verified" },
      { name: "Texas Union", category: "hangout", dataStatus: "verified" },
      { name: "Perry-Castañeda Library (PCL)", category: "library", dataStatus: "verified" },
      { name: "Jester City Limits", category: "dining", dataStatus: "verified" },
      { name: "RecSports Outdoor Center", category: "gym", dataStatus: "verified" },
    ],
  },
  {
    slug: "tamu",
    name: "Texas A&M University",
    abbreviation: "Texas A&M",
    city: "College Station",
    domains: ["tamu.edu"],
    primaryColor: "#500000",
    secondaryColor: "#FFFFFF",
    logoPath: "/universities/tamu.svg",
    majors: [...COMMON_MAJORS, "Petroleum Engineering", "Agricultural Economics"],
    residenceHalls: [
      { name: "Hullabaloo Hall", dataStatus: "verified" },
      { name: "Mosher Hall", dataStatus: "needs_review" },
      { name: "Dunn Hall", dataStatus: "needs_review" },
      offCampus(),
    ],
    locations: [
      { name: "Memorial Student Center", category: "hangout", dataStatus: "verified" },
      { name: "Sterling C. Evans Library", category: "library", dataStatus: "verified" },
      { name: "Student Recreation Center", category: "gym", dataStatus: "verified" },
      { name: "Sbisa Dining Hall", category: "dining", dataStatus: "needs_review" },
    ],
  },
  {
    slug: "texas-tech",
    name: "Texas Tech University",
    abbreviation: "Texas Tech",
    city: "Lubbock",
    domains: ["ttu.edu"],
    primaryColor: "#CC0000",
    secondaryColor: "#000000",
    logoPath: "/universities/texas-tech.svg",
    majors: [...COMMON_MAJORS],
    residenceHalls: [
      { name: "Talkington Hall", dataStatus: "needs_review" },
      { name: "Horn Hall", dataStatus: "needs_review" },
      offCampus(),
    ],
    locations: [
      { name: "Student Union Building", category: "hangout", dataStatus: "verified" },
      { name: "University Library", category: "library", dataStatus: "verified" },
      { name: "Student Recreation Center", category: "gym", dataStatus: "verified" },
    ],
  },
  {
    slug: "uh",
    name: "University of Houston",
    abbreviation: "UH",
    city: "Houston",
    domains: ["uh.edu", "cougarnet.uh.edu"],
    primaryColor: "#C8102E",
    secondaryColor: "#FFFFFF",
    logoPath: "/universities/uh.svg",
    majors: [...COMMON_MAJORS],
    residenceHalls: [
      { name: "Cougar Village I", dataStatus: "needs_review" },
      { name: "Moody Towers", dataStatus: "needs_review" },
      offCampus(),
    ],
    locations: [
      { name: "Student Center", category: "hangout", dataStatus: "verified" },
      { name: "MD Anderson Library", category: "library", dataStatus: "verified" },
      { name: "Campus Recreation and Wellness Center", category: "gym", dataStatus: "verified" },
    ],
  },
  {
    slug: "unt",
    name: "University of North Texas",
    abbreviation: "UNT",
    city: "Denton",
    domains: ["unt.edu", "my.unt.edu"],
    primaryColor: "#00853E",
    secondaryColor: "#FFFFFF",
    logoPath: "/universities/unt.svg",
    majors: [...COMMON_MAJORS, "Music", "Journalism"],
    residenceHalls: [
      { name: "Kerr Hall", dataStatus: "needs_review" },
      { name: "Maple Hall", dataStatus: "needs_review" },
      offCampus(),
    ],
    locations: [
      { name: "University Union", category: "hangout", dataStatus: "verified" },
      { name: "Willis Library", category: "library", dataStatus: "verified" },
      { name: "Rec Center", category: "gym", dataStatus: "verified" },
    ],
  },
  {
    slug: "texas-state",
    name: "Texas State University",
    abbreviation: "Texas State",
    city: "San Marcos",
    domains: ["txstate.edu"],
    primaryColor: "#501214",
    secondaryColor: "#AC8D2A",
    logoPath: "/universities/texas-state.svg",
    majors: [...COMMON_MAJORS],
    residenceHalls: [
      { name: "Sterry Hall", dataStatus: "needs_review" },
      { name: "Beretta Hall", dataStatus: "needs_review" },
      offCampus(),
    ],
    locations: [
      { name: "LBJ Student Center", category: "hangout", dataStatus: "verified" },
      { name: "Alkek Library", category: "library", dataStatus: "verified" },
      { name: "Student Recreation Center", category: "gym", dataStatus: "verified" },
    ],
  },
  {
    slug: "ut-dallas",
    name: "University of Texas at Dallas",
    abbreviation: "UT Dallas",
    city: "Richardson",
    domains: ["utdallas.edu"],
    primaryColor: "#E87500",
    secondaryColor: "#154734",
    logoPath: "/universities/ut-dallas.svg",
    majors: [...COMMON_MAJORS, "Computer Engineering", "Neuroscience"],
    residenceHalls: [
      { name: "Residence Hall North", dataStatus: "needs_review" },
      { name: "Residence Hall South", dataStatus: "needs_review" },
      offCampus(),
    ],
    locations: [
      { name: "Student Union", category: "hangout", dataStatus: "verified" },
      { name: "Eugene McDermott Library", category: "library", dataStatus: "verified" },
      { name: "Activity Center", category: "gym", dataStatus: "verified" },
    ],
  },
  {
    slug: "ut-arlington",
    name: "University of Texas at Arlington",
    abbreviation: "UT Arlington",
    city: "Arlington",
    domains: ["uta.edu", "mavs.uta.edu"],
    primaryColor: "#0064B1",
    secondaryColor: "#F58025",
    logoPath: "/universities/ut-arlington.svg",
    majors: [...COMMON_MAJORS],
    residenceHalls: [
      { name: "Arlington Hall", dataStatus: "needs_review" },
      { name: "Vandergriff Hall", dataStatus: "needs_review" },
      offCampus(),
    ],
    locations: [
      { name: "E.H. Hereford University Center", category: "hangout", dataStatus: "verified" },
      { name: "Central Library", category: "library", dataStatus: "verified" },
      { name: "Maverick Activities Center", category: "gym", dataStatus: "verified" },
    ],
  },
  {
    slug: "utsa",
    name: "University of Texas at San Antonio",
    abbreviation: "UTSA",
    city: "San Antonio",
    domains: ["utsa.edu", "my.utsa.edu"],
    primaryColor: "#F15A22",
    secondaryColor: "#0C2340",
    logoPath: "/universities/utsa.svg",
    majors: [...COMMON_MAJORS],
    residenceHalls: [
      { name: "Chisholm Hall", dataStatus: "needs_review" },
      { name: "Alvarez Hall", dataStatus: "needs_review" },
      offCampus(),
    ],
    locations: [
      { name: "University Center", category: "hangout", dataStatus: "verified" },
      { name: "John Peace Library", category: "library", dataStatus: "verified" },
      { name: "Recreation Center", category: "gym", dataStatus: "verified" },
    ],
  },
  {
    slug: "rice",
    name: "Rice University",
    abbreviation: "Rice",
    city: "Houston",
    domains: ["rice.edu"],
    primaryColor: "#00205B",
    secondaryColor: "#7C7E7F",
    logoPath: "/universities/rice.svg",
    majors: [...COMMON_MAJORS],
    residenceHalls: [
      { name: "Baker College", dataStatus: "verified" },
      { name: "Will Rice College", dataStatus: "verified" },
      { name: "Hanszen College", dataStatus: "verified" },
      offCampus(),
    ],
    locations: [
      { name: "Rice Memorial Center", category: "hangout", dataStatus: "verified" },
      { name: "Fondren Library", category: "library", dataStatus: "verified" },
      { name: "Barbara and David Gibbs Recreation and Wellness Center", category: "gym", dataStatus: "verified" },
    ],
  },
  {
    slug: "baylor",
    name: "Baylor University",
    abbreviation: "Baylor",
    city: "Waco",
    domains: ["baylor.edu"],
    primaryColor: "#154734",
    secondaryColor: "#FFB81C",
    logoPath: "/universities/baylor.svg",
    majors: [...COMMON_MAJORS],
    residenceHalls: [
      { name: "Brooks Residential College", dataStatus: "needs_review" },
      { name: "Collins Hall", dataStatus: "needs_review" },
      offCampus(),
    ],
    locations: [
      { name: "Bill Daniel Student Center", category: "hangout", dataStatus: "verified" },
      { name: "Moody Memorial Library", category: "library", dataStatus: "verified" },
      { name: "McLane Student Life Center", category: "gym", dataStatus: "verified" },
    ],
  },
  {
    slug: "tcu",
    name: "Texas Christian University",
    abbreviation: "TCU",
    city: "Fort Worth",
    domains: ["tcu.edu"],
    primaryColor: "#4D1979",
    secondaryColor: "#A3A9AC",
    logoPath: "/universities/tcu.svg",
    majors: [...COMMON_MAJORS],
    residenceHalls: [
      { name: "Tom Brown Hall", dataStatus: "needs_review" },
      { name: "Waits Hall", dataStatus: "needs_review" },
      offCampus(),
    ],
    locations: [
      { name: "Brown-Lupton University Union", category: "hangout", dataStatus: "verified" },
      { name: "Mary Couts Burnett Library", category: "library", dataStatus: "verified" },
      { name: "University Recreation Center", category: "gym", dataStatus: "verified" },
    ],
  },
  {
    slug: "smu",
    name: "Southern Methodist University",
    abbreviation: "SMU",
    city: "Dallas",
    domains: ["smu.edu"],
    primaryColor: "#0033A0",
    secondaryColor: "#C8102E",
    logoPath: "/universities/smu.svg",
    majors: [...COMMON_MAJORS],
    residenceHalls: [
      { name: "Boaz Hall", dataStatus: "needs_review" },
      { name: "McElvaney Hall", dataStatus: "needs_review" },
      offCampus(),
    ],
    locations: [
      { name: "Hughes-Trigg Student Center", category: "hangout", dataStatus: "verified" },
      { name: "Fondren Library Center", category: "library", dataStatus: "verified" },
      { name: "Dedman Center for Lifetime Sports", category: "gym", dataStatus: "verified" },
    ],
  },
];

export const INTEREST_SEED: { slug: string; name: string; category: string }[] = [
  { slug: "basketball", name: "Basketball", category: "Sports" },
  { slug: "soccer", name: "Soccer", category: "Sports" },
  { slug: "intramurals", name: "Intramurals", category: "Sports" },
  { slug: "volleyball", name: "Volleyball", category: "Sports" },
  { slug: "gym", name: "Gym", category: "Fitness" },
  { slug: "running", name: "Running", category: "Fitness" },
  { slug: "yoga", name: "Yoga", category: "Fitness" },
  { slug: "video-games", name: "Video games", category: "Gaming" },
  { slug: "board-games", name: "Board games", category: "Gaming" },
  { slug: "live-music", name: "Live music", category: "Music" },
  { slug: "concerts", name: "Concerts", category: "Music" },
  { slug: "playlists", name: "Making playlists", category: "Music" },
  { slug: "tacos", name: "Tacos", category: "Food" },
  { slug: "coffee", name: "Coffee", category: "Food" },
  { slug: "brunch", name: "Brunch", category: "Food" },
  { slug: "cooking", name: "Cooking", category: "Food" },
  { slug: "hiking", name: "Hiking", category: "Outdoors" },
  { slug: "exploring-city", name: "Exploring the city", category: "Outdoors" },
  { slug: "movies", name: "Movies", category: "Movies" },
  { slug: "film", name: "Film", category: "Movies" },
  { slug: "coding", name: "Coding", category: "Technology" },
  { slug: "startups", name: "Startups", category: "Technology" },
  { slug: "photography", name: "Photography", category: "Art" },
  { slug: "design", name: "Design", category: "Art" },
  { slug: "student-orgs", name: "Student orgs", category: "Campus Life" },
  { slug: "sports-games", name: "Game days", category: "Campus Life" },
  { slug: "going-out", name: "Going out", category: "Nightlife" },
  { slug: "late-night-food", name: "Late-night food", category: "Nightlife" },
  { slug: "study-groups", name: "Study groups", category: "Studying" },
  { slug: "libraries", name: "Library hangs", category: "Studying" },
  { slug: "road-trips", name: "Road trips", category: "Travel" },
  { slug: "weekend-getaways", name: "Weekend getaways", category: "Travel" },
];
