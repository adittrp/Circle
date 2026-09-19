"use client";

import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { AuthEmailForm } from "@/components/identity/AuthEmailForm";

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <Wordmark size="sm" />
      <h1 className="text-page-title mt-10">Welcome back</h1>
      <p className="text-body-secondary mt-2">
        We&apos;ll email a sign-in link to your .edu address.
      </p>
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
