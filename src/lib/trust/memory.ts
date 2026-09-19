import type { CommunityStanding, KarmaKind } from "@/lib/supabase/database.types";
import { clampKarma, EVENT_DELTA, KARMA_START } from "./core";

export type MemBlock = { blocker_id: string; blocked_id: string };
export type MemReport = {
  id: string;
  reporter_id: string;
  subject_profile_id: string | null;
  category: string;
  details?: string;
};
export type MemEvent = {
  id: string;
  profile_id: string;
  kind: KarmaKind;
  delta: number;
  source_key?: string;
};
export type MemRep = {
  profile_id: string;
  karma: number;
  plans_accepted: number;
  plans_attended: number;
  late_cancellations: number;
  no_shows: number;
  standing: CommunityStanding;
};

export type MemTrust = {
  blocks: MemBlock[];
  reports: MemReport[];
  events: MemEvent[];
  reputation: Record<string, MemRep>;
};

export function emptyMem(profileId = "user-a"): MemTrust {
  return {
    blocks: [],
    reports: [],
    events: [],
    reputation: {
      [profileId]: {
        profile_id: profileId,
        karma: KARMA_START,
        plans_accepted: 0,
        plans_attended: 0,
        late_cancellations: 0,
        no_shows: 0,
        standing: "good",
      },
    },
  };
}

function ensure(state: MemTrust, id: string): MemRep {
  if (!state.reputation[id]) {
    state.reputation[id] = {
      profile_id: id,
      karma: KARMA_START,
      plans_accepted: 0,
      plans_attended: 0,
      late_cancellations: 0,
      no_shows: 0,
      standing: "good",
    };
  }
  return state.reputation[id];
}

export function applyKarma(state: MemTrust, profileId: string, kind: KarmaKind, sourceKey?: string) {
  if (sourceKey && state.events.some((e) => e.profile_id === profileId && e.source_key === sourceKey)) {
    return state;
  }
  const delta = EVENT_DELTA[kind];
  const event: MemEvent = {
    id: `e-${state.events.length + 1}`,
    profile_id: profileId,
    kind,
    delta,
    source_key: sourceKey,
  };
  state.events.push(event);
  const rep = { ...ensure(state, profileId) };
  rep.karma = clampKarma(rep.karma + delta);
  if (kind === "rsvp_accepted") rep.plans_accepted += 1;
  if (kind === "rsvp_kept" || kind === "meetup_completed") rep.plans_attended += 1;
  if (kind === "late_cancellation") rep.late_cancellations += 1;
  if (kind === "no_show") rep.no_shows += 1;
  const severe = state.events.filter(
    (e) =>
      e.profile_id === profileId &&
      (e.kind === "confirmed_harassment" || e.kind === "confirmed_rule_violation")
  ).length;
  if (rep.standing !== "suspended") {
    if (severe >= 2) rep.standing = "restricted";
    else if (severe === 1 || rep.no_shows >= 3) rep.standing = "limited";
    else rep.standing = "good";
  }
  state.reputation[profileId] = rep;
  return state;
}
