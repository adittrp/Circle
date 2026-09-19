"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ProgressBar, StepDots } from "@/components/ui/Progress";
import { useDemo } from "@/context/DemoContext";
import {
  AVAILABILITY_SLOTS,
  DORMS,
  INTERESTS,
  LOOKING_FOR_OPTIONS,
  MAJORS,
  UNIVERSITY,
  YEARS,
} from "@/lib/constants";
import type {
  AvailabilitySlot,
  FoodText,
  FridayNight,
  IdealGroupSize,
  Interest,
  LookingFor,
  PlanningStyle,
  SleepSchedule,
  Year,
} from "@/lib/types";

const FRIDAY: FridayNight[] = [
  "Going out",
  "Movie or games",
  "Random adventure",
  "Probably studying",
  "Depends who's asking",
];

const FOOD: FoodText[] = [
  "Already putting my shoes on",
  "Where?",
  "Maybe",
  "Absolutely not",
];

const GROUP_SIZE: IdealGroupSize[] = ["2–3", "4–5", "6–8", "The more the better"];

const PLANNING: PlanningStyle[] = [
  "I'm making the plan",
  "I'll suggest something",
  "I'll show up",
  "Please just tell me where to be",
];

const SLEEP: SleepSchedule[] = [
  "Early bird",
  "Normal",
  "Night owl",
  "Sleep schedule? Never heard of it",
];

export default function OnboardingPage() {
  const router = useRouter();
  const {
    user,
    startOnboarding,
    updateProfile,
    updateVibe,
    updateAvailability,
    setPhase,
  } = useDemo();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) startOnboarding();
  }, [user, startOnboarding]);

  const profile = user?.profile;
  const vibe = user?.vibe;
  const availability = user?.availability ?? [];

  const step1Valid =
    !!profile?.year &&
    !!profile?.major &&
    !!profile?.dorm &&
    !!profile?.hometown.trim();

  const step2Valid =
    !!vibe?.fridayNight &&
    !!vibe?.foodText &&
    !!vibe?.idealGroupSize &&
    !!vibe?.planningStyle &&
    vibe.interests.length >= 2 &&
    !!vibe?.sleepSchedule &&
    vibe.lookingFor.length >= 1;

  const step3Valid = availability.length >= 2;

  const canContinue =
    step === 0 ? step1Valid : step === 1 ? step2Valid : step3Valid;

  const toggleInterest = (interest: Interest) => {
    if (!vibe) return;
    const has = vibe.interests.includes(interest);
    updateVibe({
      interests: has
        ? vibe.interests.filter((i) => i !== interest)
        : [...vibe.interests, interest],
    });
  };

  const toggleLooking = (item: LookingFor) => {
    if (!vibe) return;
    const has = vibe.lookingFor.includes(item);
    updateVibe({
      lookingFor: has
        ? vibe.lookingFor.filter((i) => i !== item)
        : [...vibe.lookingFor, item],
    });
  };

  const toggleSlot = (slot: AvailabilitySlot) => {
    const has = availability.includes(slot);
    updateAvailability(
      has ? availability.filter((s) => s !== slot) : [...availability, slot]
    );
  };

  const next = () => {
    if (step < 2) {
      setStep((s) => s + 1);
      return;
    }
    setPhase("matching");
    router.push("/matching");
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
        <StepDots step={step} total={3} />
      </div>

      <ProgressBar value={((step + 1) / 3) * 100} />

      <div className="mt-8 flex-1">
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
                  Step 1
                </p>
                <h1 className="font-display mt-1 text-3xl font-bold sm:text-4xl">
                  College profile
                </h1>
                <p className="mt-2 text-slate-500">
                  Just the basics so we can place you near the right people.
                </p>
              </div>

              <Field label="University">
                <select
                  className={fieldClass}
                  value={profile?.university ?? UNIVERSITY}
                  onChange={(e) => updateProfile({ university: e.target.value })}
                >
                  <option>{UNIVERSITY}</option>
                </select>
              </Field>

              <Field label="Your first name">
                <input
                  className={fieldClass}
                  value={profile?.firstName ?? "Alex"}
                  onChange={(e) => updateProfile({ firstName: e.target.value })}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Year">
                  <select
                    className={fieldClass}
                    value={profile?.year ?? ""}
                    onChange={(e) =>
                      updateProfile({ year: e.target.value as Year | "" })
                    }
                  >
                    <option value="">Select year</option>
                    {YEARS.map((y) => (
                      <option key={y}>{y}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Major">
                  <select
                    className={fieldClass}
                    value={profile?.major ?? ""}
                    onChange={(e) => updateProfile({ major: e.target.value })}
                  >
                    <option value="">Select major</option>
                    {MAJORS.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Dorm / residence">
                <select
                  className={fieldClass}
                  value={profile?.dorm ?? ""}
                  onChange={(e) => updateProfile({ dorm: e.target.value })}
                >
                  <option value="">Select dorm</option>
                  {DORMS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </Field>

              <Field label="Hometown">
                <input
                  className={fieldClass}
                  placeholder="e.g. Houston, TX"
                  value={profile?.hometown ?? ""}
                  onChange={(e) => updateProfile({ hometown: e.target.value })}
                />
              </Field>
            </motion.div>
          ) : null}

          {step === 1 ? (
            <motion.div
              key="vibe"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              className="space-y-7"
            >
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
                  Step 2
                </p>
                <h1 className="font-display mt-1 text-3xl font-bold sm:text-4xl">
                  Vibe check
                </h1>
                <p className="mt-2 text-slate-500">
                  Fast, honest answers. No wrong ones.
                </p>
              </div>

              <Question title="Friday night?">
                <div className="flex flex-wrap gap-2">
                  {FRIDAY.map((o) => (
                    <Chip
                      key={o}
                      label={o}
                      selected={vibe?.fridayNight === o}
                      onClick={() => updateVibe({ fridayNight: o })}
                    />
                  ))}
                </div>
              </Question>

              <Question title={`It's 11 PM and someone texts "food?"`}>
                <div className="flex flex-wrap gap-2">
                  {FOOD.map((o) => (
                    <Chip
                      key={o}
                      label={o}
                      selected={vibe?.foodText === o}
                      onClick={() => updateVibe({ foodText: o })}
                    />
                  ))}
                </div>
              </Question>

              <Question title="Ideal friend group size?">
                <div className="flex flex-wrap gap-2">
                  {GROUP_SIZE.map((o) => (
                    <Chip
                      key={o}
                      label={o}
                      selected={vibe?.idealGroupSize === o}
                      onClick={() => updateVibe({ idealGroupSize: o })}
                    />
                  ))}
                </div>
              </Question>

              <Question title="Your social battery">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex justify-between text-xs font-medium text-slate-500">
                    <span>Introvert</span>
                    <span>Extrovert</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={vibe?.socialEnergy ?? 55}
                    onChange={(e) =>
                      updateVibe({ socialEnergy: Number(e.target.value) })
                    }
                    className="w-full accent-teal-600"
                  />
                </div>
              </Question>

              <Question title="When plans need to happen...">
                <div className="flex flex-wrap gap-2">
                  {PLANNING.map((o) => (
                    <Chip
                      key={o}
                      label={o}
                      selected={vibe?.planningStyle === o}
                      onClick={() => updateVibe({ planningStyle: o })}
                    />
                  ))}
                </div>
              </Question>

              <Question title="What sounds fun? (pick a few)">
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((o) => (
                    <Chip
                      key={o}
                      label={o}
                      selected={vibe?.interests.includes(o)}
                      onClick={() => toggleInterest(o)}
                    />
                  ))}
                </div>
              </Question>

              <Question title="Your sleep schedule?">
                <div className="flex flex-wrap gap-2">
                  {SLEEP.map((o) => (
                    <Chip
                      key={o}
                      label={o}
                      selected={vibe?.sleepSchedule === o}
                      onClick={() => updateVibe({ sleepSchedule: o })}
                    />
                  ))}
                </div>
              </Question>

              <Question title="What are you looking for?">
                <div className="flex flex-wrap gap-2">
                  {LOOKING_FOR_OPTIONS.map((o) => (
                    <Chip
                      key={o}
                      label={o}
                      selected={vibe?.lookingFor.includes(o)}
                      onClick={() => toggleLooking(o)}
                    />
                  ))}
                </div>
              </Question>
            </motion.div>
          ) : null}

          {step === 2 ? (
            <motion.div
              key="availability"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
                  Step 3
                </p>
                <h1 className="font-display mt-1 text-3xl font-bold sm:text-4xl">
                  When are you free?
                </h1>
                <p className="mt-2 text-slate-500">
                  Pick broad windows. We&apos;ll find overlap for the whole group.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {AVAILABILITY_SLOTS.map((slot) => {
                  const selected = availability.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleSlot(slot)}
                      className={`rounded-2xl border px-4 py-4 text-left font-medium transition ${
                        selected
                          ? "border-teal-500 bg-teal-50 text-teal-900"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="sticky bottom-0 mt-8 border-t border-slate-100 bg-[#f4f7fb]/90 py-4 backdrop-blur">
        <Button fullWidth size="lg" disabled={!canContinue} onClick={next}>
          {step === 2 ? "Find my Circle" : "Continue"}
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </main>
  );
}

const fieldClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100";

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function Question({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}
