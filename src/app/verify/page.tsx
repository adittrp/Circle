"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Wordmark } from "@/components/brand/Wordmark";

function VerifyBody() {
  const email = useSearchParams().get("email");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <Wordmark size="sm" />
      <h1 className="text-page-title mt-10">Check your inbox</h1>
      <p className="text-body-secondary mt-3">
        We sent a sign-in link
        {email ? (
          <>
            {" "}
            to <span className="font-semibold text-[var(--ink)]">{email}</span>
          </>
        ) : (
          " to your school email"
        )}
        . Open it on this device — that click signs you in.
      </p>
      <p className="mt-8 text-caption">
        Wrong address?{" "}
        <Link href="/signup" className="font-semibold text-[var(--brand-ink)]">
          Try again
        </Link>
      </p>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center text-[var(--ink-muted)]">
          Loading…
        </main>
      }
    >
      <VerifyBody />
    </Suspense>
  );
}
