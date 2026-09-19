"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Sparkles, Users } from "lucide-react";
import { CampusShell } from "@/components/campus/CampusShell";
import { PostCard } from "@/components/campus/PostCard";
import { Button } from "@/components/ui/Button";
import { useIdentity } from "@/context/IdentityContext";
import {
  createCircleFromPost,
  createPlanFromPost,
  kindLabel,
  listCampusPosts,
  listMyCommunities,
  reportPost,
  setVote,
  sortPosts,
  syncMyCommunities,
  toggleSave,
  type CommunityWithMembership,
  type FeedSort,
  type PostWithMeta,
} from "@/lib/campus/api";

type HomeTab = "home" | "looking" | "plans";

export default function CampusHomePage() {
  const identity = useIdentity();
  const profile = identity.profile;
  const [communities, setCommunities] = useState<CommunityWithMembership[]>([]);
  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [looking, setLooking] = useState<PostWithMeta[]>([]);
  const [plans, setPlans] = useState<PostWithMeta[]>([]);
  const [sort, setSort] = useState<FeedSort>("hot");
  const [tab, setTab] = useState<HomeTab>("home");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    await syncMyCommunities();
    const mine = await listMyCommunities(profile.id);
    setCommunities(mine.data);
    const joinedIds = mine.data.map((c) => c.id);

    const [feed, lookingRes, plansRes] = await Promise.all([
      joinedIds.length
        ? listCampusPosts({
            profileId: profile.id,
            communityIds: joinedIds,
            sort: "hot",
            limit: 40,
          })
        : listCampusPosts({ profileId: profile.id, sort: "hot", limit: 40 }),
      listCampusPosts({
        profileId: profile.id,
        lookingForPeople: true,
        sort: "new",
        limit: 12,
      }),
      listCampusPosts({
        profileId: profile.id,
        planIdeas: true,
        sort: "new",
        limit: 12,
      }),
    ]);
    setPosts(feed.data);
    setLooking(lookingRes.data);
    setPlans(plansRes.data);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) void load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const feedSource = tab === "looking" ? looking : tab === "plans" ? plans : posts;
  const sorted = useMemo(() => sortPosts(feedSource, sort), [feedSource, sort]);

  const featured = useMemo(() => {
    return {
      major: communities.find((c) => c.kind === "major"),
      residence: communities.find((c) => c.kind === "residence"),
      campus: communities.find((c) => c.kind === "campus"),
      year: communities.find((c) => c.kind === "year"),
    };
  }, [communities]);

  const refreshAll = async () => {
    await load();
  };

  if (!identity.ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#dae0e6] text-slate-500">
        Loading campus…
      </main>
    );
  }

  if (!profile?.onboarding_completed_at) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Finish onboarding first</h1>
        <Link href="/onboarding" className="mt-6 inline-block text-[#00B84D]">
          Continue onboarding →
        </Link>
      </main>
    );
  }

  const firstName = profile.first_name ?? "there";
  const uni = identity.university?.abbreviation ?? "Campus";

  return (
    <CampusShell
      communities={communities}
      rightRail={
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="h-10 bg-gradient-to-r from-[#00B84D] to-teal-600" />
            <div className="p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Personalized for you
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Hey {firstName}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Home shows posts from communities you belong to at {uni}.
              </p>
              <div className="mt-3 space-y-2">
                {featured.major ? (
                  <Shortcut
                    href={`/campus/c/${featured.major.slug}`}
                    label={featured.major.name}
                    hint="Major"
                  />
                ) : null}
                {featured.residence ? (
                  <Shortcut
                    href={`/campus/c/${featured.residence.slug}`}
                    label={featured.residence.name}
                    hint="Near you"
                  />
                ) : null}
                {featured.year ? (
                  <Shortcut
                    href={`/campus/c/${featured.year.slug}`}
                    label={featured.year.name}
                    hint="Year"
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Happening soon
            </p>
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setTab("looking");
              }}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
            >
              <Users className="h-4 w-4 text-violet-600" />
              Looking for people · {looking.length}
            </Link>
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setTab("plans");
              }}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
            >
              <Sparkles className="h-4 w-4 text-orange-500" />
              Plans forming · {plans.length}
            </Link>
          </div>
        </div>
      }
    >
      <div className="space-y-3 pb-20 lg:pb-4">
        {/* Feed header */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Home</h1>
              <p className="text-sm text-slate-500">
                Your personalized {uni} feed
              </p>
            </div>
            <Link href={featured.campus ? `/campus/c/${featured.campus.slug}` : "/campus/groups/new"}>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Create post
              </Button>
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap gap-1 border-t border-slate-100 pt-3">
            {(
              [
                ["home", "Home"],
                ["looking", "Looking for people"],
                ["plans", "Plans forming"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  tab === id
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
            <div className="ml-auto flex gap-1">
              {(["hot", "new", "top"] as FeedSort[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSort(s)}
                  className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                    sort === s
                      ? "bg-[#00B84D]/15 text-[#00B84D]"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {message ? (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </p>
        ) : null}

        {/* Mobile shortcuts */}
        <div className="flex gap-2 overflow-x-auto lg:hidden">
          {communities
            .filter((c) => ["campus", "major", "residence", "year"].includes(c.kind))
            .map((c) => (
              <Link
                key={c.id}
                href={`/campus/c/${c.slug}`}
                className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
              >
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  {kindLabel(c.kind)}
                </p>
                <p className="text-sm font-semibold text-slate-900">{c.name}</p>
              </Link>
            ))}
        </div>

        {loading ? (
          <p className="py-10 text-center text-slate-500">Loading your feed…</p>
        ) : sorted.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="font-semibold text-slate-800">Nothing here yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Open a community and start a post — classmates will see it on their Home.
            </p>
            {featured.major ? (
              <Link href={`/campus/c/${featured.major.slug}`} className="mt-4 inline-block">
                <Button size="sm">Open c/{featured.major.slug}</Button>
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onVote={async (id, next) => {
                  await setVote(id, profile.id, next);
                  await refreshAll();
                }}
                onSave={async (id, saved) => {
                  await toggleSave(id, profile.id, saved);
                  await refreshAll();
                }}
                onReport={async (id) => {
                  await reportPost({
                    reporterId: profile.id,
                    postId: id,
                    reason: "Reported from campus home",
                  });
                  setMessage("Report submitted.");
                }}
                onStartPlan={async (p) => {
                  const res = await createPlanFromPost(p.id, p.title ?? undefined);
                  setMessage(res.error ?? "Plan created from this post.");
                  await refreshAll();
                }}
                onCreateCircle={async (p) => {
                  const res = await createCircleFromPost(p.id, p.title ?? undefined);
                  setMessage(res.error ?? "Circle created from this post.");
                  await refreshAll();
                }}
              />
            ))}
          </div>
        )}
      </div>
    </CampusShell>
  );
}

function Shortcut({
  href,
  label,
  hint,
}: {
  href: string;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50"
    >
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <span className="text-[11px] font-bold uppercase text-slate-400">{hint}</span>
    </Link>
  );
}
