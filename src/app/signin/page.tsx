"use client";

import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { AuthEmailForm } from "@/components/identity/AuthEmailForm";

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <Wordmark />
      <h1 className="font-display mt-10 text-4xl font-bold">Welcome back</h1>
      <p className="mt-2 text-slate-500">
        We&apos;ll email you a sign-in link for your .edu account.
      </p>
      <div className="card-surface mt-8 p-6">
        <AuthEmailForm mode="signin" />
      </div>
      <p className="mt-6 text-center text-sm text-slate-500">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-teal-700">
          Create an account
        </Link>
      </p>
    </main>
  );
}
