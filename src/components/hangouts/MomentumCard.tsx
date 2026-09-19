"use client";

import { ProgressBar } from "@/components/ui/Progress";
import { MOMENTUM_FLOW } from "@/lib/hangouts/momentum";
import type { CircleMomentum } from "@/lib/hangouts/types";

/** Lightweight stage context — not a friendship score. */
export function MomentumCard({ momentum }: { momentum: CircleMomentum }) {
  return (
    <section className="border-t border-[var(--line)] pt-5">
      <p className="text-label">Your Circle so far</p>
      <p className="text-section mt-1">{momentum.stage}</p>
      <p className="text-caption mt-1 max-w-sm">
        {momentum.completedMeetups} hangout{momentum.completedMeetups === 1 ? "" : "s"} ·{" "}
        {momentum.activeMembers} active · {momentum.weeksTogether} week
        {momentum.weeksTogether === 1 ? "" : "s"} together
      </p>
      <div className="mt-3">
        <ProgressBar value={momentum.percent} />
      </div>
      <ol className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption">
        {MOMENTUM_FLOW.map((stage, i) => {
          const current = MOMENTUM_FLOW.indexOf(momentum.stage);
          const done = current > i;
          const here = stage === momentum.stage;
          return (
            <li key={stage} className="flex items-center gap-2">
              <span
                className={
                  here
                    ? "font-semibold text-[var(--brand-ink)]"
                    : done
                      ? "text-[var(--ink-secondary)]"
                      : "text-[var(--ink-faint)]"
                }
              >
                {stage}
              </span>
              {i < MOMENTUM_FLOW.length - 1 ? (
                <span className="text-[var(--ink-faint)]" aria-hidden>
                  →
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
