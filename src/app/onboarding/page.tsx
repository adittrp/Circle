"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ProgressBar, StepDots } from "@/components/ui/Progress";
import { useIdentity } from "@/context/IdentityContext";
import { useTrust } from "@/context/TrustContext";
import { CODE_OF_CONDUCT } from "@/lib/trust/core";
import {
  AVAILABILITY_WINDOWS,
  INTEREST_CATEGORIES,
  WEEKDAYS,
  YEAR_LEVELS,
} from "@/lib/identity/catalog";
import { matchUniversityByEmail } from "@/lib/identity/university";
import {
  VIBE_GROUP_SIZE,
  VIBE_PLANNING,
  VIBE_SLEEP,
  VIBE_WEEKEND,
} from "@/lib/identity/vibe";
import type { AvailabilityWindow, YearLevel } from "@/lib/supabase/database.types";

const fieldClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-soft)]";

type BasicsDraft = {
  first_name: string;
  last_name: string;
  year: YearLevel | "";
  hometown: string;
  bio: string;
};

type CampusDraft = {
  university_id: string;
  major_id: string;
  minor: string;
  residence_hall_id: string;
};

type Slot = { weekday: number; time_window: AvailabilityWindow };

type VibeDraft = {
  social_energy: number;
  spontaneous_vs_planned: number;
  sleep_schedule: string;
  group_size: string;
  planning_style: string;
  weekend_style: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const identity = useIdentity();
  const trust = useTrust();
  const [step, setStep] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [basics, setBasics] = useState<BasicsDraft>({
    first_name: "",
    last_name: "",
    year: "",
    hometown: "",
    bio: "",
  });
  const [campus, setCampus] = useState<CampusDraft>({
    university_id: "",
    major_id: "",
    minor: "",
    residence_hall_id: "",
  });
  const [interestIds, setInterestIds] = useState<string[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [vibe, setVibe] = useState<VibeDraft>({
    social_energy: 55,
    spontaneous_vs_planned: 50,
    sleep_schedule: "",
    group_size: "",
    planning_style: "",
    weekend_style: "",
  });

  const inferred = useMemo(() => {
    if (!identity.email) return null;
    return matchUniversityByEmail(
      identity.email,
      identity.universities,
      identity.domains
    );
  }, [identity.email, identity.universities, identity.domains]);

  const saveProfile = identity.saveProfile;
  const loadCampusCatalog = identity.loadCampusCatalog;
  const profileId = identity.profile?.id;
  const universityId = identity.profile?.university_id;

  useEffect(() => {
    if (identity.configured && identity.ready && !identity.user) {
      router.replace("/signup");
    }
  }, [identity.configured, identity.ready, identity.user, router]);

  useEffect(() => {
    if (inferred && profileId && !universityId) {
      void saveProfile({ university_id: inferred.id });
      void loadCampusCatalog(inferred.id);
    }
  }, [inferred, profileId, universityId, saveProfile, loadCampusCatalog]);

  useEffect(() => {
    if (!identity.ready || !identity.profile || hydrated) return;
    const profile = identity.profile;
    const uni = profile.university_id ?? inferred?.id ?? "";
    const nextBasics: BasicsDraft = {
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
      year: (profile.year ?? "") as BasicsDraft["year"],
      hometown: profile.hometown ?? "",
      bio: profile.bio ?? "",
    };
    const nextCampus = {
      university_id: uni,
      major_id: profile.major_id ?? "",
      minor: profile.minor ?? "",
      residence_hall_id: profile.residence_hall_id ?? "",
    };
    const nextInterests = identity.selectedInterestIds;
    const nextSlots = identity.availability.map((s) => ({
      weekday: s.weekday,
      time_window: s.time_window,
    }));
    const nextVibe = {
      social_energy: identity.preferences?.social_energy ?? 55,
      spontaneous_vs_planned: identity.preferences?.spontaneous_vs_planned ?? 50,
      sleep_schedule: identity.preferences?.sleep_schedule ?? "",
      group_size: identity.preferences?.group_size ?? "",
      planning_style: identity.preferences?.planning_style ?? "",
      weekend_style: identity.preferences?.weekend_style ?? "",
    };
    queueMicrotask(() => {
      setBasics(nextBasics);
      setCampus(nextCampus);
      setInterestIds(nextInterests);
      setSlots(nextSlots);
      setVibe(nextVibe);
      setHydrated(true);
    });
    if (uni) void loadCampusCatalog(uni);
  }, [
    identity.ready,
    identity.profile,
    identity.selectedInterestIds,
    identity.availability,
    identity.preferences,
    inferred?.id,
    hydrated,
    loadCampusCatalog,
  ]);

  useEffect(() => {
    if (!hydrated || campus.university_id || !inferred?.id) return;
    const uni = inferred.id;
    queueMicrotask(() => {
      setCampus((d) => ({ ...d, university_id: uni }));
    });
    void loadCampusCatalog(uni);
  }, [hydrated, campus.university_id, inferred?.id, loadCampusCatalog]);

  const answered =
    Number(vibe.sleep_schedule !== "") +
    Number(vibe.group_size !== "") +
    Number(vibe.planning_style !== "") +
    Number(vibe.weekend_style !== "") +
    2;

  if (!identity.ready) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-500">
        Loading your profile...
      </main>
    );
  }

  if (identity.configured && !identity.user) {
    return null;
  }

  const basicsOk = Boolean(basics.first_name.trim() && basics.year);
  const campusOk = Boolean(campus.university_id && campus.major_id && campus.residence_hall_id);
  const interestsOk = interestIds.length >= 2;
  const availabilityOk = slots.length >= 2;
  const canContinue =
    step === 0
      ? basicsOk
      : step === 1
        ? campusOk
        : step === 2
          ? interestsOk
          : step === 3
            ? availabilityOk
            : step === 4
              ? agreed || trust.acknowledged
              : true;

  const persistStep = async (current: number): Promise<{ error: string | null }> => {
    if (current === 0) {
      return saveProfile({
        first_name: basics.first_name.trim(),
        last_name: basics.last_name.trim() || null,
        year: basics.year || null,
        hometown: basics.hometown.trim() || null,
        bio: basics.bio.trim() || null,
      });
    }
    if (current === 1) {
      return saveProfile({
        university_id: campus.university_id || null,
        major_id: campus.major_id || null,
        minor: campus.minor.trim() || null,
        residence_hall_id: campus.residence_hall_id || null,
      });
    }
    if (current === 2) {
      return identity.saveInterests(interestIds);
    }
    if (current === 3) {
      return identity.saveAvailability(slots);
    }
    if (current === 4) {
      const message = await trust.acknowledgeConduct();
      return { error: message };
    }
    return { error: null };
  };

  const finish = async (withVibe: boolean) => {
    setSaving(true);
    setError(null);
    const stepError = await persistStep(3);
    if (stepError.error) {
      setSaving(false);
      setError(stepError.error);
      return;
    }
    const rulesError = await persistStep(4);
    if (rulesError.error) {
      setSaving(false);
      setError(rulesError.error);
      return;
    }
    if (withVibe) {
      const { error: prefError } = await identity.savePreferences({
        social_energy: vibe.social_energy,
        spontaneous_vs_planned: vibe.spontaneous_vs_planned,
        sleep_schedule: vibe.sleep_schedule || null,
        group_size: vibe.group_size || null,
        planning_style: vibe.planning_style || null,
        weekend_style: vibe.weekend_style || null,
        vibe_completed: true,
      });
      if (prefError) {
        setSaving(false);
        setError(prefError);
        return;
      }
    }
    const { error: doneError } = await identity.completeOnboarding();
    setSaving(false);
    if (doneError) {
      setError(doneError);
      return;
    }
    router.push("/home");
  };

  const next = async () => {
    if (step < 5) {
      setSaving(true);
      setError(null);
      const { error: stepError } = await persistStep(step);
      setSaving(false);
      if (stepError) {
        setError(stepError);
        return;
      }
      setStep((s) => s + 1);
      return;
    }
    await finish(true);
  };

  const toggleInterest = (id: string) => {
    setInterestIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  };

  const toggleSlot = (weekday: number, time_window: AvailabilityWindow) => {
    setSlots((current) => {
      const exists = current.some(
        (s) => s.weekday === weekday && s.time_window === time_window
      );
      return exists
        ? current.filter((s) => !(s.weekday === weekday && s.time_window === time_window))
        : [...current, { weekday, time_window }];
    });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-6 sm:px-8">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => (step === 0 ? router.push("/") : setStep((s) => s - 1))}
          className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <Wordmark compact href="/home" />
        <StepDots step={Math.min(step, 5)} total={6} />
      </div>
      <ProgressBar value={((Math.min(step, 5) + 1) / 6) * 100} />

      <div className="mt-8 flex-1">
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div key="basics" {...pane} className="space-y-5">
              <Header kicker="Your profile" title="Who are you?" body="A real name and a face help people show up." />
              <Field label="First name">
                <input
                  className={fieldClass}
                  value={basics.first_name}
                  onChange={(e) => setBasics((d) => ({ ...d, first_name: e.target.value }))}
                />
              </Field>
              <Field label="Last name">
                <input
                  className={fieldClass}
                  value={basics.last_name}
                  onChange={(e) => setBasics((d) => ({ ...d, last_name: e.target.value }))}
                />
              </Field>
              <Field label="Year">
                <select
                  className={fieldClass}
                  value={basics.year}
                  onChange={(e) =>
                    setBasics((d) => ({ ...d, year: e.target.value as YearLevel }))
                  }
                >
                  <option value="">Select year</option>
                  {YEAR_LEVELS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Hometown">
                <input
                  className={fieldClass}
                  placeholder="e.g. Houston, TX"
                  value={basics.hometown}
                  onChange={(e) => setBasics((d) => ({ ...d, hometown: e.target.value }))}
                />
              </Field>
              <Field label="Short bio">
                <textarea
                  className={`${fieldClass} min-h-24`}
                  maxLength={180}
                  placeholder="What should people know before the first hang?"
                  value={basics.bio}
                  onChange={(e) => setBasics((d) => ({ ...d, bio: e.target.value }))}
                />
              </Field>
              <Field label="Profile photo">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void identity.uploadAvatar(file);
                  }}
                />
              </Field>
            </motion.div>
          ) : null}

          {step === 1 ? (
            <motion.div key="campus" {...pane} className="space-y-5">
              <Header
                kicker="Campus"
                title="Confirm your university"
                body="A .edu domain is a starting point — you still pick the campus you actually attend."
              />
              {inferred ? (
                <p className="rounded-2xl bg-[var(--brand-soft)] px-4 py-3 text-sm text-[var(--brand-ink)]">
                  We matched <span className="font-semibold">{identity.email}</span> to{" "}
                  <span className="font-semibold">{inferred.name}</span>. Confirm or change it below.
                </p>
              ) : (
                <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-orange-900">
                  We couldn&apos;t map your email domain automatically. Choose your university.
                </p>
              )}
              <Field label="University">
                <select
                  className={fieldClass}
                  value={campus.university_id}
                  onChange={(e) => {
                    const university_id = e.target.value;
                    setCampus({
                      university_id,
                      major_id: "",
                      minor: "",
                      residence_hall_id: "",
                    });
                    if (university_id) void loadCampusCatalog(university_id);
                  }}
                >
                  <option value="">Select university</option>
                  {identity.universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Major">
                <select
                  className={fieldClass}
                  value={campus.major_id}
                  onChange={(e) => setCampus((d) => ({ ...d, major_id: e.target.value }))}
                >
                  <option value="">Select major</option>
                  {identity.majors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Second major / minor (optional)">
                <input
                  className={fieldClass}
                  value={campus.minor}
                  onChange={(e) => setCampus((d) => ({ ...d, minor: e.target.value }))}
                />
              </Field>
              <Field label="Residence">
                <select
                  className={fieldClass}
                  value={campus.residence_hall_id}
                  onChange={(e) =>
                    setCampus((d) => ({ ...d, residence_hall_id: e.target.value }))
                  }
                >
                  <option value="">Select hall or off-campus</option>
                  {identity.halls.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                      {h.data_status === "needs_review" ? " (unverified listing)" : ""}
                    </option>
                  ))}
                </select>
              </Field>
            </motion.div>
          ) : null}

          {step === 2 ? (
            <motion.div key="interests" {...pane} className="space-y-5">
              <Header
                kicker="Interests"
                title="What sounds fun?"
                body="Pick at least two. These are structured tags matching will use — not a personality test."
              />
              {INTEREST_CATEGORIES.map((cat) => {
                const items = identity.interests.filter((i) => i.category === cat);
                if (!items.length) return null;
                return (
                  <div key={cat}>
                    <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                      {cat}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {items.map((i) => (
                        <Chip
                          key={i.id}
                          label={i.name}
                          selected={interestIds.includes(i.id)}
                          onClick={() => toggleInterest(i.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : null}

          {step === 3 ? (
            <motion.div key="avail" {...pane} className="space-y-5">
              <Header
                kicker="Schedule"
                title="When are you free?"
                body="Broad windows only. Matching uses overlap for the whole group."
              />
              <div className="space-y-3">
                {WEEKDAYS.map((day) => (
                  <div key={day.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <p className="w-28 text-sm font-medium text-slate-600">{day.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABILITY_WINDOWS.map((win) => {
                        const selected = slots.some(
                          (s) => s.weekday === day.id && s.time_window === win.id
                        );
                        return (
                          <Chip
                            key={win.id}
                            label={win.label}
                            selected={selected}
                            onClick={() => toggleSlot(day.id, win.id)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : null}

          {step === 4 ? (
            <motion.div key="rules" {...pane} className="space-y-5">
              <Header
                kicker="Community"
                title={CODE_OF_CONDUCT.title}
                body={CODE_OF_CONDUCT.intro}
              />
              <ul className="space-y-3">
                {CODE_OF_CONDUCT.items.map((item) => (
                  <li key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.body}</p>
                  </li>
                ))}
              </ul>
              <label className="flex items-start gap-3 rounded-2xl bg-[var(--brand-soft)] p-4 text-sm text-[var(--brand-ink)]">
                <input
                  type="checkbox"
                  className="mt-1 accent-[var(--brand)]"
                  checked={agreed || trust.acknowledged}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span>I understand these rules and will follow them in Circle.</span>
              </label>
            </motion.div>
          ) : null}

          {step === 5 ? (
            <motion.div key="vibe" {...pane} className="space-y-6">
              <Header
                kicker="Optional vibe check"
                title="Help Circle click with your plans"
                body="Help Circle understand what kinds of people and plans you might click with. Skip anytime — this is playful, not a diagnosis."
              />
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Vibe sketch
                </p>
                <div className="mt-3 flex gap-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded-full ${i < answered ? "bg-[var(--brand)]" : "bg-slate-200"}`}
                    />
                  ))}
                </div>
              </div>
              <Question title="Social energy">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex justify-between text-xs font-medium text-slate-500">
                    <span>Quieter</span>
                    <span>More outgoing</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={vibe.social_energy}
                    onChange={(e) =>
                      setVibe((d) => ({ ...d, social_energy: Number(e.target.value) }))
                    }
                    className="w-full accent-[var(--brand)]"
                  />
                </div>
              </Question>
              <Question title="Spontaneous vs planned">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex justify-between text-xs font-medium text-slate-500">
                    <span>Plan it</span>
                    <span>Wing it</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={vibe.spontaneous_vs_planned}
                    onChange={(e) =>
                      setVibe((d) => ({
                        ...d,
                        spontaneous_vs_planned: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-[var(--brand)]"
                  />
                </div>
              </Question>
              <Question title="Sleep schedule">
                <div className="flex flex-wrap gap-2">
                  {VIBE_SLEEP.map((o) => (
                    <Chip
                      key={o}
                      label={o}
                      selected={vibe.sleep_schedule === o}
                      onClick={() => setVibe((d) => ({ ...d, sleep_schedule: o }))}
                    />
                  ))}
                </div>
              </Question>
              <Question title="Preferred group size">
                <div className="flex flex-wrap gap-2">
                  {VIBE_GROUP_SIZE.map((o) => (
                    <Chip
                      key={o}
                      label={o}
                      selected={vibe.group_size === o}
                      onClick={() => setVibe((d) => ({ ...d, group_size: o }))}
                    />
                  ))}
                </div>
              </Question>
              <Question title="When plans need to happen">
                <div className="flex flex-wrap gap-2">
                  {VIBE_PLANNING.map((o) => (
                    <Chip
                      key={o}
                      label={o}
                      selected={vibe.planning_style === o}
                      onClick={() => setVibe((d) => ({ ...d, planning_style: o }))}
                    />
                  ))}
                </div>
              </Question>
              <Question title="Weekend style">
                <div className="flex flex-wrap gap-2">
                  {VIBE_WEEKEND.map((o) => (
                    <Chip
                      key={o}
                      label={o}
                      selected={vibe.weekend_style === o}
                      onClick={() => setVibe((d) => ({ ...d, weekend_style: o }))}
                    />
                  ))}
                </div>
              </Question>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {error ? <p className="mt-4 text-sm text-orange-700">{error}</p> : null}

      <div className="sticky bottom-0 mt-8 space-y-2 border-t border-[var(--line)] bg-[var(--bg)]/95 py-4">
        {step === 5 ? (
          <Button
            fullWidth
            variant="secondary"
            disabled={saving}
            onClick={() => void finish(false)}
          >
            Skip vibe check
          </Button>
        ) : null}
        <Button fullWidth size="lg" disabled={!canContinue || saving} onClick={() => void next()}>
          {step === 5 ? "Finish and go home" : "Continue"}
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </main>
  );
}

const pane = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.25 },
};

function Header({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-ink)]">{kicker}</p>
      <h1 className="font-display mt-1 text-3xl font-bold sm:text-4xl">{title}</h1>
      <p className="mt-2 text-slate-500">{body}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function Question({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}
