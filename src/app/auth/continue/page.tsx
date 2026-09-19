"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Wordmark } from "@/components/brand/Wordmark";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Finishes hash-fragment magic links (#access_token=...). Query-param links are
 * handled by /auth/callback/route.ts.
 */
function ContinueBody() {
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const finish = async () => {
      if (!isSupabaseConfigured()) {
        setError("Supabase is not configured.");
        return;
      }

      const next = params.get("next") || "/onboarding";
      const destination = next.startsWith("/") ? next : "/onboarding";
      const supabase = createClient();

      const hash = window.location.hash.replace(/^#/, "");
      if (hash.includes("access_token")) {
        const hashParams = new URLSearchParams(hash);
        const access_token = hashParams.get("access_token");
        const refresh_token = hashParams.get("refresh_token");
        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionError) {
            setError(sessionError.message);
            return;
          }
          window.location.replace(destination);
          return;
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        window.location.replace(destination);
        return;
      }

      setError("This sign-in link is missing its token. Request a new one.");
    };

    void finish();
  }, [params]);

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10 text-center">
        <Wordmark />
        <h1 className="font-display mt-10 text-3xl font-bold">Couldn&apos;t sign you in</h1>
        <p className="mt-3 rounded-xl bg-orange-50 px-3 py-2 text-sm text-orange-800">{error}</p>
        <p className="mt-6 text-sm text-slate-500">
          <Link href="/signup" className="font-semibold text-[var(--brand-ink)]">
            Request a new link
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center text-slate-500">
      Signing you in...
    </main>
  );
}

export default function AuthContinuePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center text-slate-500">
          Signing you in...
        </main>
      }
    >
      <ContinueBody />
    </Suspense>
  );
}
