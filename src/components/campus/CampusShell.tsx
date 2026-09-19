"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, Search, Users } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { NotificationBell } from "@/components/campus/NotificationBell";
import {
  communityAccent,
  kindLabel,
  type CommunityWithMembership,
} from "@/lib/campus/api";
import { useIdentity } from "@/context/IdentityContext";

export function CampusShell({
  communities,
  children,
  rightRail,
}: {
  communities: CommunityWithMembership[];
  children: React.ReactNode;
  rightRail?: React.ReactNode;
}) {
  const identity = useIdentity();
  const pathname = usePathname();
  const profile = identity.profile;
  const uni = identity.university;

  const primary = communities.filter((c) =>
    ["campus", "major", "residence", "year"].includes(c.kind)
  );
  const more = communities.filter(
    (c) => !["campus", "major", "residence", "year"].includes(c.kind)
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-16 lg:pb-0">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg-elevated)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-3 sm:px-4">
          <Wordmark href="/campus" size="sm" />
          <form
            action="/campus/search"
            className="mx-auto hidden max-w-xl flex-1 sm:block"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-faint)]" />
              <input
                name="q"
                placeholder={`Search ${uni?.abbreviation ?? "campus"}`}
                className="field-input rounded-full py-2 pl-9 pr-4 text-sm"
              />
            </div>
          </form>
          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href="/campus/search"
              className="rounded-[var(--radius-sm)] p-2 text-[var(--ink-muted)] hover:bg-[var(--bg-muted)] sm:hidden"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Link>
            <Link
              href="/campus/groups/new"
              className="nav-link hidden sm:inline-flex"
            >
              <Plus className="h-4 w-4" />
              Create
            </Link>
            {profile ? <NotificationBell profileId={profile.id} /> : null}
            {profile?.first_name ? (
              <Link href="/profile" className="nav-link">
                {profile.first_name}
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-3 py-5 sm:px-4 lg:grid-cols-[220px_minmax(0,1fr)_260px]">
        <aside className="hidden lg:block">
          <nav className="sticky top-[4.5rem] space-y-5">
            <div className="space-y-0.5">
              <SideLink href="/campus" active={pathname === "/campus"} icon={Home}>
                Home
              </SideLink>
              <SideLink
                href="/campus/search"
                active={pathname.startsWith("/campus/search")}
                icon={Search}
              >
                Explore
              </SideLink>
              <SideLink href="/circles" active={false} icon={Users}>
                Circles
              </SideLink>
            </div>

            <div>
              <p className="text-label mb-2 px-2">Your communities</p>
              <div className="max-h-[52vh] space-y-0.5 overflow-y-auto">
                {primary.map((c) => (
                  <CommunityLink
                    key={c.id}
                    community={c}
                    active={pathname === `/campus/c/${c.slug}`}
                  />
                ))}
                {more.length > 0 ? (
                  <>
                    <p className="text-label mb-2 mt-4 px-2">Groups</p>
                    {more.slice(0, 16).map((c) => (
                      <CommunityLink
                        key={c.id}
                        community={c}
                        active={pathname === `/campus/c/${c.slug}`}
                      />
                    ))}
                  </>
                ) : null}
              </div>
            </div>

            <Link
              href="/campus/groups/new"
              className="inline-flex items-center gap-2 px-2 text-sm font-semibold text-[var(--brand-ink)]"
            >
              <Plus className="h-4 w-4" />
              Create a group
            </Link>
          </nav>
        </aside>

        <div className="min-w-0">{children}</div>

        <aside className="hidden lg:block">
          <div className="sticky top-[4.5rem] space-y-4">
            {rightRail}
            <div className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
              <p className="text-label">About {uni?.abbreviation ?? "campus"}</p>
              <p className="text-body-secondary mt-2 text-sm">
                Communities help you find people nearby. Posts can become real
                plans or Circles — not just scroll.
              </p>
              <p className="text-caption mt-3">
                Residence communities are hall-level only — never room numbers.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--line)] bg-[var(--bg-elevated)] px-2 py-2 lg:hidden">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <Link
            href="/campus"
            className={`nav-link shrink-0 ${pathname === "/campus" ? "" : ""}`}
            data-active={pathname === "/campus" ? "true" : "false"}
          >
            Home
          </Link>
          {communities.slice(0, 8).map((c) => (
            <Link
              key={c.id}
              href={`/campus/c/${c.slug}`}
              className="nav-link shrink-0"
              data-active={pathname === `/campus/c/${c.slug}` ? "true" : "false"}
            >
              {c.name.length > 18 ? `${c.name.slice(0, 16)}…` : c.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function SideLink({
  href,
  active,
  icon: Icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="nav-link w-full justify-start"
      data-active={active ? "true" : "false"}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}

function CommunityLink({
  community,
  active,
}: {
  community: CommunityWithMembership;
  active: boolean;
}) {
  const accent = communityAccent(community.kind);
  return (
    <Link
      href={`/campus/c/${community.slug}`}
      className="nav-link w-full justify-start"
      data-active={active ? "true" : "false"}
      title={`${kindLabel(community.kind)} · ${community.name}`}
    >
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
        style={{ background: accent }}
        aria-hidden
      >
        {community.name.slice(0, 1).toUpperCase()}
      </span>
      <span className="truncate">{community.name}</span>
    </Link>
  );
}
