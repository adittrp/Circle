import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ActivityFeedbackRow,
  ActivityRow,
  ActivityRsvpRow,
  CampusLocation,
  CircleRulesRow,
  CircleRow,
  Database,
  InterestRow,
  Major,
  MessageReactionRow,
  MessageRow,
  ResidenceHall,
  StudentDirectoryRow,
} from "@/lib/supabase/database.types";
import { getHangoutCoordinator } from "./coordinator";
import { dbStageForMeetups } from "./momentum";
import type {
  CoordinatorSuggestion,
  HangoutActivity,
  HangoutBundle,
  HangoutMember,
  HangoutMood,
  HangoutRsvp,
} from "./types";

type Client = SupabaseClient<Database>;

function avatarFallback(name: string) {
  const initial = (name[0] || "C").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="64" fill="#0d9488"/><text x="64" y="74" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-size="42" font-weight="700">${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export async function listMyCircleIds(client: Client, profileId: string) {
  const { data, error } = await client
    .from("circle_members")
    .select("circle_id, joined_at, status")
    .eq("profile_id", profileId)
    .is("left_at", null)
    .order("joined_at", { ascending: false });
  if (error) throw new Error(error.message);
  // Include active + invited memberships so Path 2 invites appear in Hangouts.
  return (data ?? []).filter((m) => !m.status || m.status === "active" || m.status === "invited");
}

export async function listMyCircles(client: Client, profileId: string) {
  const memberships = await listMyCircleIds(client, profileId);
  const ids = memberships.map((m) => m.circle_id);
  if (!ids.length) return [];
  const { data, error } = await client.from("circles").select("*").in("id", ids);
  if (error) throw new Error(error.message);
  const byId = new Map((data ?? []).map((c) => [c.id, c]));
  return memberships
    .map((m) => byId.get(m.circle_id))
    .filter((c): c is CircleRow => Boolean(c));
}

export async function createHangoutCircle(client: Client, universityId: string, profileId: string) {
  const { data: viaRpc, error: rpcError } = await client.rpc("create_hangout_circle", {
    p_university_id: universityId,
  });
  if (!rpcError && viaRpc) {
    return viaRpc as CircleRow;
  }

  // Fallback for environments that have not applied the Path 3 RPC yet.
  const { data: circle, error } = await client
    .from("circles")
    .insert({
      university_id: universityId,
      stage: "introduced",
      formed_by: profileId,
    })
    .select("*")
    .single();
  if (error || !circle) {
    throw new Error(rpcError?.message ?? error?.message ?? "Could not create Circle");
  }
  const { error: memberError } = await client.from("circle_members").insert({
    circle_id: circle.id,
    profile_id: profileId,
    member_role: "member",
  });
  if (memberError) throw new Error(memberError.message);
  return circle;
}

export async function joinHangoutCircle(client: Client, circleId: string, profileId: string) {
  const { error } = await client.from("circle_members").insert({
    circle_id: circleId,
    profile_id: profileId,
    member_role: "member",
  });
  if (error && !/duplicate|unique/i.test(error.message)) {
    throw new Error(error.message);
  }
}

export async function leaveHangoutCircle(
  client: Client,
  circleId: string,
  profileId: string
) {
  const { error } = await client.rpc("leave_circle", { p_circle_id: circleId });
  if (!error) return;
  const { error: updateError } = await client
    .from("circle_members")
    .update({ left_at: new Date().toISOString() })
    .eq("circle_id", circleId)
    .eq("profile_id", profileId)
    .is("left_at", null);
  if (updateError) throw new Error(updateError.message);
}

async function loadMembers(
  client: Client,
  circleId: string,
  youId: string,
  majors: Major[],
  halls: ResidenceHall[],
  interests: InterestRow[]
): Promise<HangoutMember[]> {
  const { data: memberships, error } = await client
    .from("circle_members")
    .select("profile_id")
    .eq("circle_id", circleId)
    .is("left_at", null);
  if (error) throw new Error(error.message);
  const ids = (memberships ?? []).map((m) => m.profile_id);
  if (!ids.length) return [];

  const [{ data: directory }, { data: interestRows }, { data: availability }] = await Promise.all([
    client.from("student_directory").select("*").in("id", ids),
    client.from("user_interests").select("user_id, interest_id").in("user_id", ids),
    client.from("user_availability").select("*").in("user_id", ids),
  ]);

  const directoryById = new Map(
    (directory ?? []).map((row) => [row.id as string, row as StudentDirectoryRow])
  );
  const interestName = new Map(interests.map((i) => [i.id, i.name]));
  const interestsByUser = new Map<string, string[]>();
  for (const row of interestRows ?? []) {
    const list = interestsByUser.get(row.user_id) ?? [];
    const name = interestName.get(row.interest_id);
    if (name) list.push(name);
    interestsByUser.set(row.user_id, list);
  }
  const availabilityByUser = new Map<string, HangoutMember["availability"]>();
  for (const row of availability ?? []) {
    const list = availabilityByUser.get(row.user_id) ?? [];
    list.push({ weekday: row.weekday, time_window: row.time_window });
    availabilityByUser.set(row.user_id, list);
  }

  return ids.map((id) => {
    const dir = directoryById.get(id);
    const firstName = dir?.first_name || (id === youId ? "You" : "Member");
    const major = majors.find((m) => m.id === dir?.major_id)?.name ?? null;
    const residence = halls.find((h) => h.id === dir?.residence_hall_id)?.name ?? null;
    return {
      id,
      firstName,
      lastName: dir?.last_name ?? null,
      avatarUrl: dir?.avatar_url || avatarFallback(firstName),
      year: dir?.year ?? null,
      major,
      residence,
      interestNames: interestsByUser.get(id) ?? [],
      availability: availabilityByUser.get(id) ?? [],
      isYou: id === youId,
    };
  });
}

export async function loadHangoutBundle(
  client: Client,
  circleId: string,
  youId: string
): Promise<HangoutBundle> {
  const { data: circle, error } = await client
    .from("circles")
    .select("*")
    .eq("id", circleId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!circle) throw new Error("Circle not found");

  const [
    uniRes,
    majorsRes,
    hallsRes,
    interestsRes,
    locationsRes,
    activitiesRes,
    rulesRes,
  ] = await Promise.all([
    client.from("universities").select("name").eq("id", circle.university_id).maybeSingle(),
    client.from("majors").select("*").eq("university_id", circle.university_id),
    client.from("residence_halls").select("*").eq("university_id", circle.university_id),
    client.from("interests").select("*"),
    client.from("campus_locations").select("*").eq("university_id", circle.university_id),
    client.from("activities").select("*").eq("circle_id", circleId).order("created_at", { ascending: false }),
    client.from("circle_rules").select("*").eq("circle_id", circleId).maybeSingle(),
  ]);

  const activities = (activitiesRes.data ?? []) as ActivityRow[];
  const activityIds = activities.map((a) => a.id);
  const [{ data: rsvps }, { data: feedback }] = await Promise.all([
    activityIds.length
      ? client.from("activity_rsvps").select("*").in("activity_id", activityIds)
      : Promise.resolve({ data: [] as ActivityRsvpRow[] }),
    activityIds.length
      ? client.from("activity_feedback").select("*").in("activity_id", activityIds)
      : Promise.resolve({ data: [] as ActivityFeedbackRow[] }),
  ]);

  const rsvpsByActivity = new Map<string, ActivityRsvpRow[]>();
  for (const row of rsvps ?? []) {
    const list = rsvpsByActivity.get(row.activity_id) ?? [];
    list.push(row);
    rsvpsByActivity.set(row.activity_id, list);
  }

  const members = await loadMembers(
    client,
    circleId,
    youId,
    majorsRes.data ?? [],
    hallsRes.data ?? [],
    interestsRes.data ?? []
  );

  const hangoutActivities: HangoutActivity[] = activities.map((activity) => ({
    ...activity,
    rsvps: rsvpsByActivity.get(activity.id) ?? [],
  }));

  return {
    circle,
    members,
    activities: hangoutActivities,
    feedback: (feedback ?? []).map((f) => ({
      activity_id: f.activity_id,
      profile_id: f.profile_id,
      emoji: f.emoji,
      hang_again: f.hang_again,
    })),
    locations: (locationsRes.data ?? []) as CampusLocation[],
    universityName: uniRes.data?.name ?? "campus",
    rules: rulesRes.error ? null : ((rulesRes.data as CircleRulesRow | null) ?? null),
  };
}

export async function loadCircleMessages(client: Client, circleId: string) {
  const { data, error } = await client
    .from("messages")
    .select("*")
    .eq("circle_id", circleId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw new Error(error.message);
  const messages = (data ?? []) as MessageRow[];
  const ids = messages.map((m) => m.id);
  const { data: reactions } = ids.length
    ? await client.from("message_reactions").select("*").in("message_id", ids)
    : { data: [] as MessageReactionRow[] };
  return { messages, reactions: (reactions ?? []) as MessageReactionRow[] };
}

export function bundleToCoordinatorInput(
  bundle: HangoutBundle,
  opts: { mood?: HangoutMood; spontaneous?: boolean; now?: Date } = {}
) {
  return {
    circleId: bundle.circle.id,
    universityName: bundle.universityName,
    campusLocations: bundle.locations,
    members: bundle.members,
    previousActivities: bundle.activities.map((a) => ({
      id: a.id,
      title: a.title,
      mood: a.mood,
      emoji: a.emoji,
    })),
    feedback: bundle.feedback.map((f) => ({
      activityId: f.activity_id,
      emoji: f.emoji,
      hangAgain: f.hang_again,
    })),
    rules: bundle.rules,
    mood: opts.mood,
    spontaneous: opts.spontaneous,
    now: opts.now,
  };
}

export async function persistSuggestion(
  client: Client,
  circleId: string,
  profileId: string,
  suggestion: CoordinatorSuggestion,
  opts: { firstMission?: boolean; spontaneous?: boolean; creatorRsvp?: HangoutRsvp | null } = {}
) {
  const { data, error } = await client
    .from("activities")
    .insert({
      circle_id: circleId,
      title: suggestion.title,
      emoji: suggestion.emoji,
      description: suggestion.description,
      campus_location_id: suggestion.locationId,
      location_label: suggestion.locationLabel,
      starts_at: suggestion.startTime,
      duration_minutes: suggestion.durationMinutes,
      reason: suggestion.reason,
      mood: opts.firstMission ? "first_mission" : suggestion.category,
      created_by: profileId,
      is_spontaneous: Boolean(opts.spontaneous),
      status: "upcoming",
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not create plan");
  if (opts.creatorRsvp) {
    const { error: rsvpError } = await client.from("activity_rsvps").upsert({
      activity_id: data.id,
      profile_id: profileId,
      status: opts.creatorRsvp,
      updated_at: new Date().toISOString(),
    });
    if (rsvpError) throw new Error(rsvpError.message);
  }
  return data;
}

export async function ensureFirstMission(
  client: Client,
  bundle: HangoutBundle,
  profileId: string
) {
  const existing = bundle.activities.find(
    (a) => a.mood === "first_mission" && a.status !== "cancelled"
  );
  if (existing) return existing;
  if (bundle.activities.length > 0) return null;
  const suggestion = await getHangoutCoordinator().generateFirstMission(
    bundleToCoordinatorInput(bundle)
  );
  try {
    return await persistSuggestion(client, bundle.circle.id, profileId, suggestion, {
      firstMission: true,
      creatorRsvp: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (/unique|duplicate/i.test(message)) return null;
    throw err;
  }
}

export async function createManualPlan(
  client: Client,
  input: {
    circleId: string;
    profileId: string;
    title: string;
    category: HangoutMood;
    description: string;
    locationId: string | null;
    locationLabel: string;
    startsAt: string;
    durationMinutes: number;
  }
) {
  const emoji =
    input.category === "Food"
      ? "🍔"
      : input.category === "Active"
        ? "🏀"
        : input.category === "Study"
          ? "📚"
          : input.category === "Go Out"
            ? "🎉"
            : input.category === "Explore"
              ? "🗺"
              : "🎮";
  return persistSuggestion(
    client,
    input.circleId,
    input.profileId,
    {
      title: input.title,
      category: input.category,
      emoji,
      description: input.description,
      locationId: input.locationId,
      locationLabel: input.locationLabel,
      startTime: input.startsAt,
      durationMinutes: input.durationMinutes,
      reason: "Created by a Circle member.",
    },
    { creatorRsvp: "in" }
  );
}

export async function setHangoutRsvp(
  client: Client,
  activityId: string,
  profileId: string,
  status: HangoutRsvp
) {
  const { error } = await client.from("activity_rsvps").upsert({
    activity_id: activityId,
    profile_id: profileId,
    status,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function completeHangout(
  client: Client,
  bundle: HangoutBundle,
  activityId: string
) {
  const { error } = await client
    .from("activities")
    .update({ status: "completed" })
    .eq("id", activityId);
  if (error) throw new Error(error.message);
  const completed = bundle.activities.filter(
    (a) => a.status === "completed" || a.id === activityId
  ).length;
  await client
    .from("circles")
    .update({
      completed_meetups: completed,
      stage: dbStageForMeetups(completed),
    })
    .eq("id", bundle.circle.id);
}

export async function submitHangoutFeedback(
  client: Client,
  activityId: string,
  profileId: string,
  emoji: string,
  hangAgain: "yes" | "maybe" | "no"
) {
  const { error } = await client.from("activity_feedback").upsert({
    activity_id: activityId,
    profile_id: profileId,
    emoji,
    hang_again: hangAgain,
    submitted_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function sendCircleMessage(
  client: Client,
  circleId: string,
  profileId: string,
  body: string,
  isSystem = false
) {
  const trimmed = body.trim();
  if (!trimmed) return;
  const { error } = await client.from("messages").insert({
    circle_id: circleId,
    author_id: profileId,
    body: trimmed.slice(0, 500),
    is_system: isSystem,
  });
  if (error) throw new Error(error.message);
}

export async function toggleReaction(
  client: Client,
  messageId: string,
  profileId: string,
  emoji: string
) {
  const { data: existing } = await client
    .from("message_reactions")
    .select("emoji")
    .eq("message_id", messageId)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (existing?.emoji === emoji) {
    await client
      .from("message_reactions")
      .delete()
      .eq("message_id", messageId)
      .eq("profile_id", profileId);
    return;
  }
  const { error } = await client.from("message_reactions").upsert({
    message_id: messageId,
    profile_id: profileId,
    emoji,
  });
  if (error) throw new Error(error.message);
}

export async function maybeNudgeStartingSoon(
  client: Client,
  bundle: HangoutBundle,
  profileId: string,
  messages: MessageRow[],
  now = new Date()
) {
  const soon = bundle.activities.find((activity) => {
    if (activity.status !== "upcoming" || !activity.starts_at) return false;
    const starts = new Date(activity.starts_at).getTime();
    const delta = starts - now.getTime();
    return delta > 0 && delta <= 60 * 60 * 1000;
  });
  if (!soon) return;
  const body = `${soon.emoji ?? ""} ${soon.title} starts in one hour.`.replace(/\s+/g, " ").trim();
  if (messages.some((m) => m.is_system && m.body === body)) return;
  await sendCircleMessage(client, bundle.circle.id, profileId, body, true);
}
