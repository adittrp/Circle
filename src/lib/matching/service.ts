import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, YearLevel } from "@/lib/supabase/database.types";
import { selectCircleCompanions } from "./select";
import {
  slotKey,
  type AvailabilitySlotKey,
  type MatchCandidate,
  type MatchResult,
} from "./types";

type Client = SupabaseClient<Database>;

interface PoolRow {
  profile_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  university_id: string;
  year: YearLevel | null;
  major_id: string | null;
  major_name: string | null;
  residence_hall_id: string | null;
  residence_name: string | null;
  hometown: string | null;
  bio: string | null;
  is_synthetic: boolean;
  interest_ids: string[] | null;
  interest_names: string[] | null;
  availability: unknown;
  social_energy: number | null;
  planning_style: string | null;
  sleep_schedule: string | null;
  group_size: string | null;
  weekend_style: string | null;
  looking_for: string[] | null;
}

function parseAvailability(raw: unknown): AvailabilitySlotKey[] {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : [];
  return list
    .map((s) => {
      if (!s || typeof s !== "object") return null;
      const row = s as { weekday?: number; time_window?: string };
      if (typeof row.weekday !== "number" || !row.time_window) return null;
      return slotKey(row.weekday, row.time_window);
    })
    .filter((s): s is AvailabilitySlotKey => Boolean(s));
}

export function poolRowToCandidate(row: PoolRow): MatchCandidate {
  return {
    id: row.profile_id,
    firstName: row.first_name ?? "Student",
    lastName: row.last_name,
    avatarUrl: row.avatar_url,
    universityId: row.university_id,
    year: row.year,
    majorId: row.major_id,
    majorName: row.major_name,
    residenceHallId: row.residence_hall_id,
    residenceName: row.residence_name,
    hometown: row.hometown,
    bio: row.bio,
    isSynthetic: row.is_synthetic,
    interestIds: row.interest_ids ?? [],
    interestNames: row.interest_names ?? [],
    availability: parseAvailability(row.availability),
    socialEnergy: row.social_energy ?? 50,
    planningStyle: row.planning_style,
    sleepSchedule: row.sleep_schedule,
    groupSize: row.group_size,
    weekendStyle: row.weekend_style,
    lookingFor: row.looking_for ?? [],
  };
}

export async function loadSeekerCandidate(
  supabase: Client,
  profileId: string
): Promise<MatchCandidate | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, avatar_url, university_id, year, major_id, residence_hall_id, hometown, bio, is_synthetic"
    )
    .eq("id", profileId)
    .maybeSingle();

  if (!profile?.university_id) return null;

  const [{ data: major }, { data: hall }, { data: interestRows }, { data: availability }, { data: prefs }] =
    await Promise.all([
      profile.major_id
        ? supabase.from("majors").select("id, name").eq("id", profile.major_id).maybeSingle()
        : Promise.resolve({ data: null }),
      profile.residence_hall_id
        ? supabase
            .from("residence_halls")
            .select("id, name")
            .eq("id", profile.residence_hall_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("user_interests").select("interest_id").eq("user_id", profileId),
      supabase.from("user_availability").select("weekday, time_window").eq("user_id", profileId),
      supabase.from("user_preferences").select("*").eq("user_id", profileId).maybeSingle(),
    ]);

  const interestIds = (interestRows ?? []).map((r) => r.interest_id);
  let interestNames: string[] = [];
  if (interestIds.length) {
    const { data: interestCatalog } = await supabase
      .from("interests")
      .select("id, name")
      .in("id", interestIds);
    interestNames = (interestCatalog ?? []).map((i) => i.name);
  }

  return {
    id: profile.id,
    firstName: profile.first_name ?? "You",
    lastName: profile.last_name,
    avatarUrl: profile.avatar_url,
    universityId: profile.university_id,
    year: profile.year,
    majorId: profile.major_id,
    majorName: major?.name ?? null,
    residenceHallId: profile.residence_hall_id,
    residenceName: hall?.name ?? null,
    hometown: profile.hometown,
    bio: profile.bio,
    isSynthetic: profile.is_synthetic,
    interestIds,
    interestNames,
    availability: (availability ?? []).map((a) => slotKey(a.weekday, a.time_window)),
    socialEnergy: prefs?.social_energy ?? 55,
    planningStyle: prefs?.planning_style ?? null,
    sleepSchedule: prefs?.sleep_schedule ?? null,
    groupSize: prefs?.group_size ?? null,
    weekendStyle: prefs?.weekend_style ?? null,
    lookingFor: prefs?.looking_for ?? [],
  };
}

export async function fetchMatchingPool(
  supabase: Client,
  includeSynthetic: boolean
): Promise<MatchCandidate[]> {
  const { data, error } = await supabase.rpc("get_matching_pool", {
    include_synthetic: includeSynthetic,
  });
  if (error) throw new Error(error.message);
  return ((data ?? []) as PoolRow[]).map(poolRowToCandidate);
}

export async function runRealMatch(
  supabase: Client,
  profileId: string,
  opts: { includeSynthetic?: boolean; persist?: boolean } = {}
): Promise<{ result: MatchResult; circleId: string | null }> {
  const includeSynthetic =
    opts.includeSynthetic ??
    process.env.NEXT_PUBLIC_MATCH_INCLUDE_SYNTHETIC === "true";
  const persist = opts.persist !== false;

  const seeker = await loadSeekerCandidate(supabase, profileId);
  if (!seeker) {
    throw new Error("Complete onboarding before finding a Circle.");
  }

  let pool = await fetchMatchingPool(supabase, false);
  let usedSyntheticFill = false;
  const needed = Math.max(2, Math.min(5, (seeker.groupSize === "2–3" ? 2 : seeker.groupSize === "6–8" || seeker.groupSize === "The more the better" ? 5 : 4)));

  if (pool.length < needed && (includeSynthetic || pool.length < 2)) {
    const withSynthetic = await fetchMatchingPool(supabase, true);
    if (withSynthetic.length > pool.length) {
      pool = withSynthetic;
      usedSyntheticFill = true;
    }
  }

  if (pool.length < 2) {
    throw new Error(
      "Not enough eligible students at your university yet. Invite classmates or seed synthetic campus profiles for testing."
    );
  }

  const result = selectCircleCompanions(seeker, pool);
  result.usedSyntheticFill = result.usedSyntheticFill || usedSyntheticFill;

  if (result.companions.length < 2) {
    throw new Error("Could not form a Circle with enough companions.");
  }

  let circleId: string | null = null;
  if (persist) {
    const { data, error } = await supabase.rpc("form_matched_circle", {
      companion_ids: result.companions.map((c) => c.id),
      why: result.why,
      p_match_score: result.score,
      p_match_meta: {
        eligibleCount: result.eligibleCount,
        shortlistCount: result.shortlistCount,
        combinationsEvaluated: result.combinationsEvaluated,
        runtimeMs: result.runtimeMs,
        usedSyntheticFill: result.usedSyntheticFill,
        breakdown: { ...result.breakdown },
        pairScores: result.pairScores.map((p) => ({
          id: p.candidate.id,
          score: p.score,
          breakdown: { ...p.breakdown },
        })),
      } as import("@/lib/supabase/database.types").Json,
    });
    if (error) throw new Error(error.message);
    circleId = data as string;
  }

  return { result, circleId };
}
