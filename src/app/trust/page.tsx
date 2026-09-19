"use client";

import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIdentity } from "@/context/IdentityContext";
import { useTrust } from "@/context/TrustContext";
import { CODE_OF_CONDUCT } from "@/lib/trust/core";

export default function TrustCenterPage() {
  const identity = useIdentity();
  const trust = useTrust();
  const first = identity.profile?.first_name || "there";
  const hasBlocks = trust.blocks.length > 0 || trust.demoBlockedIds.length > 0;

  return (
    <main className="relative mx-auto min-h-screen max-w-xl px-5 pb-16 pt-6 sm:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% -10%, color-mix(in srgb, var(--uni-primary, #0d9488) 18%, transparent), transparent 70%)",
        }}
      />
      <AppHeader />

      <p className="text-sm text-slate-500">Hi {first}</p>
      <h1 className="font-display mt-1 text-[2.35rem] font-bold leading-tight tracking-tight text-slate-900">
        Your standing
      </h1>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-slate-500">
        Only you see this. Other students never see your Karma — just that you belong on campus.
      </p>

      <section className="mt-10">
        <p className="text-[13px] font-medium text-slate-400">Circle Karma</p>
        <p className="font-display mt-1 text-6xl font-bold tabular-nums tracking-tight text-slate-900">
          {trust.reputation.karma}
        </p>
        <p className="mt-3 text-[15px] text-slate-600">{trust.reliabilityMessage}</p>
        <Link
          href="/trust/karma"
          className="mt-3 inline-block text-sm font-semibold text-[color:var(--uni-primary,#0f766e)] hover:underline"
        >
          How Karma works
        </Link>
      </section>

      <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-slate-200/80 pt-8">
        <div>
          <dt className="text-[13px] font-medium text-slate-400">Reliability</dt>
          <dd className="mt-1 font-display text-xl font-semibold text-slate-900">
            {trust.reliabilityLabel}
          </dd>
          <dd className="mt-1 text-sm text-slate-500">
            {trust.reputation.plans_accepted} accepted · {trust.reputation.plans_attended} attended
          </dd>
        </div>
        <div>
          <dt className="text-[13px] font-medium text-slate-400">Community</dt>
          <dd className="mt-1 font-display text-xl font-semibold text-slate-900">
            {trust.standingLabel}
          </dd>
          <dd className="mt-1 text-sm text-slate-500">
            {trust.universityVerified ? "School email confirmed" : "Confirm with school email"}
          </dd>
        </div>
        <div>
          <dt className="text-[13px] font-medium text-slate-400">Public Circles</dt>
          <dd className="mt-1 font-display text-xl font-semibold text-slate-900">
            {trust.privileges.maxPublicCircles}
          </dd>
        </div>
        <div>
          <dt className="text-[13px] font-medium text-slate-400">Plan size</dt>
          <dd className="mt-1 font-display text-xl font-semibold text-slate-900">
            up to {trust.privileges.maxActivitySize}
          </dd>
        </div>
      </dl>

      <section className="mt-12 border-t border-slate-200/80 pt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-slate-900">Blocked</h2>
          {!hasBlocks ? (
            <p className="text-sm text-slate-400">None</p>
          ) : null}
        </div>
        {hasBlocks ? (
          <ul className="mt-4 divide-y divide-slate-100">
            {trust.blocks.map((b) => (
              <li key={b.blocked_id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-mono text-xs text-slate-500">
                  {b.blocked_id.slice(0, 8)}…
                </span>
                <button
                  type="button"
                  className="font-medium text-[color:var(--uni-primary,#0f766e)]"
                  onClick={() => void trust.unblockProfile(b.blocked_id)}
                >
                  Unblock
                </button>
              </li>
            ))}
            {trust.demoBlockedIds.map((id) => (
              <li key={id} className="flex items-center justify-between py-3 text-sm">
                <span className="text-slate-700">{id}</span>
                <button
                  type="button"
                  className="font-medium text-[color:var(--uni-primary,#0f766e)]"
                  onClick={() => void trust.unblockProfile(id)}
                >
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            People you block won&apos;t be matched with you again. They are not notified.
          </p>
        )}
      </section>

      <section className="mt-10 border-t border-slate-200/80 pt-8">
        <h2 className="font-display text-lg font-semibold text-slate-900">{CODE_OF_CONDUCT.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{CODE_OF_CONDUCT.intro}</p>
        <Link
          href="/trust/rules"
          className="mt-3 inline-block text-sm font-semibold text-[color:var(--uni-primary,#0f766e)] hover:underline"
        >
          Read the full rules
        </Link>
      </section>

      <section className="mt-10 border-t border-slate-200/80 pt-8">
        <h2 className="font-display text-lg font-semibold text-slate-900">If something feels wrong</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
          <li>Campus police / UTPD — 512-471-4441</li>
          <li>In danger — call 911</li>
          <li>Leave a Circle anytime from Home → Settings</li>
        </ul>
      </section>

      <Link
        href="/home"
        className="mt-12 inline-flex text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        ← Home
      </Link>
    </main>
  );
}
