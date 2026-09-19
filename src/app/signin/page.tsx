"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Wordmark } from "@/components/brand/Wordmark";
import { AuthEmailForm } from "@/components/identity/AuthEmailForm";

function SignInBody() {
  const error = useSearchParams().get("error");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <Wordmark size="sm" />
      <h1 className="text-page-title mt-10">Welcome back</h1>
      <p className="text-body-secondary mt-2">
        We&apos;ll email a sign-in link to your .edu address.
      </p>
      {error ? (
        <p className="mt-4 rounded-[var(--radius-sm)] bg-[var(--warning-soft)] px-3 py-2 text-sm text-[var(--warning)]">
          {error}
        </p>
      ) : null}
      <div className="mt-8">
        <AuthEmailForm mode="signin" />
      </div>
      <p className="mt-8 text-center text-caption">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-[var(--brand-ink)]">
          Create an account
        </Link>
      </p>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center text-[var(--ink-muted)]">
          Loading…
        </main>
      }
    >
      <SignInBody />
    </Suspense>
  );
}
