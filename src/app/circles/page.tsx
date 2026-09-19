"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useIdentity } from "@/context/IdentityContext";
import { createHangoutCircle, listMyCircles } from "@/lib/hangouts/queries";
import { createClient } from "@/lib/supabase/client";
import type { CircleRow } from "@/lib/supabase/database.types";

export default function CirclesPage() {
  const router = useRouter();
  const { profile, university, ready, configured } = useIdentity();
  const [circles, setCircles] = useState<CircleRow[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !configured || !profile) return;
    void listMyCircles(createClient(), profile.id)
      .then(setCircles)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Could not load Circles")
      );
  }, [ready, configured, profile]);

  const loading = Boolean(configured && profile && circles === null && !error);

  const start = async () => {
    if (!profile?.university_id) {
      setError("Finish onboarding so Circle knows your university.");
      return;
    }
    setCreating(true);
    try {
      const circle = await createHangoutCircle(
        createClient(),
        profile.university_id,
        profile.id
      );
      router.push(`/circles/${circle.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start a Circle");
      setCreating(false);
    }
  };

  return (
    <main className="page-shell-wide">
      <AppHeader />
      <h1 className="text-page-title">Circles</h1>
      <p className="text-body-secondary mt-2 max-w-lg">
        Matching places you with classmates. Hangouts is what happens next —
        plans, RSVPs, and showing up again.
      </p>
      {error ? (
        <p className="mt-3 text-sm text-[var(--warning)]">{error}</p>
      ) : null}
      {loading ? (
        <div className="mt-8 space-y-3">
          <div className="skeleton h-20 w-full" />
          <div className="skeleton h-20 w-full" />
        </div>
      ) : null}
      {!loading && (circles?.length ?? 0) === 0 ? (
        <EmptyState
          title="No Circle yet"
          body="Find classmates through matching, or start a hangout Circle and invite people you already know."
          actionLabel={creating ? "Starting…" : "Start a hangout Circle"}
          onAction={() => void start()}
        />
      ) : null}
      {!loading && (circles?.length ?? 0) > 0 ? (
        <ul className="mt-8 divide-y divide-[var(--line)] border-t border-[var(--line)]">
          {(circles ?? []).map((circle) => (
            <li key={circle.id}>
              <Link
                href={`/circles/${circle.id}`}
                className="block py-5 transition-colors hover:bg-[var(--bg-muted)] -mx-2 px-2 rounded-[var(--radius-sm)]"
              >
                <p className="text-caption font-semibold text-[var(--brand-ink)]">
                  {university?.abbreviation ?? "Campus"}
                </p>
                <p className="text-section mt-1">Your Circle</p>
                <p className="text-caption mt-1">
                  {circle.completed_meetups} hangouts · {circle.stage.replace(/_/g, " ")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {circles && circles.length > 0 ? (
        <Button
          className="mt-6"
          variant="secondary"
          onClick={() => void start()}
          disabled={creating}
        >
          Start another hangout Circle
        </Button>
      ) : null}
      {!loading && (circles?.length ?? 0) === 0 ? (
        <p className="mt-4 text-center">
          <Link href="/matching" className="text-sm font-semibold text-[var(--brand-ink)]">
            Or find a Circle through matching
          </Link>
        </p>
      ) : null}
    </main>
  );
}
