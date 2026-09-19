"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  DEFAULT_VISIBILITY,
  type AvailabilityWindow,
  type Database,
  type InterestRow,
  type Major,
  type Profile,
  type ProfileVisibility,
  type ResidenceHall,
  type University,
  type UserAvailability,
  type UserPreferences,
  type YearLevel,
} from "@/lib/supabase/database.types";

const PROFILE_SELECT =
  "id, auth_user_id, first_name, last_name, avatar_url, university_id, year, major_id, second_major_id, minor, residence_hall_id, hometown, bio, visibility, onboarding_completed_at, is_synthetic, created_at, updated_at";

export interface IdentitySnapshot {
  user: User | null;
  profile: Profile | null;
  university: University | null;
  universities: University[];
  domains: { university_id: string; domain: string }[];
  majors: Major[];
  halls: ResidenceHall[];
  interests: InterestRow[];
  selectedInterestIds: string[];
  availability: UserAvailability[];
  preferences: UserPreferences | null;
  email: string | null;
}

interface IdentityContextValue extends IdentitySnapshot {
  ready: boolean;
  configured: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (patch: Partial<Profile>) => Promise<{ error: string | null }>;
  saveInterests: (ids: string[]) => Promise<{ error: string | null }>;
  saveAvailability: (
    slots: { weekday: number; time_window: AvailabilityWindow }[]
  ) => Promise<{ error: string | null }>;
  savePreferences: (
    patch: Partial<UserPreferences>
  ) => Promise<{ error: string | null }>;
  completeOnboarding: () => Promise<{ error: string | null }>;
  uploadAvatar: (file: File) => Promise<{ url: string | null; error: string | null }>;
  loadCampusCatalog: (universityId: string) => Promise<void>;
}

const empty: IdentitySnapshot = {
  user: null,
  profile: null,
  university: null,
  universities: [],
  domains: [],
  majors: [],
  halls: [],
  interests: [],
  selectedInterestIds: [],
  availability: [],
  preferences: null,
  email: null,
};

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [ready, setReady] = useState(!configured);
  const [snap, setSnap] = useState<IdentitySnapshot>(empty);
  const snapRef = useRef(snap);

  useEffect(() => {
    snapRef.current = snap;
  }, [snap]);

  const refresh = useCallback(async () => {
    await Promise.resolve();
    if (!configured) {
      setSnap(empty);
      setReady(true);
      return;
    }
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const [{ data: universities }, { data: domains }, { data: catalogInterests }] =
      await Promise.all([
        supabase.from("universities").select("*").order("name"),
        supabase.from("university_email_domains").select("university_id, domain"),
        supabase.from("interests").select("*").order("category", { ascending: true }).order("name", { ascending: true }),
      ]);

    if (!user) {
      setSnap({
        ...empty,
        universities: universities ?? [],
        domains: domains ?? [],
        interests: catalogInterests ?? [],
      });
      setReady(true);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("auth_user_id", user.id)
      .maybeSingle();

    let majors: Major[] = [];
    let halls: ResidenceHall[] = [];
    let selectedInterestIds: string[] = [];
    let availability: UserAvailability[] = [];
    let preferences: UserPreferences | null = null;
    let university: University | null = null;

    if (profile) {
      university =
        universities?.find((u) => u.id === profile.university_id) ?? null;
      const uniId = profile.university_id;
      const [majorRes, hallRes, interestRes, availRes, prefRes] = await Promise.all([
        uniId
          ? supabase.from("majors").select("*").eq("university_id", uniId).order("name")
          : Promise.resolve({ data: [] as Major[] }),
        uniId
          ? supabase
              .from("residence_halls")
              .select("*")
              .eq("university_id", uniId)
              .order("name")
          : Promise.resolve({ data: [] as ResidenceHall[] }),
        supabase.from("user_interests").select("interest_id").eq("user_id", profile.id),
        supabase.from("user_availability").select("*").eq("user_id", profile.id),
        supabase.from("user_preferences").select("*").eq("user_id", profile.id).maybeSingle(),
      ]);
      majors = majorRes.data ?? [];
      halls = hallRes.data ?? [];
      selectedInterestIds = (interestRes.data ?? []).map((r) => r.interest_id);
      availability = availRes.data ?? [];
      preferences = prefRes.data ?? null;
    }

    setSnap({
      user,
      profile: profile
        ? {
            ...profile,
            visibility: {
              ...DEFAULT_VISIBILITY,
              ...(profile.visibility as Partial<ProfileVisibility>),
            },
          }
        : null,
      university,
      universities: universities ?? [],
      domains: domains ?? [],
      majors,
      halls,
      interests: catalogInterests ?? [],
      selectedInterestIds,
      availability,
      preferences,
      email: user.email ?? null,
    });
    setReady(true);
  }, [configured]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) void refresh();
    });
    if (!configured) return;
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void refresh();
      }
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [configured, refresh]);

  const loadCampusCatalog = useCallback(async (universityId: string) => {
    const supabase = createClient();
    const [majorRes, hallRes] = await Promise.all([
      supabase.from("majors").select("*").eq("university_id", universityId).order("name"),
      supabase
        .from("residence_halls")
        .select("*")
        .eq("university_id", universityId)
        .order("name"),
    ]);
    setSnap((s) => ({
      ...s,
      majors: majorRes.data ?? [],
      halls: hallRes.data ?? [],
      university: s.universities.find((u) => u.id === universityId) ?? s.university,
    }));
  }, []);

  const saveProfile = useCallback(
    async (patch: Partial<Profile>) => {
      const current = snapRef.current.profile;
      if (!current) return { error: "No profile" };
      const universityChanged =
        patch.university_id != null && patch.university_id !== current.university_id;
      setSnap((s) => {
        if (!s.profile) return s;
        const nextProfile = { ...s.profile, ...patch };
        return {
          ...s,
          profile: nextProfile,
          university: nextProfile.university_id
            ? s.universities.find((u) => u.id === nextProfile.university_id) ?? s.university
            : null,
        };
      });
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update(patch as Database["public"]["Tables"]["profiles"]["Update"])
        .eq("id", current.id);
      if (error) {
        await refresh();
        return { error: error.message };
      }
      if (universityChanged && patch.university_id) {
        await loadCampusCatalog(patch.university_id);
      }
      return { error: null };
    },
    [loadCampusCatalog, refresh]
  );

  const saveInterests = useCallback(async (ids: string[]) => {
    const current = snapRef.current.profile;
    if (!current) return { error: "No profile" };
    setSnap((s) => ({ ...s, selectedInterestIds: ids }));
    const supabase = createClient();
    await supabase.from("user_interests").delete().eq("user_id", current.id);
    if (ids.length) {
      const { error } = await supabase.from("user_interests").insert(
        ids.map((interest_id) => ({ user_id: current.id, interest_id }))
      );
      if (error) {
        await refresh();
        return { error: error.message };
      }
    }
    return { error: null };
  }, [refresh]);

  const saveAvailability = useCallback(
    async (slots: { weekday: number; time_window: AvailabilityWindow }[]) => {
      const current = snapRef.current.profile;
      if (!current) return { error: "No profile" };
      setSnap((s) => ({
        ...s,
        availability: slots.map((slot, i) => ({
          id: s.availability[i]?.id ?? `local-${slot.weekday}-${slot.time_window}`,
          user_id: current.id,
          weekday: slot.weekday,
          time_window: slot.time_window,
        })),
      }));
      const supabase = createClient();
      await supabase.from("user_availability").delete().eq("user_id", current.id);
      if (slots.length) {
        const { error } = await supabase.from("user_availability").insert(
          slots.map((s) => ({
            user_id: current.id,
            weekday: s.weekday,
            time_window: s.time_window,
          }))
        );
        if (error) {
          await refresh();
          return { error: error.message };
        }
      }
      return { error: null };
    },
    [refresh]
  );

  const savePreferences = useCallback(async (patch: Partial<UserPreferences>) => {
    const current = snapRef.current.profile;
    if (!current) return { error: "No profile" };
    setSnap((s) => ({
      ...s,
      preferences: s.preferences
        ? { ...s.preferences, ...patch }
        : ({ user_id: current.id, ...patch } as UserPreferences),
    }));
    const supabase = createClient();
    const { error } = await supabase
      .from("user_preferences")
      .upsert({ user_id: current.id, ...patch }, { onConflict: "user_id" });
    if (error) {
      await refresh();
      return { error: error.message };
    }
    return { error: null };
  }, [refresh]);

  const completeOnboarding = useCallback(async () => {
    return saveProfile({ onboarding_completed_at: new Date().toISOString() } as Partial<Profile>);
  }, [saveProfile]);

  const uploadAvatar = useCallback(
    async (file: File) => {
      const user = snapRef.current.user;
      if (!user) return { url: null, error: "Not signed in" };
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) return { url: null, error: error.message };
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      await saveProfile({ avatar_url: url } as Partial<Profile>);
      return { url, error: null };
    },
    [saveProfile]
  );

  const signOut = useCallback(async () => {
    if (!configured) return;
    await createClient().auth.signOut();
    await refresh();
  }, [configured, refresh]);

  const value = useMemo<IdentityContextValue>(
    () => ({
      ...snap,
      ready,
      configured,
      refresh,
      signOut,
      saveProfile,
      saveInterests,
      saveAvailability,
      savePreferences,
      completeOnboarding,
      uploadAvatar,
      loadCampusCatalog,
    }),
    [
      snap,
      ready,
      configured,
      refresh,
      signOut,
      saveProfile,
      saveInterests,
      saveAvailability,
      savePreferences,
      completeOnboarding,
      uploadAvatar,
      loadCampusCatalog,
    ]
  );

  return (
    <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>
  );
}

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentity must be used within IdentityProvider");
  return ctx;
}

export type { YearLevel };
