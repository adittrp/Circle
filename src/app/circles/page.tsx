"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
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
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load Circles"));
  }, [ready, configured, profile]);

  const loading = Boolean(configured && profile && circles === null && !error);

  const start = async () => {
    if (!profile?.university_id) {
      setError("Finish onboarding so Circle knows your university.");
      return;
    }
    setCreating(true);
    try {
      const circle = await createHangoutCircle(createClient(), profile.university_id, profile.id);
      router.push(`/circles/${circle.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start a Circle");
      setCreating(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
      <AppHeader />
      <h1 className="font-display text-3xl font-bold">Circles</h1>
      <p className="mt-2 text-slate-600">
        Path 2 matching places you in a group. Path 3 is what happens next: plans, RSVPs, and showing up again.
      </p>
      {error ? <p className="mt-3 text-sm text-orange-700">{error}</p> : null}
      {loading ? <p className="mt-8 text-slate-500">Loading...</p> : null}
      {!loading && (circles?.length ?? 0) === 0 ? (
        <section className="card-surface mt-8 p-6">
          <h2 className="font-display text-xl font-bold">No Circle yet</h2>
          <p className="mt-2 text-slate-600">
            Matching will put you with classmates. Until then, you can start a hangout Circle and invite people you already know.
          </p>
          <Button className="mt-4" onClick={() => void start()} disabled={creating}>
            Start a hangout Circle
          </Button>
        </section>
      ) : null}
      {!loading && (circles?.length ?? 0) > 0 ? (
        <ul className="mt-8 space-y-3">
          {(circles ?? []).map((circle) => (
            <li key={circle.id}>
              <Link href={`/circles/${circle.id}`} className="card-surface block p-5 hover:border-teal-300">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                  {university?.abbreviation ?? "Campus"}
                </p>
                <p className="font-display mt-1 text-xl font-bold">Your Circle</p>
                <p className="text-sm text-slate-500">
                  {circle.completed_meetups} hangouts · stage {circle.stage.replace("_", " ")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {circles && circles.length > 0 ? (
        <Button className="mt-6" variant="secondary" onClick={() => void start()} disabled={creating}>
          Start another hangout Circle
        </Button>
      ) : null}
    </main>
  );
}
