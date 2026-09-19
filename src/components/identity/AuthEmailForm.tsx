"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { isEduEmail } from "@/lib/auth/edu";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function AuthEmailForm({ mode }: { mode: "signup" | "signin" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const configured = isSupabaseConfigured();

  const submit = async () => {
    setError(null);
    if (!configured) {
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    if (!isEduEmail(email)) {
      setError("Use a school email that ends in .edu");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const site = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const normalized = email.trim().toLowerCase();
    const sendOtp = (createUser: boolean) =>
      supabase.auth.signInWithOtp({
        email: normalized,
        options: {
          shouldCreateUser: createUser,
          emailRedirectTo: `${site}/auth/callback`,
        },
      });

    let { error: authError } = await sendOtp(mode === "signup");
    // Sign-in with no existing user returns this — previous failed signups never created an account.
    if (
      authError &&
      mode === "signin" &&
      /signups not allowed for otp/i.test(authError.message)
    ) {
      ({ error: authError } = await sendOtp(true));
    }
    setLoading(false);
    if (authError) {
      setError(humanAuthError(authError.message));
      return;
    }
    router.push(`/verify?email=${encodeURIComponent(normalized)}`);
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-slate-600">School email</span>
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="you@utexas.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
        />
      </label>
      {error ? (
        <p className="rounded-xl bg-orange-50 px-3 py-2 text-sm text-orange-800">{error}</p>
      ) : null}
      <Button type="submit" fullWidth size="lg" disabled={loading}>
        {loading ? "Sending link..." : "Email me a sign-in link"}
      </Button>
      <p className="text-center text-xs text-slate-500">
        We only accept .edu addresses. One email, one link — clicking it signs you in.
      </p>
    </form>
  );
}

function humanAuthError(message: string) {
  if (/signups not allowed for otp/i.test(message)) {
    return "No Circle account exists for that email yet. Open Sign up and send a new sign-in link.";
  }
  if (/database error saving new user/i.test(message)) {
    return "We couldn't create your profile. Try Sign up again — if it repeats, the database trigger needs a fix.";
  }
  return message;
}
