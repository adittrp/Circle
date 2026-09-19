"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import { FeedbackModal } from "@/components/hangouts/FeedbackModal";
import { MomentumCard } from "@/components/hangouts/MomentumCard";
import { PlanCard } from "@/components/hangouts/PlanCard";
import { WantSomething } from "@/components/hangouts/WantSomething";
import { useIdentity } from "@/context/IdentityContext";
import { createHangoutCircle, listMyCircles } from "@/lib/hangouts/queries";
import { useCircleHub } from "@/lib/hangouts/useCircleHub";
import { createClient } from "@/lib/supabase/client";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function HangoutsHome() {
  const identity = useIdentity();
  const [circleId, setCircleId] = useState<string | null | undefined>(undefined);
  const [wantOpen, setWantOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const hub = useCircleHub(circleId ?? null);
  const pending = hub.bundle?.activities.find((a) => a.id === hub.pendingFeedbackId) ?? null;
  const firstName = identity.profile?.first_name || "there";

  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!identity.profile) return;
    void listMyCircles(createClient(), identity.profile.id)
      .then((circles) => setCircleId(circles[0]?.id ?? null))
      .catch(() => setCircleId(null));
  }, [identity.profile]);

  const start = async () => {
    if (!identity.profile?.university_id) return;
    setCreating(true);
    setCreateError(null);
    try {
      const circle = await createHangoutCircle(
        createClient(),
        identity.profile.university_id,
        identity.profile.id
      );
      setCircleId(circle.id);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Could not start a Circle");
    } finally {
      setCreating(false);
    }
  };

  if (circleId === undefined || (circleId && hub.loading)) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-500">
        Loading your Circle...
      </main>
    );
  }

  if (!circleId || !hub.bundle || !hub.momentum) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
        <AppHeader />
        <p className="text-sm text-slate-500">{greeting()},</p>
        <h1 className="font-display text-3xl font-bold text-slate-900">{firstName}.</h1>
        <section className="card-surface mt-8 p-6">
          <h2 className="font-display text-xl font-bold">Your Circle</h2>
          <p className="mt-2 text-slate-600">
            Matching (Path 2) will place you with a small group. You can also start a hangout Circle now and invite classmates.
          </p>
          {createError ? <p className="mt-3 text-sm text-orange-700">{createError}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => void start()} disabled={creating}>
              Start a hangout Circle
            </Button>
            <Link href="/circles" className="text-sm font-medium text-[var(--brand-ink)] self-center">
              View Circles
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const plan = hub.nextPlan ?? hub.firstMission;

  return (
    <main className="mx-auto max-w-3xl px-5 py-6 pb-28 sm:px-8">
      <AppHeader />
      <p className="text-sm text-slate-500">{greeting()},</p>
      <h1 className="font-display text-3xl font-bold text-slate-900">{firstName}.</h1>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Your Circle</h2>
          <Link href={`/circles/${hub.bundle.circle.id}`} className="text-sm font-medium text-[var(--brand-ink)]">
            Open hub
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {hub.bundle.members.map((member) => (
            <div key={member.id} className="card-surface min-w-[140px] p-3 text-center">
              <p className="text-sm font-semibold">
                {member.firstName}
                {member.isYou ? " (you)" : ""}
              </p>
              <p className="text-xs text-slate-500">{member.major || member.year || "Student"}</p>
            </div>
          ))}
        </div>
      </section>

      {plan ? (
        <div className="mt-6">
          <PlanCard
            activity={plan}
            memberCount={hub.bundle.members.length}
            profileId={hub.profileId}
            onRsvp={(status) => void hub.rsvp(plan.id, status)}
            onComplete={() => void hub.complete(plan.id)}
          />
        </div>
      ) : null}

      <div className="mt-6">
        <MomentumCard momentum={hub.momentum} />
      </div>

      {!hub.backOff ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 p-4 backdrop-blur">
          <div className="mx-auto max-w-3xl">
            <Button fullWidth size="lg" variant="coral" onClick={() => setWantOpen(true)}>
              <Plus className="h-5 w-5" />
              I want to do something
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-slate-500">
          Your group is already hanging out. Open the hub if you want chat or another plan.
        </p>
      )}

      <WantSomething
        open={wantOpen}
        onClose={() => setWantOpen(false)}
        onSuggest={(mood) => hub.suggest(mood, true)}
        onStart={(suggestion) => hub.startSuggested(suggestion, true)}
      />
      <FeedbackModal
        activity={pending}
        onClose={hub.dismissFeedback}
        onSubmit={(emoji, hangAgain) => {
          if (pending) void hub.feedback(pending.id, emoji, hangAgain);
        }}
      />
    </main>
  );
}
