"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import { useIdentity } from "@/context/IdentityContext";

/**
 * Developer-only matching harness. Shows pool size, scores, and runtime.
 * Never linked from normal product navigation.
 */
export default function MatchingHarnessPage() {
  const identity = useIdentity();
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState(false);

  if (process.env.NODE_ENV === "production") {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-500">
        Not available in production.
      </main>
    );
  }

  const run = async (dryRun: boolean) => {
    setLoading(true);
    setOutput("");
    const res = await fetch("/api/matching/find-circle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dryRun, includeSynthetic: true }),
    });
    const json = await res.json();
    setOutput(JSON.stringify(json, null, 2));
    setLoading(false);
  };

  return (
    <main className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
      <AppHeader />
      <h1 className="font-display text-3xl font-bold">Matching harness</h1>
      <p className="mt-2 text-sm text-slate-500">
        Signed in as {identity.email ?? "—"}. Dry run scores without writing a Circle.
      </p>
      <div className="mt-6 flex gap-3">
        <Button disabled={loading} onClick={() => void run(true)}>
          Dry-run match
        </Button>
        <Button disabled={loading} variant="secondary" onClick={() => void run(false)}>
          Persist match
        </Button>
      </div>
      <pre className="mt-6 overflow-auto rounded-2xl bg-slate-900 p-4 text-xs text-white/90">
        {output || "Results will appear here."}
      </pre>
    </main>
  );
}
