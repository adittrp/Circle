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
import { SEED_STUDENTS } from "@/data/students";
import { getSocialCoordinator } from "@/lib/ai/socialCoordinator";
import { computeCircleStage } from "@/lib/circleStrength";
import { DEMO_USER_ID } from "@/lib/constants";
import { matchCircle } from "@/lib/matching/algorithm";
import { generateWhyThisCircle } from "@/lib/matching/whyCircle";
import {
  createEmptyUser,
  createInitialState,
  loadDemoState,
  resetDemoState,
  saveDemoState,
} from "@/lib/storage";
import type {
  Activity,
  ActivityFeedback,
  ActivityMood,
  AvailabilitySlot,
  CollegeProfile,
  DemoState,
  ExtensionPayload,
  FeedbackEmoji,
  HangAgain,
  RsvpStatus,
  StudentProfile,
  User,
  VibeAnswers,
} from "@/lib/types";

interface DemoContextValue {
  ready: boolean;
  state: DemoState;
  user: User | null;
  circleMembers: StudentProfile[];
  displayMembers: Array<StudentProfile | (StudentProfile & { isYou: true })>;
  resetDemo: () => void;
  startOnboarding: () => void;
  updateProfile: (profile: Partial<CollegeProfile>) => void;
  updateVibe: (vibe: Partial<VibeAnswers>) => void;
  updateAvailability: (slots: AvailabilitySlot[]) => void;
  runMatching: () => Promise<void>;
  setPhase: (phase: DemoState["phase"]) => void;
  setRsvp: (activityId: string, status: Exclude<RsvpStatus, "pending">) => void;
  goHome: () => void;
  requestSpontaneous: (mood: ActivityMood) => Promise<Activity>;
  startPlan: (activity: Activity) => void;
  submitFeedback: (
    activityId: string,
    emoji: FeedbackEmoji,
    hangAgain: HangAgain
  ) => void;
  completeActivity: (activityId: string) => void;
  requestReshuffle: () => void;
  pushExtensionEvent: (payload: Omit<ExtensionPayload, "id" | "receivedAt">) => void;
  clearExtensionInbox: () => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function userAsStudent(user: User): StudentProfile & { isYou: true } {
  return {
    id: user.id,
    firstName: user.profile.firstName || "Alex",
    lastName: "",
    avatar: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#14b8a6"/><stop offset="100%" stop-color="#0d9488"/></linearGradient></defs><rect width="128" height="128" rx="64" fill="url(#g)"/><text x="64" y="74" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-size="42" font-weight="700">${(user.profile.firstName || "A")[0]}</text></svg>`
    )}`,
    major: user.profile.major || "Undeclared",
    year: (user.profile.year || "Sophomore") as StudentProfile["year"],
    dorm: user.profile.dorm || "Jester West",
    hometown: user.profile.hometown || "Austin, TX",
    interests: user.vibe.interests,
    availability: user.availability,
    socialEnergy: user.vibe.socialEnergy,
    planningStyle: user.vibe.planningStyle || "I'll show up",
    fridayNight: user.vibe.fridayNight || "Depends who's asking",
    foodText: user.vibe.foodText || "Where?",
    idealGroupSize: user.vibe.idealGroupSize || "4–5",
    sleepSchedule: user.vibe.sleepSchedule || "Normal",
    lookingFor: user.vibe.lookingFor,
    activityPreferences: ["Food", "Active", "Chill"],
    isYou: true,
  };
}

function simulateMemberRsvps(
  activity: Activity,
  memberIds: string[],
  preferIn = true
): Activity {
  const rsvps = { ...activity.rsvps };
  for (const id of memberIds) {
    if (id === DEMO_USER_ID) continue;
    if (rsvps[id] && rsvps[id] !== "pending") continue;
    // Deterministic-ish: most say in for first mission
    const roll = id.charCodeAt(id.length - 1) % 10;
    rsvps[id] = preferIn ? (roll < 8 ? "in" : "cant") : roll < 6 ? "in" : "cant";
  }
  return { ...activity, rsvps };
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(createInitialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadDemoState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveDemoState(state);
  }, [state, ready]);

  const persist = useCallback((updater: (prev: DemoState) => DemoState) => {
    setState((prev) => updater(prev));
  }, []);

  const resetDemo = useCallback(() => {
    const next = resetDemoState();
    setState(next);
  }, []);

  const startOnboarding = useCallback(() => {
    persist((prev) => ({
      ...prev,
      phase: "onboarding",
      user: prev.user ?? createEmptyUser(),
    }));
  }, [persist]);

  const updateProfile = useCallback(
    (profile: Partial<CollegeProfile>) => {
      persist((prev) => {
        const user = prev.user ?? createEmptyUser();
        return {
          ...prev,
          user: { ...user, profile: { ...user.profile, ...profile } },
        };
      });
    },
    [persist]
  );

  const updateVibe = useCallback(
    (vibe: Partial<VibeAnswers>) => {
      persist((prev) => {
        const user = prev.user ?? createEmptyUser();
        return {
          ...prev,
          user: { ...user, vibe: { ...user.vibe, ...vibe } },
        };
      });
    },
    [persist]
  );

  const updateAvailability = useCallback(
    (slots: AvailabilitySlot[]) => {
      persist((prev) => {
        const user = prev.user ?? createEmptyUser();
        return { ...prev, user: { ...user, availability: slots } };
      });
    },
    [persist]
  );

  const runMatching = useCallback(async () => {
    const user = state.user ?? createEmptyUser();
    const matched = matchCircle(user, SEED_STUDENTS, 4);
    const why = generateWhyThisCircle(user, matched);
    const coordinator = getSocialCoordinator();
    const suggestion = await coordinator.generateFirstMission({
      user,
      members: matched,
    });

    const memberIds = [DEMO_USER_ID, ...matched.map((m) => m.id)];
    const firstMission: Activity = {
      id: uid("act"),
      title: suggestion.title,
      emoji: suggestion.emoji,
      description: suggestion.description,
      location: suggestion.location,
      dateLabel: suggestion.date,
      time: suggestion.time,
      reason: suggestion.reason,
      estimatedDuration: suggestion.estimatedDuration,
      mood: "First Mission",
      status: "upcoming",
      rsvps: Object.fromEntries(memberIds.map((id) => [id, "pending" as RsvpStatus])),
      createdAt: new Date().toISOString(),
    };

    // Schedule a next plan too for dashboard richness
    const nextSuggestion = await coordinator.generateActivity({
      user,
      members: matched,
      mood: "Active",
      previousActivities: [firstMission],
    });

    const nextPlan: Activity = {
      id: uid("act"),
      title: nextSuggestion.title,
      emoji: nextSuggestion.emoji,
      description: nextSuggestion.description,
      location: nextSuggestion.location,
      dateLabel: nextSuggestion.date,
      time: nextSuggestion.time,
      reason: nextSuggestion.reason,
      estimatedDuration: nextSuggestion.estimatedDuration,
      mood: nextSuggestion.mood,
      status: "upcoming",
      rsvps: Object.fromEntries(memberIds.map((id) => [id, "pending" as RsvpStatus])),
      createdAt: new Date().toISOString(),
    };

    // Pre-RSVP some members on next plan for dashboard demo
    const primedNext = simulateMemberRsvps(nextPlan, memberIds, true);
    primedNext.rsvps[DEMO_USER_ID] = "pending";

    persist(() => ({
      version: state.version,
      phase: "reveal",
      user,
      circle: {
        id: uid("circle"),
        memberIds,
        formedAt: new Date().toISOString(),
        stage: "Introduced",
        completedMeetups: 0,
        whyThisCircle: why,
      },
      activities: [firstMission, primedNext],
      feedback: [],
      pendingFeedbackActivityId: null,
      reshuffleRequested: false,
      extensionInbox: [],
    }));
  }, [persist, state.user, state.version]);

  const setPhase = useCallback(
    (phase: DemoState["phase"]) => {
      persist((prev) => ({ ...prev, phase }));
    },
    [persist]
  );

  const setRsvp = useCallback(
    (activityId: string, status: Exclude<RsvpStatus, "pending">) => {
      persist((prev) => {
        if (!prev.circle) return prev;
        const activities = prev.activities.map((a) => {
          if (a.id !== activityId) return a;
          const nextRsvps: Record<string, RsvpStatus> = {
            ...a.rsvps,
            [DEMO_USER_ID]: status,
          };
          let next: Activity = { ...a, rsvps: nextRsvps };
          if (status === "in") {
            next = simulateMemberRsvps(next, prev.circle!.memberIds, true);
            next = {
              ...next,
              rsvps: { ...next.rsvps, [DEMO_USER_ID]: "in" },
            };
          }
          return next;
        });
        return { ...prev, activities };
      });
    },
    [persist]
  );

  const goHome = useCallback(() => {
    persist((prev) => ({ ...prev, phase: "home" }));
  }, [persist]);

  const requestSpontaneous = useCallback(
    async (mood: ActivityMood) => {
      const user = state.user!;
      const members = SEED_STUDENTS.filter((s) =>
        state.circle?.memberIds.includes(s.id)
      );
      const suggestion = await getSocialCoordinator().generateActivity({
        user,
        members,
        mood,
        spontaneous: true,
        previousActivities: state.activities,
        feedback: state.feedback,
      });

      const memberIds = state.circle!.memberIds;
      // Pick 3 free members deterministically
      const free = memberIds.filter((id) => id !== DEMO_USER_ID).slice(0, 2);
      const rsvps: Record<string, RsvpStatus> = Object.fromEntries(
        memberIds.map((id) => [id, "cant" as RsvpStatus])
      );
      rsvps[DEMO_USER_ID] = "in";
      for (const id of free) rsvps[id] = "in";

      const activity: Activity = {
        id: uid("act"),
        title: suggestion.title,
        emoji: suggestion.emoji,
        description: suggestion.description,
        location: suggestion.location,
        dateLabel: suggestion.date,
        time: suggestion.time,
        reason: suggestion.reason,
        estimatedDuration: suggestion.estimatedDuration,
        mood: suggestion.mood,
        status: "upcoming",
        rsvps,
        createdAt: new Date().toISOString(),
        isSpontaneous: true,
      };
      return activity;
    },
    [state.activities, state.circle, state.feedback, state.user]
  );

  const startPlan = useCallback(
    (activity: Activity) => {
      persist((prev) => ({
        ...prev,
        activities: [activity, ...prev.activities],
      }));
    },
    [persist]
  );

  const completeActivity = useCallback(
    (activityId: string) => {
      persist((prev) => {
        const activities = prev.activities.map((a) =>
          a.id === activityId ? { ...a, status: "completed" as const } : a
        );
        const completedCount = activities.filter((a) => a.status === "completed").length;
        return {
          ...prev,
          activities,
          pendingFeedbackActivityId: activityId,
          circle: prev.circle
            ? {
                ...prev.circle,
                completedMeetups: completedCount,
                stage: computeCircleStage(completedCount),
              }
            : prev.circle,
        };
      });
    },
    [persist]
  );

  const submitFeedback = useCallback(
    (activityId: string, emoji: FeedbackEmoji, hangAgain: HangAgain) => {
      const entry: ActivityFeedback = {
        activityId,
        emoji,
        hangAgain,
        submittedAt: new Date().toISOString(),
      };
      persist((prev) => ({
        ...prev,
        feedback: [...prev.feedback.filter((f) => f.activityId !== activityId), entry],
        pendingFeedbackActivityId: null,
      }));
    },
    [persist]
  );

  const requestReshuffle = useCallback(() => {
    persist((prev) => ({ ...prev, reshuffleRequested: true }));
  }, [persist]);

  const pushExtensionEvent = useCallback(
    (payload: Omit<ExtensionPayload, "id" | "receivedAt">) => {
      persist((prev) => ({
        ...prev,
        extensionInbox: [
          {
            ...payload,
            id: uid("ext"),
            receivedAt: new Date().toISOString(),
          },
          ...prev.extensionInbox,
        ],
      }));
    },
    [persist]
  );

  const clearExtensionInbox = useCallback(() => {
    persist((prev) => ({ ...prev, extensionInbox: [] }));
  }, [persist]);

  const circleMembers = useMemo(() => {
    if (!state.circle) return [];
    return SEED_STUDENTS.filter((s) => state.circle!.memberIds.includes(s.id));
  }, [state.circle]);

  const displayMembers = useMemo(() => {
    if (!state.user || !state.circle) return [];
    const you = userAsStudent(state.user);
    return [you, ...circleMembers];
  }, [state.user, state.circle, circleMembers]);

  const value: DemoContextValue = {
    ready,
    state,
    user: state.user,
    circleMembers,
    displayMembers,
    resetDemo,
    startOnboarding,
    updateProfile,
    updateVibe,
    updateAvailability,
    runMatching,
    setPhase,
    setRsvp,
    goHome,
    requestSpontaneous,
    startPlan,
    submitFeedback,
    completeActivity,
    requestReshuffle,
    pushExtensionEvent,
    clearExtensionInbox,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within DemoProvider");
  return ctx;
}
