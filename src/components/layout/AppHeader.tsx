"use client";

import { Shield, UserRound } from "lucide-react";
import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { useIdentity } from "@/context/IdentityContext";

export function AppHeader() {
  const { profile, university, configured } = useIdentity();
  const name = profile?.first_name;
  const onboarded = Boolean(profile?.onboarding_completed_at);

  return (
    <header className="mb-8 flex items-center justify-between gap-3">
      <Wordmark />
      <div className="flex items-center gap-2">
        {configured && onboarded ? (
          <Link
            href="/campus"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Campus
          </Link>
        ) : null}
        {university ? (
          <span
            className="hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline"
            style={{
              background: "color-mix(in srgb, var(--uni-primary, #0d9488) 12%, white)",
              color: "var(--uni-primary, #0f766e)",
            }}
          >
            {university.abbreviation}
          </span>
        ) : null}
        {configured && name ? (
          <>
            <Link
              href="/people"
              className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 sm:inline"
            >
              People
            </Link>
            <Link
              href="/trust"
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
              aria-label="Your standing"
            >
              <Shield className="h-4 w-4" />
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <UserRound className="h-4 w-4" />
              {name}
            </Link>
          </>
        ) : null}
      </div>
    </header>
  );
}
