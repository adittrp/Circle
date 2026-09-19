"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Plus,
  Search,
  Sparkles,
  MapPin,
  Users,
} from "lucide-react";
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
    <div className="min-h-screen bg-[#dae0e6]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-3 sm:px-4">
          <Wordmark href="/campus" />
          <form
            action="/campus/search"
            className="mx-auto hidden max-w-xl flex-1 sm:block"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                placeholder={`Search ${uni?.abbreviation ?? "campus"}`}
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-[#00B84D] focus:bg-white"
              />
            </div>
          </form>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/campus/search"
              className="rounded-full p-2 text-slate-600 hover:bg-slate-100 sm:hidden"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Link>
            <Link
              href="/campus/groups/new"
              className="hidden items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:inline-flex"
            >
              <Plus className="h-4 w-4" />
              Create
            </Link>
            {profile ? <NotificationBell profileId={profile.id} /> : null}
            {profile?.first_name ? (
              <Link
                href="/profile"
                className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                {profile.first_name}
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-3 py-4 sm:px-4 lg:grid-cols-[240px_minmax(0,1fr)_280px]">
        {/* Left: communities like subreddits */}
        <aside className="hidden lg:block">
          <nav className="sticky top-[4.5rem] space-y-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
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
              <SideLink
                href="/home"
                active={false}
                icon={Users}
              >
                My Circle
              </SideLink>
            </div>

            <div>
              <p className="mb-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Your communities
              </p>
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
                    <p className="mb-1 mt-3 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Interests & groups
                    </p>
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
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-[#00B84D] hover:bg-green-50"
            >
              <Plus className="h-4 w-4" />
              Create a community
            </Link>
          </nav>
        </aside>

        {/* Main */}
        <div className="min-w-0">{children}</div>

        {/* Right rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-[4.5rem] space-y-4">
            {rightRail}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                About {uni?.abbreviation ?? "campus"}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Communities help you find people nearby. Posts can become real
                plans or Circles — not just scroll.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-[#00B84D]" />
                Built for real-world hangouts
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5 text-orange-500" />
                Hall-level only — never room numbers
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile community chips */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white px-2 py-2 lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Link
            href="/campus"
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
              pathname === "/campus"
                ? "bg-[#00B84D] text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            Home
          </Link>
          {communities.slice(0, 10).map((c) => (
            <Link
              key={c.id}
              href={`/campus/c/${c.slug}`}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                pathname === `/campus/c/${c.slug}`
                  ? "bg-[#00B84D] text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              c/{c.slug.replace(/^(major|residence|year|interest)-/, "")}
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
      className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold ${
        active
          ? "bg-green-50 text-[#00B84D]"
          : "text-slate-700 hover:bg-slate-50"
      }`}
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
  const short = community.slug.replace(
    /^(major|residence|year|interest)-/,
    ""
  );
  return (
    <Link
      href={`/campus/c/${community.slug}`}
      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
        active ? "bg-slate-100 font-semibold" : "hover:bg-slate-50"
      }`}
      title={`${kindLabel(community.kind)} · ${community.name}`}
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
        style={{ background: accent }}
      >
        {community.name.slice(0, 1).toUpperCase()}
      </span>
      <span className="truncate text-slate-800">c/{short}</span>
    </Link>
  );
}
