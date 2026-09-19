"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { MemberCard } from "@/components/ui/MemberCard";
import { useDemo } from "@/context/DemoContext";
import { useIdentity } from "@/context/IdentityContext";
import { useRealCircle } from "@/context/RealCircleContext";
import { DEMO_USER_ID } from "@/lib/constants";

function fallbackAvatar(name: string) {
  const initial = (name || "C")[0].toUpperCase();
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#14b8a6"/><stop offset="100%" stop-color="#0d9488"/></linearGradient></defs><rect width="128" height="128" rx="64" fill="url(#g)"/><text x="64" y="74" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-size="42" font-weight="700">${initial}</text></svg>`
  )}`;
}

export default function CircleRevealPage() {
  const router = useRouter();
  const identity = useIdentity();
  const real = useRealCircle();
  const { ready, state, displayMembers, setRsvp, goHome } = useDemo();
  const [showNext, setShowNext] = useState(false);

  const isReal =
    identity.configured && Boolean(identity.profile?.onboarding_completed_at);

  const firstMission = useMemo(
    () => state.activities.find((a) => a.mood === "First Mission"),
    [state.activities]
  );

  useEffect(() => {
    if (!ready || !identity.ready) return;
    if (isReal) {
      if (real.ready && !real.circle) router.replace("/matching");
      return;
    }
    if (!state.circle) {
      router.replace("/matching");
      return;
    }
    const t = window.setTimeout(() => setShowNext(true), 1600);
    return () => clearTimeout(t);
  }, [ready, identity.ready, isReal, real.ready, real.circle, state.circle, router]);

  useEffect(() => {
    if (isReal && real.circle) {
      const t = window.setTimeout(() => setShowNext(true), 1400);
      return () => clearTimeout(t);
    }
  }, [isReal, real.circle]);

  if (isReal) {
    if (!real.ready || !real.circle) {
      return (
        <main className="flex min-h-screen items-center justify-center text-slate-500">
          Building your Circle...
        </main>
      );
    }

    const members = real.circle.members;
    const why = real.circle.whyTogether;

    return (
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]">
            You&apos;re in
          </p>
          <h1 className="font-display mt-2 text-4xl font-extrabold text-slate-900 sm:text-5xl">
            Meet Your Circle
          </h1>
          <p className="mt-3 text-slate-500">
            {members.length} people. One group. Plans that can actually happen.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {members.map((m, i) => (
            <motion.div
              key={m.profile_id}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.12 + i * 0.1, type: "spring", stiffness: 260 }}
            >
              <MemberCard
                name={m.first_name || "Student"}
                avatar={m.avatar_url || fallbackAvatar(m.first_name || "C")}
                major={m.major_name || "Major TBD"}
                year={m.year || ""}
                dorm={m.residence_name || "On campus"}
                interests={m.interest_names ?? []}
                isYou={m.is_you}
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
            <Sparkles className="h-5 w-5 text-[var(--brand)]" />
            <h2 className="font-display text-xl font-bold">Why we put you together</h2>
          </div>
          <ul className="space-y-3">
            {(why.length ? why : ["You share enough common ground to start hanging out."]).map(
              (line, i) => (
                <motion.li
                  key={line}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.85 + i * 0.08 }}
                  className="flex items-start gap-3 text-slate-700"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-ink)]">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {line}
                </motion.li>
              )
            )}
          </ul>
        </motion.section>

        {showNext ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Button size="lg" onClick={() => router.push("/home")}>
              Go to home
            </Button>
            <Button variant="secondary" size="lg" onClick={() => router.push("/people")}>
              Discover more people
            </Button>
          </motion.div>
        ) : null}
      </main>
    );
  }

  // Demo reveal (preserved)
  if (!ready || !state.circle || !firstMission) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-500">
        Building your Circle...
      </main>
    );
  }

  const confirmed = Object.values(firstMission.rsvps).filter((s) => s === "in").length;
  const total = Object.keys(firstMission.rsvps).length;
  const userStatus = firstMission.rsvps[DEMO_USER_ID];

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]">
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
          <Sparkles className="h-5 w-5 text-[var(--brand)]" />
          <h2 className="font-display text-xl font-bold">Why we put you together</h2>
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
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-ink)]">
                <Check className="h-3.5 w-3.5" />
              </span>
              {line}
            </motion.li>
          ))}
        </ul>
      </motion.section>

      {showNext ? (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">
            First Mission
          </p>
          <h2 className="font-display mt-3 text-3xl font-bold">
            {firstMission.emoji} {firstMission.title}
          </h2>
          <p className="mt-2 text-white/90/90">
            {firstMission.dateLabel} · {firstMission.time}
          </p>
          <p className="mt-4 max-w-2xl text-slate-300">{firstMission.reason}</p>
          <p className="mt-2 text-sm text-slate-400">
            {confirmed} / {total} confirmed
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="coral"
              size="lg"
              disabled={userStatus === "in"}
              onClick={() => setRsvp(firstMission.id, "in")}
            >
              I&apos;m in
            </Button>
            <Button size="lg" variant="secondary" onClick={() => goHome()}>
              Go to home
            </Button>
          </div>
        </motion.section>
      ) : null}
    </main>
  );
}
