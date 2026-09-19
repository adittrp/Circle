"use client";

import Link from "next/link";

export function Wordmark({
  href = "/",
  compact = false,
}: {
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 font-display text-lg font-bold text-white">
        C
      </span>
      {compact ? null : (
        <span className="font-display text-xl font-bold tracking-tight text-slate-900">
          Circle
        </span>
      )}
    </Link>
  );
}
