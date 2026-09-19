"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Users, CalendarHeart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useDemo } from "@/context/DemoContext";

const steps = [
  {
    icon: Sparkles,
    title: "Tell us your vibe",
    body: "Answer a few questions about how you actually spend your time.",
  },
  {
    icon: Users,
    title: "Meet your Circle",
    body: "We build a small group around compatibility, schedules, proximity, and group chemistry.",
  },
  {
    icon: CalendarHeart,
    title: "Actually meet",
    body: "Circle finds things you can do together and helps turn “we should hang out sometime” into actual plans.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { ready, state, startOnboarding, resetDemo } = useDemo();

  useEffect(() => {
    if (!ready) return;
    if (state.phase === "home" && state.circle) router.replace("/home");
    if (state.phase === "reveal" && state.circle) router.replace("/circle");
  }, [ready, state.phase, state.circle, router]);

  const handleStart = () => {
    startOnboarding();
  };

  return (
    <main className="relative overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 pb-16 pt-6 sm:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-white font-display font-bold">
              C
            </div>
            <span className="font-display text-xl font-bold tracking-tight">
              Circle
            </span>
          </div>
          {ready && state.phase !== "landing" ? (
            <button
              type="button"
              onClick={() => {
                resetDemo();
                router.push("/");
              }}
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              Reset demo
            </button>
          ) : null}
        </header>

        <section className="flex flex-1 flex-col justify-center py-12 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-3xl"
          >
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              For college students
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] text-slate-900 sm:text-6xl lg:text-7xl">
              College has thousands of people.
              <span className="block text-teal-700">You only need a few.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-600 sm:text-xl">
              Circle introduces you to a small group of students and helps turn
              introductions into actual friendships.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/onboarding" onClick={handleStart}>
                <Button size="lg">
                  Find My Circle
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <p className="text-sm text-slate-500 sm:ml-2">
                Demo mode · no account required
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-14 grid gap-3 sm:grid-cols-5"
          >
            {["Alex", "Maya", "Jordan", "Sam", "Quinn"].map((name, i) => (
              <div
                key={name}
                className="card-surface flex items-center gap-3 p-3"
                style={{ transform: `translateY(${i % 2 === 0 ? 0 : 10}px)` }}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, hsl(${160 + i * 28}, 65%, 45%), hsl(${190 + i * 20}, 70%, 55%))`,
                  }}
                >
                  {name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs text-slate-500">Your Circle</p>
                </div>
              </div>
            ))}
          </motion.div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card-surface p-6"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                <step.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-teal-700">
                {i + 1}. {step.title}
              </p>
              <p className="mt-2 text-slate-600">{step.body}</p>
            </motion.div>
          ))}
        </section>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-14 text-center font-display text-2xl font-bold text-slate-800 sm:text-3xl"
        >
          The goal isn&apos;t more matches. It&apos;s fewer strangers.
        </motion.p>
      </div>
    </main>
  );
}
