"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDemo } from "@/context/DemoContext";
import { MATCHING_MESSAGES } from "@/lib/constants";

export default function MatchingPage() {
  const router = useRouter();
  const { ready, user, runMatching, setPhase, state } = useDemo();
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/onboarding");
      return;
    }
    // Already have a circle from a previous run — skip rematch
    if (state.circle && state.phase === "reveal") {
      router.replace("/circle");
      return;
    }
    if (state.circle && state.phase === "home") {
      router.replace("/home");
      return;
    }
    setPhase("matching");
  }, [ready, user, router, setPhase, state.circle, state.phase]);

  useEffect(() => {
    if (!ready || !user || started.current) return;
    if (state.circle) return;
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
  }, [ready, user, runMatching, router, state.circle]);

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
            className="absolute left-1/2 top-1/2 h-4 w-4 -ml-2 -mt-2 rounded-full bg-teal-500"
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
        <div className="absolute inset-0 m-auto h-14 w-14 rounded-full bg-teal-600 shadow-lg shadow-teal-600/30" />
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
        {done ? "Almost there..." : "Optimizing for group chemistry"}
      </p>

      <div className="mt-8 flex gap-2">
        {MATCHING_MESSAGES.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-8 rounded-full transition-colors ${
              i <= index ? "bg-teal-600" : "bg-slate-200"
            }`}
          />
        ))}
      </div>
    </main>
  );
}
