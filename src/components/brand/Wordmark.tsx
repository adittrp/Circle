"use client";

import Image from "next/image";
import Link from "next/link";

export function Wordmark({
  href = "/",
  compact = false,
  className = "",
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center ${className}`}
      aria-label="Circle home"
    >
      {compact ? (
        <Image
          src="/brand/circle-mark.svg"
          alt="Circle"
          width={36}
          height={36}
          className="h-9 w-9"
          priority
        />
      ) : (
        <Image
          src="/brand/circle-wordmark.svg"
          alt="Circle"
          width={140}
          height={40}
          className="h-9 w-auto"
          priority
        />
      )}
    </Link>
  );
}
