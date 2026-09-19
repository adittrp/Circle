"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Wordmark } from "@/components/brand/Wordmark";

function VerifyBody() {
  const email = useSearchParams().get("email");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10 text-center">
      <div className="flex justify-center">
        <Wordmark />
      </div>
      <div className="mx-auto mt-10 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-700">
        <Mail className="h-7 w-7" />
      </div>
      <h1 className="font-display mt-6 text-3xl font-bold">Check your inbox</h1>
      <p className="mt-3 text-slate-500">
        We sent a sign-in link
        {email ? (
          <>
            {" "}
            to <span className="font-semibold text-slate-800">{email}</span>
          </>
        ) : (
          " to your school email"
        )}
        . Open it on this device. That click signs you in — you should not need a second email.
      </p>
      <p className="mt-8 text-sm text-slate-500">
        Wrong address?{" "}
        <Link href="/signup" className="font-semibold text-teal-700">
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
        <main className="flex min-h-screen items-center justify-center text-slate-500">
          Loading...
        </main>
      }
    >
      <VerifyBody />
    </Suspense>
  );
}
