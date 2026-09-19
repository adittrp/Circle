"use client";

import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { KARMA_EXPLAINER } from "@/lib/trust/core";

export default function KarmaExplainerPage() {
  return (
    <main className="mx-auto min-h-screen max-w-xl px-5 pb-16 pt-6 sm:px-8">
      <AppHeader />
      <h1 className="font-display text-[2.2rem] font-bold leading-tight text-slate-900">
        {KARMA_EXPLAINER.title}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{KARMA_EXPLAINER.lead}</p>

      <ol className="mt-10 space-y-6">
        {KARMA_EXPLAINER.positives.map((line, i) => (
          <li key={line} className="flex gap-4">
            <span className="font-display w-6 shrink-0 text-lg font-semibold text-slate-300">
              {i + 1}
            </span>
            <p className="pt-0.5 text-[15px] font-medium leading-snug text-slate-800">{line}</p>
          </li>
        ))}
      </ol>

      <div className="mt-10 space-y-4 border-t border-slate-200/80 pt-8 text-[15px] leading-relaxed text-slate-600">
        <p>{KARMA_EXPLAINER.negatives}</p>
        <p>{KARMA_EXPLAINER.privacy}</p>
        <p>{KARMA_EXPLAINER.reports}</p>
      </div>

      <Link
        href="/trust"
        className="mt-12 inline-flex text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        ← Your standing
      </Link>
    </main>
  );
}
