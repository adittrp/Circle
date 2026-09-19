"use client";

import { motion } from "framer-motion";
import { Check, MapPin, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { MemberCard } from "@/components/ui/MemberCard";
import { useDemo } from "@/context/DemoContext";
import { DEMO_USER_ID } from "@/lib/constants";

export default function CircleRevealPage() {
  const router = useRouter();
  const { ready, state, displayMembers, setRsvp, goHome } = useDemo();
  const [showMission, setShowMission] = useState(false);

  const firstMission = useMemo(
    () => state.activities.find((a) => a.mood === "First Mission"),
    [state.activities]
  );

  const confirmed = firstMission
    ? Object.values(firstMission.rsvps).filter((s) => s === "in").length
    : 0;
  const total = firstMission ? Object.keys(firstMission.rsvps).length : 5;
  const userStatus = firstMission?.rsvps[DEMO_USER_ID];

  useEffect(() => {
    if (!ready) return;
    if (!state.circle) {
      router.replace("/onboarding");
      return;
    }
    const t = window.setTimeout(() => setShowMission(true), 1600);
    return () => clearTimeout(t);
  }, [ready, state.circle, router]);

  if (!ready || !state.circle || !firstMission) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-500">
        Building your Circle...
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
          You&apos;re in
        </p>
        <h1 className="font-display mt-2 text-4xl font-extrabold text-slate-900 sm:text-5xl">
          Meet Your Circle
        </h1>
        <p className="mt-3 text-slate-500">
          Five people. One group. Plans that actually happen.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {displayMembers.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.12 + i * 0.1, type: "spring", stiffness: 260 }}
          >
            <MemberCard
              name={m.firstName}
              avatar={m.avatar}
              major={m.major}
              year={m.year}
              dorm={m.dorm}
              interests={m.interests}
              isYou={"isYou" in m && m.isYou}
            />
          </motion.div>
        ))}
      </div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card-surface mt-10 p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-teal-600" />
          <h2 className="font-display text-xl font-bold">Why this Circle?</h2>
        </div>
        <ul className="space-y-3">
          {state.circle.whyThisCircle.map((line, i) => (
            <motion.li
              key={line}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.85 + i * 0.08 }}
              className="flex items-start gap-3 text-slate-700"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                <Check className="h-3.5 w-3.5" />
              </span>
              {line}
            </motion.li>
          ))}
        </ul>
      </motion.section>

      {showMission ? (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">
            First Mission
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                {firstMission.emoji} {firstMission.title}
              </h2>
              <p className="mt-2 text-teal-100/90">
                {firstMission.dateLabel} · {firstMission.time}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-300">
                <MapPin className="h-4 w-4" />
                {firstMission.location.includes("Jester")
                  ? `5 minute walk from Jester · ${firstMission.location}`
                  : firstMission.location}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-center backdrop-blur">
              <p className="font-display text-2xl font-bold">
                {confirmed} / {total}
              </p>
              <p className="text-xs text-slate-300">confirmed</p>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-slate-300">{firstMission.reason}</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="coral"
              size="lg"
              disabled={userStatus === "in"}
              onClick={() => setRsvp(firstMission.id, "in")}
            >
              {userStatus === "in" ? "You're in ✓" : "I'm In"}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
              disabled={userStatus === "cant"}
              onClick={() => setRsvp(firstMission.id, "cant")}
            >
              Can&apos;t Make It
            </Button>
          </div>

          {userStatus ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6"
            >
              <Button
                fullWidth
                size="lg"
                onClick={() => {
                  goHome();
                  router.push("/home");
                }}
              >
                Continue to your Circle home
              </Button>
            </motion.div>
          ) : null}
        </motion.section>
      ) : null}
    </main>
  );
}
