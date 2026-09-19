"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useIdentity } from "@/context/IdentityContext";
import { computeAvailabilityOverlap } from "@/lib/hangouts/availability";
import { getHangoutCoordinator } from "@/lib/hangouts/coordinator";
import { computeCircleMomentum, shouldBackOff } from "@/lib/hangouts/momentum";
import {
  bundleToCoordinatorInput,
  completeHangout,
  createManualPlan,
  ensureFirstMission,
  leaveHangoutCircle,
  loadCircleMessages,
  loadHangoutBundle,
  maybeNudgeStartingSoon,
  persistSuggestion,
  sendCircleMessage,
  setHangoutRsvp,
  submitHangoutFeedback,
  toggleReaction,
} from "@/lib/hangouts/queries";
import type {
  CoordinatorSuggestion,
  HangoutBundle,
  HangoutMood,
  HangoutRsvp,
} from "@/lib/hangouts/types";
import type { MessageReactionRow, MessageRow } from "@/lib/supabase/database.types";

export function useCircleHub(circleId: string | null) {
  const { profile, ready, configured } = useIdentity();
  const [bundle, setBundle] = useState<HangoutBundle | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [reactions, setReactions] = useState<MessageReactionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingFeedbackId, setPendingFeedbackId] = useState<string | null>(null);
  const firstMissionLock = useRef(false);

  const profileId = profile?.id ?? null;

  const refresh = useCallback(async () => {
    if (!configured || !circleId || !profileId) return;
    const client = createClient();
    const next = await loadHangoutBundle(client, circleId, profileId);
    const chat = await loadCircleMessages(client, circleId);
    setBundle(next);
    setMessages(chat.messages);
    setReactions(chat.reactions);
    return { bundle: next, chat };
  }, [circleId, configured, profileId]);

  useEffect(() => {
    if (!ready || !configured || !circleId || !profileId) return;
    let cancelled = false;
    const client = createClient();
    void Promise.all([
      loadHangoutBundle(client, circleId, profileId),
      loadCircleMessages(client, circleId),
    ])
      .then(([next, chat]) => {
        if (cancelled) return;
        setBundle(next);
        setMessages(chat.messages);
        setReactions(chat.reactions);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load Circle");
      });
    return () => {
      cancelled = true;
    };
  }, [ready, configured, circleId, profileId]);

  useEffect(() => {
    if (!configured || !circleId || !profileId) return;
    const client = createClient();
    const channel = client
      .channel(`circle-hangouts:${circleId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `circle_id=eq.${circleId}` },
        () => {
          void refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activities", filter: `circle_id=eq.${circleId}` },
        () => {
          void refresh();
        }
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_rsvps" }, () => {
        void refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, () => {
        void refresh();
      })
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [circleId, configured, profileId, refresh]);

  useEffect(() => {
    if (!bundle || !profileId || !circleId || firstMissionLock.current) return;
    if (shouldBackOff(bundle.circle.completed_meetups, bundle.circle.stage)) return;
    if (bundle.activities.some((a) => a.mood === "first_mission")) return;
    firstMissionLock.current = true;
    const client = createClient();
    void ensureFirstMission(client, bundle, profileId)
      .then(() => refresh())
      .catch(() => {
        firstMissionLock.current = false;
      });
  }, [bundle, circleId, profileId, refresh]);

  useEffect(() => {
    if (!bundle || !profileId) return;
    const client = createClient();
    void maybeNudgeStartingSoon(client, bundle, profileId, messages).catch(() => undefined);
  }, [bundle, messages, profileId]);

  const overlap = useMemo(
    () => (bundle ? computeAvailabilityOverlap(bundle.members) : []),
    [bundle]
  );
  const momentum = useMemo(
    () =>
      bundle
        ? computeCircleMomentum(bundle.circle, bundle.activities, bundle.members.length)
        : null,
    [bundle]
  );
  const sharedInterests = useMemo(() => {
    if (!bundle) return [];
    const counts = new Map<string, number>();
    for (const member of bundle.members) {
      for (const name of new Set(member.interestNames)) {
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [bundle]);

  const upcoming = useMemo(() => {
    if (!bundle) return [];
    return bundle.activities
      .filter((a) => a.status === "upcoming")
      .sort((a, b) => (a.starts_at ?? a.created_at).localeCompare(b.starts_at ?? b.created_at));
  }, [bundle]);
  const past = useMemo(() => {
    if (!bundle) return [];
    return bundle.activities.filter((a) => a.status !== "upcoming");
  }, [bundle]);
  const firstMission = upcoming.find((a) => a.mood === "first_mission") ?? null;
  const nextPlan = upcoming.find((a) => a.mood !== "first_mission") ?? firstMission;
  const backOff = bundle
    ? shouldBackOff(bundle.circle.completed_meetups, bundle.circle.stage)
    : false;

  const rsvp = useCallback(
    async (activityId: string, status: HangoutRsvp) => {
      if (!profileId) return;
      await setHangoutRsvp(createClient(), activityId, profileId, status);
      await refresh();
    },
    [profileId, refresh]
  );

  const complete = useCallback(
    async (activityId: string) => {
      if (!bundle) return;
      await completeHangout(createClient(), bundle, activityId);
      setPendingFeedbackId(activityId);
      await refresh();
    },
    [bundle, refresh]
  );

  const feedback = useCallback(
    async (activityId: string, emoji: string, hangAgain: "yes" | "maybe" | "no") => {
      if (!profileId) return;
      await submitHangoutFeedback(createClient(), activityId, profileId, emoji, hangAgain);
      setPendingFeedbackId(null);
      await refresh();
    },
    [profileId, refresh]
  );

  const suggest = useCallback(
    async (mood: HangoutMood, spontaneous = false): Promise<CoordinatorSuggestion | null> => {
      if (!bundle) return null;
      return getHangoutCoordinator().generateActivity(
        bundleToCoordinatorInput(bundle, { mood, spontaneous })
      );
    },
    [bundle]
  );

  const startSuggested = useCallback(
    async (suggestion: CoordinatorSuggestion, spontaneous = false) => {
      if (!bundle || !profileId) return;
      await persistSuggestion(createClient(), bundle.circle.id, profileId, suggestion, {
        spontaneous,
        creatorRsvp: "in",
      });
      await refresh();
    },
    [bundle, profileId, refresh]
  );

  const createPlan = useCallback(
    async (input: {
      title: string;
      category: HangoutMood;
      description: string;
      locationId: string | null;
      locationLabel: string;
      startsAt: string;
      durationMinutes: number;
    }) => {
      if (!bundle || !profileId) return;
      await createManualPlan(createClient(), {
        ...input,
        circleId: bundle.circle.id,
        profileId,
      });
      await refresh();
    },
    [bundle, profileId, refresh]
  );

  const send = useCallback(
    async (body: string) => {
      if (!bundle || !profileId) return;
      await sendCircleMessage(createClient(), bundle.circle.id, profileId, body);
      await refresh();
    },
    [bundle, profileId, refresh]
  );

  const react = useCallback(
    async (messageId: string, emoji: string) => {
      if (!profileId) return;
      await toggleReaction(createClient(), messageId, profileId, emoji);
      await refresh();
    },
    [profileId, refresh]
  );

  const leave = useCallback(async () => {
    if (!bundle || !profileId) return;
    await leaveHangoutCircle(createClient(), bundle.circle.id, profileId);
  }, [bundle, profileId]);

  const dismissFeedback = useCallback(() => setPendingFeedbackId(null), []);

  const loading =
    !ready || Boolean(configured && circleId && profileId && !bundle && !error);

  return {
    bundle,
    messages,
    reactions,
    loading,
    error,
    overlap,
    momentum,
    sharedInterests,
    upcoming,
    past,
    firstMission,
    nextPlan,
    backOff,
    pendingFeedbackId,
    profileId,
    rsvp,
    complete,
    feedback,
    suggest,
    startSuggested,
    createPlan,
    send,
    react,
    leave,
    dismissFeedback,
    refresh,
  };
}
