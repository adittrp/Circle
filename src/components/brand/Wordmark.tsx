"use client";

import Image from "next/image";
import Link from "next/link";

/**
 * Brand wordmark. SVGs use a content-tight viewBox and shared vertical
 * center so the mark and letters align optically (not just mathematically).
 */
export function Wordmark({
  href = "/",
  compact = false,
  className = "",
  size = "md",
}: {
  href?: string;
  compact?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const wordHeights = { sm: "h-7", md: "h-8", lg: "h-10" } as const;
  const markSizes = {
    sm: { className: "h-7 w-7", dim: 28 },
    md: { className: "h-8 w-8", dim: 32 },
    lg: { className: "h-10 w-10", dim: 40 },
  } as const;

  return (
    <Link
      href={href}
      className={`inline-flex items-center leading-none ${className}`}
      aria-label="Circle home"
    >
      {compact ? (
        <Image
          src="/brand/circle-mark.svg"
          alt=""
          width={markSizes[size].dim}
          height={markSizes[size].dim}
          className={markSizes[size].className}
          priority
        />
      ) : (
        <Image
          src="/brand/circle-wordmark.svg"
          alt=""
          width={272}
          height={64}
          className={`${wordHeights[size]} w-auto`}
          priority
        />
      )}
    </Link>
  );
}
