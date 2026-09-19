"use client";

import { motion } from "framer-motion";
import {
  Flag,
  LogOut,
  MapPin,
  Plus,
  Settings,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { MemberCard } from "@/components/ui/MemberCard";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/Progress";
import { AppHeader } from "@/components/layout/AppHeader";
import { CircleRulesEditor } from "@/components/trust/CircleRulesEditor";
import { LeaveCircleModal, ReportModal } from "@/components/trust/SafetyModals";
import { useDemo } from "@/context/DemoContext";
import { useIdentity } from "@/context/IdentityContext";
import { useRealCircle } from "@/context/RealCircleContext";
import { useTrust } from "@/context/TrustContext";
import { computeCircleStrength, STAGE_FLOW } from "@/lib/circleStrength";
import { DEMO_USER_ID } from "@/lib/constants";
import type { Activity, ActivityMood, FeedbackEmoji, HangAgain } from "@/lib/types";

const MOODS: { mood: ActivityMood; emoji: string; label: string }[] = [
  { mood: "Food", emoji: "🍔", label: "Food" },
  { mood: "Active", emoji: "🏀", label: "Active" },
  { mood: "Chill", emoji: "🎮", label: "Chill" },
  { mood: "Study", emoji: "📚", label: "Study" },
  { mood: "Go Out", emoji: "🎉", label: "Go Out" },
  { mood: "Surprise Me", emoji: "🎲", label: "Surprise Me" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const router = useRouter();
  const identity = useIdentity();
  const real = useRealCircle();
  const {
    ready,
    state,
    user,
    displayMembers,
    circleMembers,
    setRsvp,
    requestSpontaneous,
    startPlan,
    submitFeedback,
    completeActivity,
    resetDemo,
    requestReshuffle,
    leaveDemoCircle,
  } = useDemo();
  const trust = useTrust();

  const [wantOpen, setWantOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ id: string; name: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [draft, setDraft] = useState<Activity | null>(null);
  const [feedbackEmoji, setFeedbackEmoji] = useState<FeedbackEmoji | null>(null);

  const strength = useMemo(() => {
    if (!state.circle) return null;
    return computeCircleStrength(state.circle, state.activities);
  }, [state.circle, state.activities]);

  const nextPlan = useMemo(() => {
    return state.activities.find(
      (a) => a.status === "upcoming" && a.mood !== "First Mission"
    ) ?? state.activities.find((a) => a.status === "upcoming");
  }, [state.activities]);

  const firstMission = state.activities.find((a) => a.mood === "First Mission");
  const weekItems = useMemo(() => {
    const items = state.activities
      .filter((a) => a.status !== "cancelled")
      .slice(0, 3)
      .map((a) => ({
        label: `${a.dateLabel} — ${a.emoji} ${a.title}`,
        done: a.status === "completed" || Object.values(a.rsvps).filter((s) => s === "in").length >= 3,
      }));
    if (items.length < 3) {
      items.push({ label: "Saturday — Open", done: false });
    }
    return items;
  }, [state.activities]);

  const pendingFeedback = state.activities.find(
    (a) => a.id === state.pendingFeedbackActivityId
  );

  useEffect(() => {
    if (!ready) return;
    if (identity.configured && identity.profile?.onboarding_completed_at) return;
    if (!state.circle || state.phase !== "home") {
      if (state.phase === "reveal") router.replace("/circle");
      else if (!state.circle && !identity.configured) router.replace("/");
    }
  }, [ready, state.circle, state.phase, router, identity.configured, identity.profile]);

  const loadCircleRules = trust.loadCircleRules;
  useEffect(() => {
    if (state.circle?.id) void loadCircleRules(state.circle.id);
  }, [state.circle?.id, loadCircleRules]);

  const firstName =
    identity.profile?.first_name || user?.profile.firstName || "there";

  if (!ready || !identity.ready) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-500">
        Loading your Circle...
      </main>
    );
  }

  if (identity.configured && identity.profile?.onboarding_completed_at) {
    if (!real.ready) {
      return (
        <main className="flex min-h-screen items-center justify-center text-[var(--ink-muted)]">
          Loading…
        </main>
      );
    }
    const hasRealCircle = Boolean(real.circle);
    return (
      <main className="page-shell">
        <AppHeader />
        <p className="text-caption">{greeting()},</p>
        <h1 className="text-page-title mt-1">{firstName}</h1>

        {hasRealCircle && real.circle ? (
          <section className="mt-8">
            <h2 className="text-section">Your Circle</h2>
            <p className="text-body-secondary mt-2">
              You&apos;re with {real.circle.members.length} people. Open Hangouts
              for the next plan, or revisit how you matched.
            </p>
            {real.circle.whyTogether[0] ? (
              <p className="text-caption mt-3">{real.circle.whyTogether[0]}</p>
            ) : null}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => router.push(`/circles/${real.circle!.id}`)}>
                Open Hangouts
              </Button>
              <Button variant="secondary" onClick={() => router.push("/circle")}>
                See the reveal
              </Button>
              <Button variant="quiet" onClick={() => router.push("/people")}>
                People
              </Button>
            </div>
          </section>
        ) : (
          <section className="mt-8">
            <h2 className="text-section">Find My Circle</h2>
            <p className="text-body-secondary mt-2">
              We&apos;ll place you with classmates who share interests, schedules,
              and group chemistry — not endless swiping.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => router.push("/matching")}>Find My Circle</Button>
              <Button variant="secondary" onClick={() => router.push("/circles")}>
                My Circles
              </Button>
              <Button variant="quiet" onClick={() => router.push("/people")}>
                Browse people
              </Button>
            </div>
          </section>
        )}

        <hr className="hairline" />

        <section>
          <p className="text-label">Standing</p>
          <div className="mt-3 flex items-end justify-between gap-6">
            <div>
              <p className="font-display text-4xl font-bold tabular-nums tracking-tight">
                {trust.reputation.karma}
              </p>
              <p className="text-caption mt-1">Circle Karma · private</p>
            </div>
            <div className="pb-1 text-right">
              <p className="text-section text-[1.05rem]">{trust.reliabilityLabel}</p>
              <p className="text-caption mt-0.5">{trust.standingLabel}</p>
            </div>
          </div>
          <p className="text-body-secondary mt-4 text-sm">{trust.reliabilityMessage}</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/trust" className="font-semibold text-[var(--brand-ink)]">
              Full standing
            </Link>
            <Link href="/trust/rules" className="text-[var(--ink-muted)] hover:text-[var(--ink)]">
              Community rules
            </Link>
            <Link href="/profile" className="text-[var(--ink-muted)] hover:text-[var(--ink)]">
              Profile
            </Link>
          </div>
        </section>

        <hr className="hairline" />

        <section>
          <h2 className="text-section">Campus</h2>
          <p className="text-body-secondary mt-2">
            See what people at your school are doing tonight — then turn a post into a plan.
          </p>
          <Button className="mt-4" variant="secondary" onClick={() => router.push("/campus")}>
            Open campus
          </Button>
        </section>
      </main>
    );
  }

  if (!user || !state.circle || !strength) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-500">
        Loading your Circle...
      </main>
    );
  }

  const handleMood = async (mood: ActivityMood) => {
    setChecking(true);
    setDraft(null);
    await new Promise((r) => setTimeout(r, 900));
    const activity = await requestSpontaneous(mood);
    setDraft(activity);
    setChecking(false);
  };

  return (
    <main className="mx-auto max-w-3xl px-5 py-6 pb-28 sm:px-8">
      <header className="mb-8 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{greeting()},</p>
          <h1 className="font-display text-3xl font-bold text-slate-900">
            {firstName}.
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="rounded-full border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm hover:bg-slate-50"
        >
          <Settings className="h-5 w-5" />
        </button>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Your Circle
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {displayMembers.map((m) => (
            <MemberCard
              key={m.id}
              compact
              name={m.firstName}
              avatar={m.avatar}
              major={m.major}
              year={m.year}
              dorm={m.dorm}
              interests={m.interests}
              isYou={"isYou" in m && m.isYou}
              universityVerified={"isYou" in m && m.isYou && trust.universityVerified}
            />
          ))}
        </div>
      </section>

      {nextPlan ? (
        <section className="card-surface mb-6 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-ink)]">
            Next Plan
          </p>
          <h3 className="font-display mt-2 text-2xl font-bold">
            {nextPlan.emoji} {nextPlan.title}
          </h3>
          <p className="mt-1 text-slate-600">
            {nextPlan.dateLabel} · {nextPlan.time}
          </p>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
            <MapPin className="h-4 w-4" /> {nextPlan.location}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">
              {Object.values(nextPlan.rsvps).filter((s) => s === "in").length} /{" "}
              {Object.keys(nextPlan.rsvps).length} confirmed
            </p>
            {nextPlan.rsvps[DEMO_USER_ID] === "in" ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => completeActivity(nextPlan.id)}
                >
                  I went
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    void trust.recordKarma("no_show", `noshow:${nextPlan.id}`);
                    setRsvp(nextPlan.id, "cant");
                  }}
                >
                  Missed it
                </Button>
              </div>
            ) : null}
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              className="flex-1"
              disabled={nextPlan.rsvps[DEMO_USER_ID] === "in"}
              onClick={() => setRsvp(nextPlan.id, "in")}
            >
              I&apos;m In
            </Button>
            <Button
              className="flex-1"
              variant="secondary"
              disabled={nextPlan.rsvps[DEMO_USER_ID] === "cant"}
              onClick={() => setRsvp(nextPlan.id, "cant")}
            >
              Can&apos;t Make It
            </Button>
          </div>
        </section>
      ) : null}

      <section className="card-surface mb-6 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Your Week
        </h2>
        <ul className="space-y-2">
          {weekItems.map((item) => (
            <li
              key={item.label}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm"
            >
              <span>{item.label}</span>
              {item.done ? (
                <span className="text-[var(--brand-ink)] font-medium">✓</span>
              ) : (
                <span className="text-slate-400">·</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="card-surface mb-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Circle Strength</h2>
          <span className="font-display text-2xl font-bold text-[var(--brand-ink)]">
            {strength.percent}%
          </span>
        </div>
        <ProgressBar value={strength.percent} />
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-xl bg-slate-50 p-2">
            <p className="font-semibold">{strength.completedMeetups}</p>
            <p className="text-xs text-slate-500">meetups</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-2">
            <p className="font-semibold">{strength.activeMembers}</p>
            <p className="text-xs text-slate-500">active</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-2">
            <p className="font-semibold">{strength.weeksTogether}</p>
            <p className="text-xs text-slate-500">weeks</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {STAGE_FLOW.map((stage, i) => (
            <span key={stage} className="flex items-center gap-2">
              <span
                className={
                  stage === strength.stage
                    ? "font-semibold text-[var(--brand-ink)]"
                    : STAGE_FLOW.indexOf(strength.stage) > i
                      ? "text-slate-700"
                      : ""
                }
              >
                {stage}
              </span>
              {i < STAGE_FLOW.length - 1 ? <span>↓</span> : null}
            </span>
          ))}
        </div>
      </section>

      {firstMission && firstMission.status === "upcoming" ? (
        <section className="mb-6 rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-600">
          First Mission: {firstMission.emoji} {firstMission.title} ·{" "}
          {Object.values(firstMission.rsvps).filter((s) => s === "in").length}/5 in
        </section>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 p-4 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <Button fullWidth size="lg" variant="coral" onClick={() => setWantOpen(true)}>
            <Plus className="h-5 w-5" />
            I want to do something
          </Button>
        </div>
      </div>

      <Modal
        open={wantOpen}
        onClose={() => {
          setWantOpen(false);
          setDraft(null);
          setChecking(false);
        }}
        title="What are you feeling?"
      >
        {!draft && !checking ? (
          <div className="grid grid-cols-2 gap-3">
            {MOODS.map((m) => (
              <button
                key={m.mood}
                type="button"
                onClick={() => void handleMood(m.mood)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-left transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]"
              >
                <span className="text-2xl">{m.emoji}</span>
                <p className="mt-2 font-semibold">{m.label}</p>
              </button>
            ))}
          </div>
        ) : null}

        {checking ? (
          <div className="flex flex-col items-center py-10 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              className="mb-4 h-10 w-10 rounded-full border-4 border-[var(--brand-soft)] border-t-[var(--brand)]"
            />
            <p className="font-medium text-slate-700">Checking who&apos;s around...</p>
          </div>
        ) : null}

        {draft ? (
          <div>
            <p className="text-sm font-medium text-[var(--brand-ink)]">
              3 people are free right now.
            </p>
            <h4 className="font-display mt-2 text-2xl font-bold">
              {draft.emoji} {draft.title}
            </h4>
            <p className="mt-1 text-slate-600">{draft.time}</p>
            <p className="mt-1 text-sm text-slate-500">{draft.location}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {displayMembers
                .filter((m) => draft.rsvps[m.id] === "in")
                .map((m) => (
                  <Chip key={m.id} label={`${m.firstName} ✓`} selected />
                ))}
            </div>
            <Button
              fullWidth
              className="mt-6"
              size="lg"
              onClick={() => {
                startPlan(draft);
                setWantOpen(false);
                setDraft(null);
              }}
            >
              Start Plan
            </Button>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(pendingFeedback)}
        onClose={() => submitFeedback(pendingFeedback!.id, "🙂", "Maybe")}
        title="How was it?"
      >
        {pendingFeedback ? (
          <div>
            <p className="mb-4 text-slate-600">
              {pendingFeedback.emoji} {pendingFeedback.title}
            </p>
            <div className="mb-6 flex justify-between gap-2">
              {(["😕", "😐", "🙂", "🔥"] as FeedbackEmoji[]).map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setFeedbackEmoji(e)}
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl border ${
                    feedbackEmoji === e
                      ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <p className="mb-3 font-semibold">Hang out with this Circle again?</p>
            <div className="flex gap-2">
              {(["Yes", "Maybe", "No"] as HangAgain[]).map((h) => (
                <Button
                  key={h}
                  variant="secondary"
                  className="flex-1"
                  disabled={!feedbackEmoji}
                  onClick={() => {
                    submitFeedback(pendingFeedback.id, feedbackEmoji!, h);
                    setFeedbackEmoji(null);
                  }}
                >
                  {h}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Settings">
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="font-semibold">Not feeling your Circle?</p>
            <p className="mt-1 text-sm text-slate-500">
              That&apos;s okay. Sometimes people just don&apos;t click. We&apos;ll
              introduce you to a different group during the next matching round.
            </p>
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => {
                requestReshuffle();
                setSettingsOpen(false);
              }}
            >
              {state.reshuffleRequested ? "Reshuffle requested" : "Reshuffle Circle"}
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="font-semibold">Circle rules</p>
            <p className="mt-1 text-sm text-slate-500">
              Extra boundaries for this group. The Social Coordinator will follow them.
            </p>
            <div className="mt-3">
              <CircleRulesEditor
                rules={trust.circleRules}
                onChange={(next) => {
                  void trust.saveCircleRules(state.circle?.id ?? "demo", next);
                }}
              />
            </div>
          </div>

          {circleMembers.length ? (
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="font-semibold">Block someone</p>
              <p className="mt-1 text-sm text-slate-500">They won&apos;t be told, and they won&apos;t be matched with you again.</p>
              <div className="mt-3 space-y-2">
                {circleMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
                    onClick={() => void trust.blockProfile(m.id)}
                  >
                    <span>{m.firstName}</span>
                    <span className="font-medium text-[var(--brand-ink)]">Block</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <Link
            href="/trust"
            className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50"
            onClick={() => setSettingsOpen(false)}
          >
            <Shield className="h-5 w-5 text-slate-500" />
            <div>
              <p className="font-medium">Your standing</p>
              <p className="text-sm text-slate-500">Karma, reliability, and community rules</p>
            </div>
          </Link>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50"
            onClick={() => {
              const other = displayMembers.find((m) => !("isYou" in m && m.isYou));
              setReportTarget({
                id: other?.id ?? "unknown",
                name: other?.firstName ?? "a member",
              });
              setSettingsOpen(false);
              setReportOpen(true);
            }}
          >
            <Shield className="h-5 w-5 text-slate-500" />
            <div>
              <p className="font-medium">Block / Report</p>
              <p className="text-sm text-slate-500">Safety tools for real-world meetups</p>
            </div>
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50"
            onClick={() => {
              setSettingsOpen(false);
              setLeaveOpen(true);
            }}
          >
            <Flag className="h-5 w-5 text-slate-500" />
            <div>
              <p className="font-medium">Leave Circle</p>
              <p className="text-sm text-slate-500">Exit quietly — no public rejection</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              resetDemo();
              router.push("/");
            }}
            className="flex w-full items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-left text-orange-800"
          >
            <LogOut className="h-5 w-5" />
            <div>
              <p className="font-medium">Reset demo</p>
              <p className="text-sm opacity-80">Back to onboarding for judges</p>
            </div>
          </button>

          <p className="pt-2 text-caption">
            University verification · public campus locations only
          </p>
        </div>
      </Modal>

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        subjectId={reportTarget?.id ?? ""}
        subjectName={reportTarget?.name ?? "this student"}
      />
      <LeaveCircleModal
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        onReport={() => {
          setLeaveOpen(false);
          const other = displayMembers.find((m) => !("isYou" in m && m.isYou));
          setReportTarget({
            id: other?.id ?? "unknown",
            name: other?.firstName ?? "a member",
          });
          setReportOpen(true);
        }}
        onLeft={() => {
          setLeaveOpen(false);
          leaveDemoCircle();
        }}
      />
    </main>
  );
}
