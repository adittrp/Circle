import { DEMO_USER_ID, DEMO_VERSION, STORAGE_KEY } from "@/lib/constants";
import type { DemoState, User, VibeAnswers } from "@/lib/types";

export function emptyVibe(): VibeAnswers {
  return {
    fridayNight: null,
    foodText: null,
    idealGroupSize: null,
    socialEnergy: 55,
    planningStyle: null,
    interests: [],
    sleepSchedule: null,
    lookingFor: [],
  };
}

export function createEmptyUser(): User {
  return {
    id: DEMO_USER_ID,
    isDemo: true,
    profile: {
      firstName: "Alex",
      university: "University of Texas at Austin",
      year: "",
      major: "",
      dorm: "",
      hometown: "",
    },
    vibe: emptyVibe(),
    availability: [],
  };
}

export function createInitialState(): DemoState {
  return {
    version: DEMO_VERSION,
    phase: "landing",
    user: null,
    circle: null,
    activities: [],
    feedback: [],
    pendingFeedbackActivityId: null,
    reshuffleRequested: false,
    extensionInbox: [],
  };
}

export function loadDemoState(): DemoState {
  if (typeof window === "undefined") return createInitialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as DemoState;
    if (!parsed || parsed.version !== DEMO_VERSION) return createInitialState();
    return parsed;
  } catch {
    return createInitialState();
  }
}

export function saveDemoState(state: DemoState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetDemoState(): DemoState {
  const next = createInitialState();
  saveDemoState(next);
  return next;
}
