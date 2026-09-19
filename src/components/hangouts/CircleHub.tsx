"use client";

import { CalendarPlus, Copy, MessageCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { CircleChat } from "@/components/hangouts/CircleChat";
import { CreatePlanModal } from "@/components/hangouts/CreatePlanModal";
import { FeedbackModal } from "@/components/hangouts/FeedbackModal";
import { MomentumCard } from "@/components/hangouts/MomentumCard";
import { PlanCard } from "@/components/hangouts/PlanCard";
import { WantSomething } from "@/components/hangouts/WantSomething";
import { useCircleHub } from "@/lib/hangouts/useCircleHub";

export function CircleHub({ circleId }: { circleId: string }) {
  const router = useRouter();
  const hub = useCircleHub(circleId);
  const [wantOpen, setWantOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const pending = hub.bundle?.activities.find((a) => a.id === hub.pendingFeedbackId) ?? null;

  const ruleChips = useMemo(() => {
    const rules = hub.bundle?.rules;
    if (!rules) return [];
    const chips: string[] = [];
    if (rules.public_campus_only) chips.push("Public campus meetups");
    if (rules.no_drinking) chips.push("No drinking");
    if (rules.no_smoking) chips.push("No smoking");
    if (rules.no_parties) chips.push("No parties");
    if (rules.study_focused) chips.push("Study-focused");
    if (rules.low_cost) chips.push("Low-cost");
    if (rules.early_evening) chips.push("Early evenings");
    if (rules.notes) chips.push(rules.notes);
    return chips;
  }, [hub.bundle?.rules]);

  if (hub.loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-500">
        Loading your Circle...
      </main>
    );
  }

  if (hub.error || !hub.bundle || !hub.momentum) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <AppHeader />
        <section className="card-surface p-6">
          <h1 className="font-display text-2xl font-bold">This Circle isn&apos;t available</h1>
          <p className="mt-2 text-slate-600">
            {hub.error ?? "You need to be a member to see plans and chat."}
          </p>
        </section>
      </main>
    );
  }

  const invite =
    typeof window !== "undefined" ? `${window.location.origin}/circles/join/${circleId}` : "";

  return (
    <main className="mx-auto max-w-5xl px-5 py-6 pb-28 sm:px-8">
      <AppHeader />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]">
            {hub.bundle.universityName}
          </p>
          <h1 className="font-display text-3xl font-bold text-slate-900">Your Circle</h1>
          <p className="mt-1 text-slate-500">
            Match happened. This is how you actually become a group.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void navigator.clipboard.writeText(invite);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            }}
          >
            <Copy className="h-4 w-4" />
            {copied ? "Copied" : "Invite link"}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setPlanOpen(true)}>
            <CalendarPlus className="h-4 w-4" />
            Create plan
          </Button>
        </div>
      </div>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Members</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {hub.bundle.members.map((member) => (
            <div key={member.id} className="card-surface min-w-[140px] p-3 text-center">
              <Avatar src={member.avatarUrl ?? ""} name={member.firstName} size="md" ring={member.isYou} />
              <p className="mt-2 text-sm font-semibold">
                {member.firstName}
                {member.isYou ? <span className="text-[var(--brand-ink)]"> (you)</span> : null}
              </p>
              <p className="text-xs text-slate-500">
                {[member.year, member.major].filter(Boolean).join(" · ") || "Student"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {hub.firstMission && !hub.backOff ? (
        <div className="mb-6">
          <PlanCard
            activity={hub.firstMission}
            memberCount={hub.bundle.members.length}
            profileId={hub.profileId}
            emphasize
            onRsvp={(status) => void hub.rsvp(hub.firstMission!.id, status)}
            onComplete={() => void hub.complete(hub.firstMission!.id)}
          />
        </div>
      ) : null}

      {hub.nextPlan && hub.nextPlan.id !== hub.firstMission?.id ? (
        <div className="mb-6">
          <PlanCard
            activity={hub.nextPlan}
            memberCount={hub.bundle.members.length}
            profileId={hub.profileId}
            onRsvp={(status) => void hub.rsvp(hub.nextPlan!.id, status)}
            onComplete={() => void hub.complete(hub.nextPlan!.id)}
          />
        </div>
      ) : null}

      <section className="card-surface mb-6 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Best times for your Circle
        </h2>
        {hub.overlap.length === 0 ? (
          <p className="text-sm text-slate-500">
            Add availability on your profile so Circle can find a shared window.
          </p>
        ) : (
          <ul className="space-y-2">
            {hub.overlap.slice(0, 5).map((slot) => (
              <li
                key={`${slot.weekday}-${slot.time_window}`}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm"
              >
                <span>{slot.label}</span>
                <span className="font-medium text-[var(--brand-ink)]">
                  {slot.count}/{slot.total} free
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mb-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <MomentumCard momentum={hub.momentum} />
          {hub.sharedInterests.length ? (
            <section className="card-surface p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Shared interests
              </h2>
              <div className="flex flex-wrap gap-2">
                {hub.sharedInterests.map((item) => (
                  <Chip key={item.name} label={`${item.name} · ${item.count}`} selected />
                ))}
              </div>
            </section>
          ) : null}
          {ruleChips.length ? (
            <section className="card-surface p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Circle rules
              </h2>
              <div className="flex flex-wrap gap-2">
                {ruleChips.map((chip) => (
                  <Chip key={chip} label={chip} />
                ))}
              </div>
            </section>
          ) : null}
          {hub.upcoming.filter((a) => a.id !== hub.nextPlan?.id && a.id !== hub.firstMission?.id).length ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Upcoming plans
              </h2>
              {hub.upcoming
                .filter((a) => a.id !== hub.nextPlan?.id && a.id !== hub.firstMission?.id)
                .map((activity) => (
                  <PlanCard
                    key={activity.id}
                    activity={activity}
                    memberCount={hub.bundle!.members.length}
                    profileId={hub.profileId}
                    onRsvp={(status) => void hub.rsvp(activity.id, status)}
                    onComplete={() => void hub.complete(activity.id)}
                  />
                ))}
            </section>
          ) : null}
          {hub.past.length ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Recent plans
              </h2>
              {hub.past.slice(0, 5).map((activity) => (
                <PlanCard
                  key={activity.id}
                  activity={activity}
                  memberCount={hub.bundle!.members.length}
                  profileId={hub.profileId}
                  onRsvp={() => undefined}
                />
              ))}
            </section>
          ) : null}
        </div>
        <CircleChat
          members={hub.bundle.members}
          messages={hub.messages}
          reactions={hub.reactions}
          profileId={hub.profileId}
          emphasized={hub.backOff}
          onSend={hub.send}
          onReact={hub.react}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={() => void hub.leave().then(() => {
          router.push("/circles");
        })}>
          Leave Circle
        </Button>
      </div>

      {!hub.backOff ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 p-4 backdrop-blur">
          <div className="mx-auto flex max-w-5xl gap-2">
            <Button fullWidth size="lg" variant="coral" onClick={() => setWantOpen(true)}>
              <Plus className="h-5 w-5" />
              I want to do something
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-8 flex items-center gap-2 text-sm text-slate-500">
          <MessageCircle className="h-4 w-4" />
          You&apos;ve got this — Circle will stay out of the way unless you want a plan.
        </p>
      )}

      <WantSomething
        open={wantOpen}
        onClose={() => setWantOpen(false)}
        onSuggest={(mood) => hub.suggest(mood, true)}
        onStart={(suggestion) => hub.startSuggested(suggestion, true)}
      />
      <CreatePlanModal
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        locations={hub.bundle.locations}
        onCreate={hub.createPlan}
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
