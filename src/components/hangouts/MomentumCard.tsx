"use client";

import { ProgressBar } from "@/components/ui/Progress";
import { MOMENTUM_FLOW } from "@/lib/hangouts/momentum";
import type { CircleMomentum } from "@/lib/hangouts/types";

export function MomentumCard({ momentum }: { momentum: CircleMomentum }) {
  return (
    <section className="card-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Circle Momentum</h2>
          <p className="text-xs text-slate-500">A playful record of hanging out — not a friendship score.</p>
        </div>
        <span className="font-display text-2xl font-bold text-teal-700">{momentum.percent}%</span>
      </div>
      <ProgressBar value={momentum.percent} />
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-xl bg-slate-50 p-2">
          <p className="font-semibold">{momentum.completedMeetups}</p>
          <p className="text-xs text-slate-500">hangouts</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-2">
          <p className="font-semibold">{momentum.activeMembers}</p>
          <p className="text-xs text-slate-500">active</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-2">
          <p className="font-semibold">{momentum.weeksTogether}</p>
          <p className="text-xs text-slate-500">weeks</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {MOMENTUM_FLOW.map((stage, i) => (
          <span key={stage} className="flex items-center gap-2">
            <span
              className={
                stage === momentum.stage
                  ? "font-semibold text-teal-700"
                  : MOMENTUM_FLOW.indexOf(momentum.stage) > i
                    ? "text-slate-700"
                    : ""
              }
            >
              {stage}
            </span>
            {i < MOMENTUM_FLOW.length - 1 ? <span>→</span> : null}
          </span>
        ))}
      </div>
    </section>
  );
}
