"use client";

import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/Button";
import { useIdentity } from "@/context/IdentityContext";

const steps = [
  {
    n: "1",
    title: "Share your vibe",
    body: "A few questions about interests, schedule, and how you like to hang out.",
  },
  {
    n: "2",
    title: "Meet your Circle",
    body: "We place you with a small group of students who actually overlap with you.",
  },
  {
    n: "3",
    title: "Do something together",
    body: "Pick a plan, RSVP, show up — then do it again.",
  },
];

export default function LandingPage() {
  const { ready, configured, user, profile } = useIdentity();
  const onboarded = Boolean(profile?.onboarding_completed_at);

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 pb-16 pt-6 sm:px-8">
        <header className="flex items-center justify-between">
          <Wordmark size="md" />
          {ready && configured && user ? (
            <Link
              href={onboarded ? "/home" : "/onboarding"}
              className="text-label text-[var(--ink-secondary)] hover:text-[var(--ink)]"
            >
              Continue
            </Link>
          ) : (
            <Link
              href="/signin"
              className="text-label text-[var(--ink-secondary)] hover:text-[var(--ink)]"
            >
              Sign in
            </Link>
          )}
        </header>

        <section className="flex flex-1 flex-col justify-center py-14 sm:py-20">
          <h1 className="text-display max-w-2xl">
            College has thousands of people.
            <span className="mt-2 block text-[var(--brand-ink)]">
              You only need a few.
            </span>
          </h1>
          <p className="text-body-secondary mt-5 max-w-md text-[var(--text-body-lg)]">
            Circle introduces you to a small group of classmates and helps turn
            that introduction into actual plans.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/signup">
              <Button size="lg">Find My Circle</Button>
            </Link>
            <p className="text-caption sm:ml-1">School email required · .edu</p>
          </div>
        </section>

        <ol className="grid gap-8 border-t border-[var(--line)] pt-10 sm:grid-cols-3 sm:gap-6">
          {steps.map((step) => (
            <li key={step.n}>
              <p className="text-caption font-semibold text-[var(--brand-ink)]">
                {step.n}
              </p>
              <h2 className="text-section mt-2 text-[1.05rem]">{step.title}</h2>
              <p className="text-body-secondary mt-1.5 text-[0.9375rem]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <p className="mt-14 max-w-md font-display text-xl font-semibold leading-snug text-[var(--ink-secondary)] sm:text-2xl">
          The goal isn&apos;t more matches. It&apos;s fewer strangers.
        </p>
      </div>
    </main>
  );
}
