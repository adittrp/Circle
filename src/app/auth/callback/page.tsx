"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { Wordmark } from "@/components/brand/Wordmark";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function CallbackBody() {
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const finish = async () => {
      if (!isSupabaseConfigured()) {
        setError("Supabase is not configured.");
        return;
      }

      const supabase = createClient();
      const next = params.get("next") || "/onboarding";
      const destination = next.startsWith("/") ? next : "/onboarding";
      const token_hash = params.get("token_hash") ?? params.get("token");
      const type = (params.get("type") ?? "email") as EmailOtpType;
      const code = params.get("code");

      let authError: { message: string } | null = null;

      if (token_hash) {
        const result = await supabase.auth.verifyOtp({ token_hash, type });
        authError = result.error;
      } else if (code) {
        const result = await supabase.auth.exchangeCodeForSession(code);
        authError = result.error;
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          window.location.replace(destination);
          return;
        }
        setError("This sign-in link is missing its token. Request a new one.");
        return;
      }

      if (authError) {
        setError(authError.message);
        return;
      }

      window.location.replace(destination);
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
          <Link href="/signup" className="font-semibold text-teal-700">
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

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center text-slate-500">
          Signing you in...
        </main>
      }
    >
      <CallbackBody />
    </Suspense>
  );
}
