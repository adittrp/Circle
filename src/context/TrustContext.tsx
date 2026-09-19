"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useIdentity } from "@/context/IdentityContext";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  CircleLeaveReason,
  CommunityStanding,
  KarmaKind,
  ReportCategory,
  VerificationStatus,
} from "@/lib/supabase/database.types";
import {
  CONDUCT_DOCUMENT_KEY,
  CONDUCT_DOCUMENT_VERSION,
  KARMA_START,
  defaultCircleRules,
  privilegesForKarma,
  reliabilityFromCounts,
  standingLabel,
  type CircleRuleSet,
} from "@/lib/trust/core";
import { getIdentityVerificationProvider } from "@/lib/trust/identityVerification";

type ReputationRow = {
  profile_id: string;
  karma: number;
  plans_accepted: number;
  plans_attended: number;
  late_cancellations: number;
  no_shows: number;
  standing: CommunityStanding;
};

type BlockRow = { blocker_id: string; blocked_id: string; created_at: string };
type ReportRow = {
  id: string;
  reporter_id: string;
  subject_profile_id: string | null;
  category: ReportCategory;
  details: string | null;
  status: string;
  created_at: string;
};

interface TrustContextValue {
  ready: boolean;
  universityVerified: boolean;
  identityStatus: VerificationStatus;
  acknowledged: boolean;
  isModerator: boolean;
  reputation: ReputationRow;
  reliabilityLabel: string;
  reliabilityMessage: string;
  standingLabel: string;
  privileges: ReturnType<typeof privilegesForKarma>;
  blocks: BlockRow[];
  demoBlockedIds: string[];
  reports: ReportRow[];
  circleRules: CircleRuleSet;
  acknowledgeConduct: () => Promise<string | null>;
  blockProfile: (profileId: string) => Promise<string | null>;
  unblockProfile: (profileId: string) => Promise<string | null>;
  reportProfile: (input: {
    subjectId: string;
    category: ReportCategory;
    details?: string;
    circleId?: string;
  }) => Promise<string | null>;
  leaveCurrentCircle: (reason?: CircleLeaveReason, notes?: string) => Promise<string | null>;
  recordKarma: (kind: KarmaKind, sourceKey?: string, sourceId?: string) => Promise<void>;
  startIdentityCheck: () => Promise<void>;
  saveCircleRules: (circleId: string, rules: CircleRuleSet) => Promise<string | null>;
  loadCircleRules: (circleId: string) => Promise<void>;
  refreshTrust: () => Promise<void>;
}

const fallbackRep: ReputationRow = {
  profile_id: "",
  karma: KARMA_START,
  plans_accepted: 0,
  plans_attended: 0,
  late_cancellations: 0,
  no_shows: 0,
  standing: "good",
};

const TrustContext = createContext<TrustContextValue | null>(null);

export function TrustProvider({ children }: { children: ReactNode }) {
  const identity = useIdentity();
  const configured = isSupabaseConfigured();
  const profileId = identity.profile?.id;
  const [dbReady, setDbReady] = useState(false);
  const [universityVerified, setUniversityVerified] = useState(false);
  const [identityStatus, setIdentityStatus] = useState<VerificationStatus>("unverified");
  const [acknowledged, setAcknowledged] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [reputation, setReputation] = useState<ReputationRow>(fallbackRep);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [demoBlockedIds, setDemoBlockedIds] = useState<string[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [circleRules, setCircleRules] = useState<CircleRuleSet>(defaultCircleRules());

  const refreshTrust = useCallback(async () => {
    if (!configured || !profileId) return;
    const supabase = createClient();
    const [
      rep,
      verifications,
      edu,
      acks,
      ownBlocks,
      ownReports,
      mods,
    ] = await Promise.all([
      supabase.from("user_reputation").select("*").eq("profile_id", profileId).maybeSingle(),
      supabase.from("user_verifications").select("status, method").eq("profile_id", profileId),
      supabase.from("profile_verifications").select("method").eq("profile_id", profileId),
      supabase
        .from("safety_acknowledgements")
        .select("id")
        .eq("profile_id", profileId)
        .eq("document_key", CONDUCT_DOCUMENT_KEY)
        .eq("document_version", CONDUCT_DOCUMENT_VERSION),
      supabase.from("blocks").select("blocker_id, blocked_id, created_at").eq("blocker_id", profileId),
      supabase
        .from("reports")
        .select("id, reporter_id, subject_profile_id, category, details, status, created_at")
        .eq("reporter_id", profileId),
      supabase.from("safety_moderators").select("profile_id").eq("profile_id", profileId),
    ]);

    if (rep.data) setReputation(rep.data as ReputationRow);
    else setReputation({ ...fallbackRep, profile_id: profileId });
    setUniversityVerified((edu.data ?? []).some((v) => v.method === "edu_email"));
    const identityRow = (verifications.data ?? []).find((v) => v.method === "identity_provider");
    setIdentityStatus((identityRow?.status as VerificationStatus) ?? "unverified");
    setAcknowledged((acks.data ?? []).length > 0);
    setBlocks((ownBlocks.data ?? []) as BlockRow[]);
    setReports((ownReports.data ?? []) as ReportRow[]);
    setIsModerator((mods.data ?? []).length > 0);
    setDbReady(true);
  }, [configured, profileId]);

  useEffect(() => {
    if (!configured || !profileId) return;
    // Remote standing load; React Compiler flags the helper even though setState is after await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshTrust();
  }, [configured, profileId, refreshTrust]);

  const ready = !configured || !profileId || dbReady;

  const acknowledgeConduct = useCallback(async () => {
    if (!configured || !profileId) {
      setAcknowledged(true);
      return null;
    }
    const supabase = createClient();
    const { error } = await supabase.from("safety_acknowledgements").insert({
      profile_id: profileId,
      document_key: CONDUCT_DOCUMENT_KEY,
      document_version: CONDUCT_DOCUMENT_VERSION,
    });
    if (error && !/duplicate/i.test(error.message)) return error.message;
    setAcknowledged(true);
    return null;
  }, [configured, profileId]);

  const blockProfile = useCallback(
    async (targetId: string) => {
      if (!targetId || targetId === profileId) return "You cannot block yourself.";
      if (!/^[0-9a-f-]{36}$/i.test(targetId)) {
        setDemoBlockedIds((ids) => (ids.includes(targetId) ? ids : [...ids, targetId]));
        return null;
      }
      if (!configured || !profileId) return "Sign in to block someone.";
      const supabase = createClient();
      const { error } = await supabase.from("blocks").insert({
        blocker_id: profileId,
        blocked_id: targetId,
      });
      if (error) return error.message;
      await refreshTrust();
      return null;
    },
    [configured, profileId, refreshTrust]
  );

  const unblockProfile = useCallback(
    async (targetId: string) => {
      if (!/^[0-9a-f-]{36}$/i.test(targetId)) {
        setDemoBlockedIds((ids) => ids.filter((id) => id !== targetId));
        return null;
      }
      if (!configured || !profileId) return null;
      const supabase = createClient();
      await supabase.from("blocks").delete().eq("blocker_id", profileId).eq("blocked_id", targetId);
      await refreshTrust();
      return null;
    },
    [configured, profileId, refreshTrust]
  );

  const reportProfile = useCallback(
    async (input: {
      subjectId: string;
      category: ReportCategory;
      details?: string;
      circleId?: string;
    }) => {
      if (!configured || !profileId) return "Sign in to send a report.";
      const supabase = createClient();
      const { error } = await supabase.from("reports").insert({
        reporter_id: profileId,
        subject_profile_id: /^[0-9a-f-]{36}$/i.test(input.subjectId) ? input.subjectId : null,
        circle_id: input.circleId && /^[0-9a-f-]{36}$/i.test(input.circleId) ? input.circleId : null,
        category: input.category,
        reason: input.category,
        details: input.details?.trim() || null,
      });
      if (error) return error.message;
      await refreshTrust();
      return null;
    },
    [configured, profileId, refreshTrust]
  );

  const leaveCurrentCircle = useCallback(
    async (reason?: CircleLeaveReason, notes?: string) => {
      if (!configured || !profileId) return null;
      const supabase = createClient();
      const { data: membership } = await supabase
        .from("circle_members")
        .select("circle_id")
        .eq("profile_id", profileId)
        .is("left_at", null)
        .maybeSingle();
      if (!membership) return null;
      const { error } = await supabase.rpc("leave_circle", {
        p_circle_id: membership.circle_id,
        ...(reason ? { p_reason: reason } : {}),
        ...(notes ? { p_notes: notes } : {}),
      });
      return error?.message ?? null;
    },
    [configured, profileId]
  );

  const recordKarma = useCallback(
    async (kind: KarmaKind, sourceKey?: string, sourceId?: string) => {
      if (!configured || !profileId) return;
      const supabase = createClient();
      await supabase.rpc("record_own_karma_event", {
        p_kind: kind,
        p_metadata: {},
        ...(sourceId && /^[0-9a-f-]{36}$/i.test(sourceId) ? { p_source_id: sourceId } : {}),
        ...(sourceKey ? { p_source_key: sourceKey } : {}),
      });
      await refreshTrust();
    },
    [configured, profileId, refreshTrust]
  );

  const startIdentityCheck = useCallback(async () => {
    if (!profileId) return;
    const session = await getIdentityVerificationProvider().startVerification(profileId);
    if (!configured) {
      setIdentityStatus(session.status);
      return;
    }
    const supabase = createClient();
    await supabase.from("user_verifications").upsert(
      {
        profile_id: profileId,
        method: "identity_provider",
        status: session.status,
        provider: session.providerId,
      },
      { onConflict: "profile_id,method" }
    );
    setIdentityStatus(session.status);
  }, [configured, profileId]);

  const saveCircleRules = useCallback(
    async (circleId: string, rules: CircleRuleSet) => {
      setCircleRules(rules);
      if (!configured || !profileId || !/^[0-9a-f-]{36}$/i.test(circleId)) return null;
      const supabase = createClient();
      const row = {
        circle_id: circleId,
        no_drinking: rules.noDrinking,
        no_smoking: rules.noSmoking,
        study_focused: rules.studyFocused,
        age_18_plus: rules.age18Plus,
        no_parties: rules.noParties,
        public_campus_only: rules.publicCampusOnly,
        low_cost: rules.lowCost,
        accessibility_needed: rules.accessibilityNeeded,
        early_evening: rules.earlyEvening,
        notes: rules.notes ?? null,
        updated_by: profileId,
      };
      const { error } = await supabase.from("circle_rules").upsert(row, { onConflict: "circle_id" });
      return error?.message ?? null;
    },
    [configured, profileId]
  );

  const loadCircleRules = useCallback(
    async (circleId: string) => {
      if (!configured || !/^[0-9a-f-]{36}$/i.test(circleId)) return;
      const supabase = createClient();
      const { data } = await supabase.from("circle_rules").select("*").eq("circle_id", circleId).maybeSingle();
      if (!data) {
        setCircleRules(defaultCircleRules());
        return;
      }
      setCircleRules({
        noDrinking: data.no_drinking,
        noSmoking: data.no_smoking,
        studyFocused: data.study_focused,
        age18Plus: data.age_18_plus,
        noParties: data.no_parties,
        publicCampusOnly: data.public_campus_only,
        lowCost: data.low_cost,
        accessibilityNeeded: data.accessibility_needed,
        earlyEvening: data.early_evening,
        notes: data.notes ?? undefined,
      });
    },
    [configured]
  );

  const reliability = reliabilityFromCounts(reputation.plans_accepted, reputation.plans_attended);
  const value = useMemo<TrustContextValue>(
    () => ({
      ready,
      universityVerified,
      identityStatus,
      acknowledged,
      isModerator,
      reputation,
      reliabilityLabel: reliability.label,
      reliabilityMessage: reliability.message,
      standingLabel: standingLabel(reputation.standing),
      privileges: privilegesForKarma(reputation.karma, reputation.standing),
      blocks,
      demoBlockedIds,
      reports,
      circleRules,
      acknowledgeConduct,
      blockProfile,
      unblockProfile,
      reportProfile,
      leaveCurrentCircle,
      recordKarma,
      startIdentityCheck,
      saveCircleRules,
      loadCircleRules,
      refreshTrust,
    }),
    [
      ready,
      universityVerified,
      identityStatus,
      acknowledged,
      isModerator,
      reputation,
      reliability.label,
      reliability.message,
      blocks,
      demoBlockedIds,
      reports,
      circleRules,
      acknowledgeConduct,
      blockProfile,
      unblockProfile,
      reportProfile,
      leaveCurrentCircle,
      recordKarma,
      startIdentityCheck,
      saveCircleRules,
      loadCircleRules,
      refreshTrust,
    ]
  );

  return <TrustContext.Provider value={value}>{children}</TrustContext.Provider>;
}

export function useTrust() {
  const ctx = useContext(TrustContext);
  if (!ctx) throw new Error("useTrust must be used within TrustProvider");
  return ctx;
}
