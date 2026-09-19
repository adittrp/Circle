"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import { useIdentity } from "@/context/IdentityContext";
import { joinHangoutCircle } from "@/lib/hangouts/queries";
import { createClient } from "@/lib/supabase/client";

export default function JoinCirclePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { profile, ready } = useIdentity();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !profile) return;
    void joinHangoutCircle(createClient(), params.id, profile.id)
      .then(() => router.replace(`/circles/${params.id}`))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not join");
      });
  }, [params.id, profile, ready, router]);

  const joining = ready && Boolean(profile) && !error;

  return (
    <main className="mx-auto max-w-lg px-5 py-10">
      <AppHeader />
      <section className="card-surface p-6">
        <h1 className="font-display text-2xl font-bold">Joining Circle</h1>
        <p className="mt-2 text-slate-600">
          {joining ? "Adding you to the group..." : error ?? "Sign in to join."}
        </p>
        {error ? (
          <Button className="mt-4" onClick={() => router.push("/circles")}>
            Back to Circles
          </Button>
        ) : null}
      </section>
    </main>
  );
}
