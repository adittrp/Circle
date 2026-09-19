"use client";

import { motion } from "framer-motion";
import { ArrowRight, CalendarHeart, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/Button";
import { useIdentity } from "@/context/IdentityContext";

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
  const { ready, configured, user, profile } = useIdentity();
  const onboarded = Boolean(profile?.onboarding_completed_at);

  return (
    <main className="relative overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 pb-16 pt-6 sm:px-8">
        <header className="flex items-center justify-between">
          <Wordmark />
          {ready && configured && user ? (
            <Link href={onboarded ? "/home" : "/onboarding"} className="text-sm font-medium text-slate-600">
              Continue
            </Link>
          ) : (
            <Link href="/signin" className="text-sm font-medium text-slate-600">
              Sign in
            </Link>
          )}
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
              <Link href="/signup">
                <Button size="lg">
                  Find My Circle
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <p className="text-sm text-slate-500 sm:ml-2">School email required · .edu</p>
            </div>
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
