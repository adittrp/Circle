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
    <main className="page-shell">
      <AppHeader />

      <p className="text-caption">Hi {first}</p>
      <h1 className="text-page-title mt-1">Your standing</h1>
      <p className="text-body-secondary mt-2 max-w-md">
        Only you see this. Other students never see your Karma — just that you
        belong on campus.
      </p>

      <section className="mt-10">
        <p className="text-label">Circle Karma</p>
        <p className="font-display mt-1 text-4xl font-bold tabular-nums tracking-tight">
          {trust.reputation.karma}
        </p>
        <p className="text-body-secondary mt-3 text-sm">{trust.reliabilityMessage}</p>
        <Link
          href="/trust/karma"
          className="mt-3 inline-block text-sm font-semibold text-[var(--brand-ink)]"
        >
          How Karma works
        </Link>
      </section>

      <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-[var(--line)] pt-8">
        <div>
          <dt className="text-label">Reliability</dt>
          <dd className="text-section mt-1 text-[1.1rem]">{trust.reliabilityLabel}</dd>
          <dd className="text-caption mt-1">
            {trust.reputation.plans_accepted} accepted · {trust.reputation.plans_attended}{" "}
            attended
          </dd>
        </div>
        <div>
          <dt className="text-label">Community</dt>
          <dd className="text-section mt-1 text-[1.1rem]">{trust.standingLabel}</dd>
          <dd className="text-caption mt-1">
            {trust.universityVerified
              ? "School email confirmed"
              : "Confirm with school email"}
          </dd>
        </div>
        <div>
          <dt className="text-label">Public Circles</dt>
          <dd className="text-section mt-1 text-[1.1rem]">
            {trust.privileges.maxPublicCircles}
          </dd>
        </div>
        <div>
          <dt className="text-label">Plan size</dt>
          <dd className="text-section mt-1 text-[1.1rem]">
            up to {trust.privileges.maxActivitySize}
          </dd>
        </div>
      </dl>

      <section className="mt-12 border-t border-[var(--line)] pt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-section text-[1.1rem]">Blocked</h2>
          {!hasBlocks ? <p className="text-caption">None</p> : null}
        </div>
        {hasBlocks ? (
          <ul className="mt-4 divide-y divide-[var(--line)]">
            {trust.blocks.map((b) => (
              <li
                key={b.blocked_id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <span className="font-mono text-xs text-[var(--ink-muted)]">
                  {b.blocked_id.slice(0, 8)}…
                </span>
                <button
                  type="button"
                  className="font-medium text-[var(--brand-ink)]"
                  onClick={() => void trust.unblockProfile(b.blocked_id)}
                >
                  Unblock
                </button>
              </li>
            ))}
            {trust.demoBlockedIds.map((id) => (
              <li key={id} className="flex items-center justify-between py-3 text-sm">
                <span>{id}</span>
                <button
                  type="button"
                  className="font-medium text-[var(--brand-ink)]"
                  onClick={() => void trust.unblockProfile(id)}
                >
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body-secondary mt-2 text-sm">
            People you block won&apos;t be matched with you again. They are not
            notified.
          </p>
        )}
      </section>

      <section className="mt-10 border-t border-[var(--line)] pt-8">
        <h2 className="text-section text-[1.1rem]">{CODE_OF_CONDUCT.title}</h2>
        <p className="text-body-secondary mt-2 text-sm">{CODE_OF_CONDUCT.intro}</p>
        <Link
          href="/trust/rules"
          className="mt-3 inline-block text-sm font-semibold text-[var(--brand-ink)]"
        >
          Read the full rules
        </Link>
      </section>

      <section className="mt-10 border-t border-[var(--line)] pt-8">
        <h2 className="text-section text-[1.1rem]">If something feels wrong</h2>
        <ul className="text-body-secondary mt-3 space-y-2 text-sm">
          <li>Campus police / UTPD — 512-471-4441</li>
          <li>In danger — call 911</li>
          <li>Leave a Circle anytime from Home → Settings</li>
        </ul>
      </section>
    </main>
  );
}
