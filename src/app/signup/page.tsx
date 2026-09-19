"use client";

import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { AuthEmailForm } from "@/components/identity/AuthEmailForm";

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <Wordmark size="sm" />
      <h1 className="text-page-title mt-10">Create your Circle</h1>
      <p className="text-body-secondary mt-2">
        Your school email keeps Circle on campus. We&apos;ll send one link —
        clicking it creates your account and signs you in.
      </p>
      <div className="mt-8">
        <AuthEmailForm mode="signup" />
      </div>
      <p className="mt-8 text-center text-caption">
        Already have an account?{" "}
        <Link href="/signin" className="font-semibold text-[var(--brand-ink)]">
          Sign in
        </Link>
      </p>
    </main>
  );
}
