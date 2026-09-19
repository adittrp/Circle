/**
 * Seed synthetic students for matching scale tests.
 *
 * Usage:
 *   npm run seed:test -- 10
 *   npm run seed:test -- 100
 *   npm run seed:test -- 1000
 *   npm run seed:test -- 5000 ut-austin
 *
 * All rows are is_synthetic = true and excluded from student_directory / production matching
 * unless matching explicitly includes synthetics.
 */
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
const PLANNING = [
  "I'm making the plan",
  "I'll suggest something",
  "I'll show up",
  "Please just tell me where to be",
] as const;

function hash(n: number) {
  return Math.abs(Math.sin(n + 1) * 10000);
}

async function main() {
  const count = Number(process.argv[2] ?? 100);
  const uniFilter = process.argv[3]; // optional slug like ut-austin
  if (!Number.isFinite(count) || count < 1) {
    throw new Error("Pass a positive count, e.g. npm run seed:test -- 100");
  }

  const supabase = requireServiceClient();

  const { data: universities, error: uniErr } = await supabase
    .from("universities")
    .select("id, slug");
  if (uniErr || !universities?.length) {
    throw uniErr ?? new Error("Run npm run seed:campus first");
  }
  let uniList = universities;
  if (uniFilter) {
    uniList = universities.filter((u) => u.slug === uniFilter);
    if (!uniList.length) {
      throw new Error(`No university with slug ${uniFilter}`);
    }
  }

  const { data: majors } = await supabase.from("majors").select("id, university_id");
  const { data: halls } = await supabase.from("residence_halls").select("id, university_id");
  const { data: interests } = await supabase.from("interests").select("id");
  if (!majors?.length || !halls?.length || !interests?.length) {
    throw new Error("Campus catalog is empty. Run npm run seed:campus first.");
  }

  console.log(`Creating ${count} synthetic students across ${uniList.length} universit(y/ies)...`);

  const batchSize = 25;
  for (let start = 0; start < count; start += batchSize) {
    const end = Math.min(start + batchSize, count);
    for (let i = start; i < end; i++) {
      const uni = uniList[i % uniList.length];
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
          email: `synthetic.${Date.now()}.${i}.${uni.slug}@circle.test`,
        })
        .select("id")
        .single();

      if (error || !profile) throw error ?? new Error("profile insert failed");

      await Promise.all([
        supabase.from("user_preferences").insert({
          user_id: profile.id,
          social_energy: Math.round(25 + (hash(i) % 70)),
          spontaneous_vs_planned: Math.round(hash(i + 3) % 100),
          sleep_schedule: ["Early bird", "Normal", "Night owl"][i % 3],
          group_size: ["2–3", "4–5", "6–8"][i % 3],
          planning_style: PLANNING[i % PLANNING.length],
          weekend_style: ["Going out", "Movie or games", "Random adventure"][i % 3],
          vibe_completed: true,
          answers: { synthetic: true, index: i },
        }),
        supabase.from("user_interests").insert(
          [
            interests[i % interests.length].id,
            interests[(i + 3) % interests.length].id,
            interests[(i + 7) % interests.length].id,
          ]
            .filter((v, idx, arr) => arr.indexOf(v) === idx)
            .map((interest_id) => ({ user_id: profile.id, interest_id }))
        ),
        supabase.from("user_availability").insert(
          [i % 7, (i + 2) % 7, (i + 4) % 7].map((weekday) => ({
            user_id: profile.id,
            weekday,
            time_window: (i % 2 === 0 ? "afternoon" : "evening") as "afternoon" | "evening",
          }))
        ),
      ]);
    }
    console.log(`  ${end}/${count}`);
  }

  console.log(
    "Done. Synthetic rows are is_synthetic = true (hidden from student_directory; matching can include them for tests)."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
