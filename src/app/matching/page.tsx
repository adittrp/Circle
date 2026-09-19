"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDemo } from "@/context/DemoContext";
import { useIdentity } from "@/context/IdentityContext";
import { useRealCircle } from "@/context/RealCircleContext";
import { MATCHING_MESSAGES } from "@/lib/constants";

export default function MatchingPage() {
  const router = useRouter();
  const identity = useIdentity();
  const real = useRealCircle();
  const { ready, user, runMatching, setPhase, startOnboarding, state } = useDemo();
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const isReal =
    identity.configured && Boolean(identity.profile?.onboarding_completed_at);

  useEffect(() => {
    if (!ready || !identity.ready) return;

    if (isReal) {
      if (real.circle) {
        router.replace("/circle");
      }
      return;
    }

    if (!user) {
      startOnboarding();
      return;
    }
    if (state.circle && state.phase === "reveal") {
      router.replace("/circle");
      return;
    }
    if (state.circle && state.phase === "home") {
      router.replace("/home");
      return;
    }
    setPhase("matching");
  }, [
    ready,
    identity.ready,
    isReal,
    real.circle,
    user,
    router,
    setPhase,
    startOnboarding,
    state.circle,
    state.phase,
  ]);

  useEffect(() => {
    if (!ready || !identity.ready || started.current) return;

    if (isReal) {
      if (!real.ready) return;
      if (real.circle) return;
      started.current = true;

      let cancelled = false;
      const run = async () => {
        const { error: matchError } = await real.findCircle();
        if (cancelled) return;
        if (matchError) {
          setError(matchError);
          return;
        }
        setDone(true);
      };
      void run();

      const timers = MATCHING_MESSAGES.map((_, i) =>
        window.setTimeout(() => {
          if (!cancelled) setIndex(i);
        }, i * 750)
      );
      const finish = window.setTimeout(() => {
        if (!cancelled && !error) router.push("/circle");
      }, 4200);

      return () => {
        cancelled = true;
        timers.forEach(clearTimeout);
        clearTimeout(finish);
      };
    }

    if (!user || state.circle) return;
    started.current = true;

    let cancelled = false;
    const run = async () => {
      await runMatching();
      if (!cancelled) setDone(true);
    };
    void run();

    const timers = MATCHING_MESSAGES.map((_, i) =>
      window.setTimeout(() => {
        if (!cancelled) setIndex(i);
      }, i * 750)
    );
    const finish = window.setTimeout(() => {
      if (!cancelled) router.push("/circle");
    }, 4200);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      clearTimeout(finish);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- real.findCircle is stable enough; full `real` rematches forever
  }, [
    ready,
    identity.ready,
    isReal,
    real.ready,
    real.circle,
    real.findCircle,
    user,
    runMatching,
    router,
    state.circle,
    error,
  ]);

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Couldn&apos;t build your Circle yet
        </h1>
        <p className="mt-3 text-slate-500">{error}</p>
        <button
          type="button"
          className="mt-6 text-sm font-semibold text-[var(--brand-ink)]"
          onClick={() => router.push("/people")}
        >
          Discover people on campus
        </button>
        <button
          type="button"
          className="mt-3 text-sm text-slate-500"
          onClick={() => router.push("/home")}
        >
          Back home
        </button>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <motion.div
        className="relative mb-10 h-28 w-28"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 -ml-2 -mt-2 h-4 w-4 rounded-full bg-[var(--brand)]"
            animate={{
              x: Math.cos((i / 5) * Math.PI * 2) * 42,
              y: Math.sin((i / 5) * Math.PI * 2) * 42,
              scale: [1, 1.25, 1],
            }}
            transition={{
              scale: { repeat: Infinity, duration: 1.4, delay: i * 0.12 },
            }}
          />
        ))}
        <div className="absolute inset-0 m-auto h-14 w-14 rounded-full bg-[var(--brand)] shadow-lg shadow-none" />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.h1
          key={MATCHING_MESSAGES[index]}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="font-display text-2xl font-bold text-slate-900 sm:text-3xl"
        >
          {MATCHING_MESSAGES[index]}
        </motion.h1>
      </AnimatePresence>

      <p className="mt-3 text-slate-500">
        {done ? "Almost there…" : "Looking at schedules and shared interests"}
      </p>

      <div className="mt-8 flex gap-2">
        {MATCHING_MESSAGES.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-8 rounded-full transition-colors ${
              i <= index ? "bg-[var(--brand)]" : "bg-slate-200"
            }`}
          />
        ))}
      </div>
    </main>
  );
}
