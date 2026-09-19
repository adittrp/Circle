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

export interface RealCircleMember {
  profile_id: string;
  first_name: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  year?: string | null;
  major_name?: string | null;
  residence_name?: string | null;
  status: string;
  member_role: string;
  is_you: boolean;
  interest_names?: string[];
}

export interface RealCircle {
  id: string;
  universityId: string;
  stage: string;
  formedAt: string;
  whyTogether: string[];
  matchScore: number | null;
  matchMeta: Record<string, unknown> | null;
  members: RealCircleMember[];
}

interface RealCircleContextValue {
  ready: boolean;
  circle: RealCircle | null;
  refresh: () => Promise<void>;
  findCircle: () => Promise<{ error: string | null; circleId: string | null }>;
  inviteStudent: (inviteeId: string) => Promise<{ error: string | null; circleId: string | null }>;
}

const RealCircleContext = createContext<RealCircleContextValue | null>(null);

export function RealCircleProvider({ children }: { children: ReactNode }) {
  const identity = useIdentity();
  const [ready, setReady] = useState(false);
  const [circle, setCircle] = useState<RealCircle | null>(null);

  const refresh = useCallback(async () => {
    if (!identity.configured || !identity.user || !identity.profile?.onboarding_completed_at) {
      setCircle(null);
      setReady(true);
      return;
    }
    const res = await fetch("/api/matching/my-circle");
    const json = (await res.json()) as { circle?: RealCircle | null; error?: string };
    setCircle(json.circle ?? null);
    setReady(true);
  }, [identity.configured, identity.user, identity.profile?.onboarding_completed_at]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) void refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const findCircle = useCallback(async () => {
    const res = await fetch("/api/matching/find-circle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = (await res.json()) as { error?: string; circleId?: string };
    if (!res.ok) return { error: json.error ?? "Matching failed", circleId: null };
    await refresh();
    return { error: null, circleId: json.circleId ?? null };
  }, [refresh]);

  const inviteStudent = useCallback(
    async (inviteeId: string) => {
      const res = await fetch("/api/matching/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteeId }),
      });
      const json = (await res.json()) as { error?: string; circleId?: string };
      if (!res.ok) return { error: json.error ?? "Invite failed", circleId: null };
      await refresh();
      return { error: null, circleId: json.circleId ?? null };
    },
    [refresh]
  );

  const value = useMemo(
    () => ({ ready, circle, refresh, findCircle, inviteStudent }),
    [ready, circle, refresh, findCircle, inviteStudent]
  );

  return (
    <RealCircleContext.Provider value={value}>{children}</RealCircleContext.Provider>
  );
}

export function useRealCircle() {
  const ctx = useContext(RealCircleContext);
  if (!ctx) throw new Error("useRealCircle must be used within RealCircleProvider");
  return ctx;
}
