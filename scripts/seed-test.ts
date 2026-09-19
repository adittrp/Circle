import { TEXAS_UNIVERSITIES } from "../src/data/texasUniversities";
import { requireServiceClient } from "./supabaseAdmin";

const FIRST = [
  "Maya", "Jordan", "Sam", "Riley", "Casey", "Avery", "Taylor", "Quinn",
  "Blake", "Harper", "Noah", "Liam", "Emma", "Olivia", "Ethan", "Mia",
  "Lucas", "Sofia", "Leo", "Aria", "Kai", "Zoe", "Miles", "Nora", "Owen",
];
const LAST = [
  "Nguyen", "Patel", "Garcia", "Johnson", "Kim", "Williams", "Chen", "Martinez",
  "Brown", "Lee", "Davis", "Rodriguez", "Wilson", "Anderson", "Thomas",
];
const HOMETOWNS = [
  "Houston, TX", "Dallas, TX", "Austin, TX", "San Antonio, TX", "Plano, TX",
  "El Paso, TX", "Fort Worth, TX", "Denver, CO", "Chicago, IL",
];
const YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"] as const;

function hash(n: number) {
  return Math.abs(Math.sin(n + 1) * 10000);
}

async function main() {
  const count = Number(process.argv[2] ?? 400);
  const supabase = requireServiceClient();

  const { data: universities, error: uniErr } = await supabase
    .from("universities")
    .select("id, slug");
  if (uniErr || !universities?.length) {
    throw uniErr ?? new Error("Run npm run seed:campus first");
  }

  const { data: majors } = await supabase.from("majors").select("id, university_id");
  const { data: halls } = await supabase
    .from("residence_halls")
    .select("id, university_id");
  const { data: interests } = await supabase.from("interests").select("id");
  if (!majors?.length || !halls?.length || !interests?.length) {
    throw new Error("Campus catalog is empty. Run npm run seed:campus first.");
  }

  console.log(`Creating ${count} synthetic students...`);

  for (let i = 0; i < count; i++) {
    const uni = universities[i % universities.length];
    const uniMajors = majors.filter((m) => m.university_id === uni.id);
    const uniHalls = halls.filter((h) => h.university_id === uni.id);
    const first = FIRST[i % FIRST.length];
    const last = LAST[Math.floor(hash(i) * LAST.length) % LAST.length];
    const year = YEARS[i % YEARS.length];
    const major = uniMajors[i % uniMajors.length];
    const hall = uniHalls[i % uniHalls.length];

    const { data: profile, error } = await supabase
      .from("profiles")
      .insert({
        first_name: first,
        last_name: last,
        university_id: uni.id,
        year,
        major_id: major.id,
        residence_hall_id: hall.id,
        hometown: HOMETOWNS[i % HOMETOWNS.length],
        bio: `Synthetic ${TEXAS_UNIVERSITIES.find((u) => u.slug === uni.slug)?.abbreviation ?? ""} student for matching tests.`,
        is_synthetic: true,
        onboarding_completed_at: new Date().toISOString(),
        email: `synthetic.${i}.${uni.slug}@circle.test`,
      })
      .select("id")
      .single();

    if (error || !profile) throw error ?? new Error("profile insert failed");

    await supabase.from("user_preferences").insert({
      user_id: profile.id,
      social_energy: Math.round(25 + (hash(i) % 70)),
      spontaneous_vs_planned: Math.round(hash(i + 3) % 100),
      sleep_schedule: ["Early bird", "Normal", "Night owl"][i % 3],
      group_size: ["2–3", "4–5", "6–8"][i % 3],
      planning_style: [
        "I'm making the plan",
        "I'll suggest something",
        "I'll show up",
        "Please just tell me where to be",
      ][i % 4],
      weekend_style: ["Going out", "Movie or games", "Random adventure"][i % 3],
      vibe_completed: true,
      answers: { synthetic: true, index: i },
    });

    const picks = [
      interests[i % interests.length].id,
      interests[(i + 3) % interests.length].id,
      interests[(i + 7) % interests.length].id,
    ];
    await supabase.from("user_interests").insert(
      [...new Set(picks)].map((interest_id) => ({
        user_id: profile.id,
        interest_id,
      }))
    );

    const windows = ["afternoon", "evening"] as const;
    const days = [i % 7, (i + 2) % 7, (i + 4) % 7];
    await supabase.from("user_availability").insert(
      days.map((weekday) => ({
        user_id: profile.id,
        weekday,
        time_window: windows[i % 2],
      }))
    );

    if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${count}`);
  }

  console.log(`Done. Synthetic rows are marked is_synthetic = true and must not be used in production matching.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
