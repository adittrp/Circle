"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/brand/Wordmark";
import { useIdentity } from "@/context/IdentityContext";

const PRIMARY_NAV = [
  { href: "/home", label: "Home" },
  { href: "/circles", label: "Circles" },
  { href: "/campus", label: "Campus" },
  { href: "/people", label: "People" },
] as const;

export function AppHeader() {
  const pathname = usePathname();
  const { profile, university, configured } = useIdentity();
  const name = profile?.first_name;
  const onboarded = Boolean(profile?.onboarding_completed_at);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="mb-6 border-b border-[var(--line)] pb-4">
      <div className="flex items-center justify-between gap-3">
        <Wordmark href={onboarded ? "/home" : "/"} size="sm" />
        <div className="flex items-center gap-1.5 sm:gap-2">
          {university ? (
            <span className="hidden text-caption font-semibold text-[var(--ink-muted)] sm:inline">
              {university.abbreviation}
            </span>
          ) : null}
          {configured && name ? (
            <>
              <Link
                href="/trust"
                className="nav-link hidden sm:inline-flex"
                data-active={isActive("/trust") ? "true" : "false"}
              >
                Standing
              </Link>
              <Link
                href="/profile"
                className="nav-link"
                data-active={isActive("/profile") ? "true" : "false"}
              >
                {name}
              </Link>
            </>
          ) : null}
        </div>
      </div>

      {configured && onboarded ? (
        <nav
          className="mt-3 -mx-1 flex gap-0.5 overflow-x-auto"
          aria-label="Primary"
        >
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-link shrink-0"
              data-active={isActive(item.href) ? "true" : "false"}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
