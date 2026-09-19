"use client";

import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import { useTrust } from "@/context/TrustContext";
import { CODE_OF_CONDUCT } from "@/lib/trust/core";

export default function RulesPage() {
  const trust = useTrust();

  return (
    <main className="mx-auto min-h-screen max-w-xl px-5 pb-16 pt-6 sm:px-8">
      <AppHeader />
      <h1 className="font-display text-[2.2rem] font-bold leading-tight text-slate-900">
        {CODE_OF_CONDUCT.title}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{CODE_OF_CONDUCT.intro}</p>

      <ol className="mt-10 space-y-8">
        {CODE_OF_CONDUCT.items.map((item, i) => (
          <li key={item.id} className="flex gap-4">
            <span className="font-display w-7 shrink-0 text-lg font-semibold text-slate-300">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{item.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-10 text-[15px] leading-relaxed text-slate-600">{CODE_OF_CONDUCT.footer}</p>

      {!trust.acknowledged ? (
        <Button className="mt-8" fullWidth onClick={() => void trust.acknowledgeConduct()}>
          I understand these rules
        </Button>
      ) : (
        <p className="mt-8 text-sm font-medium text-slate-500">You already agreed to these.</p>
      )}

      <Link
        href="/trust"
        className="mt-10 inline-flex text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        ← Your standing
      </Link>
    </main>
  );
}
