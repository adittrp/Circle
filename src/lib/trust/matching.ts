import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { isBlockedEitherWay } from "./core";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Hard matching constraints Path 2 can call. Never ranks people as good vs bad. */
export async function filterMatchCandidates(
  supabase: SupabaseClient<Database>,
  candidateIds: string[]
): Promise<string[]> {
  const uuids = candidateIds.filter((id) => UUID.test(id));
  const local = candidateIds.filter((id) => !UUID.test(id));
  if (uuids.length === 0) return candidateIds;

  const { data, error } = await supabase.rpc("filter_match_candidates", {
    candidate_ids: uuids,
  });
  if (error || !data) return local;

  const allowed = new Set(data);
  return [...uuids.filter((id) => allowed.has(id)), ...local];
}

export function excludeBlockedFromPool<T extends { id: string }>(
  actorId: string,
  pool: T[],
  blocks: Array<{ blocker_id: string; blocked_id: string }>,
  extraIds: Iterable<string> = []
) {
  const extra = new Set(extraIds);
  return pool.filter(
    (p) => p.id !== actorId && !extra.has(p.id) && !isBlockedEitherWay(blocks, actorId, p.id)
  );
}
