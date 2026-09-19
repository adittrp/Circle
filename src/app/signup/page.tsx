"use client";

import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { AuthEmailForm } from "@/components/identity/AuthEmailForm";

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <Wordmark />
      <h1 className="font-display mt-10 text-4xl font-bold">Create your Circle</h1>
      <p className="mt-2 text-slate-500">
        Start with your school email. We&apos;ll send a sign-in link — no password to forget.
      </p>
      <div className="card-surface mt-8 p-6">
        <AuthEmailForm mode="signup" />
      </div>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/signin" className="font-semibold text-teal-700">
          Sign in
        </Link>
      </p>
    </main>
  );
}
