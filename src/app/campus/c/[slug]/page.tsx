"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PostCard } from "@/components/campus/PostCard";
import { CampusShell } from "@/components/campus/CampusShell";
import { Button } from "@/components/ui/Button";
import { useIdentity } from "@/context/IdentityContext";
import {
  communityAccent,
  createCircleFromPost,
  createPlanFromPost,
  createPost,
  getCommunityBySlug,
  isMember,
  joinCommunity,
  kindLabel,
  leaveCommunity,
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
import type { Community, PostIntent } from "@/lib/supabase/database.types";

const CATEGORIES = [
  "Hangout",
  "Study",
  "Sports",
  "Events",
  "Projects",
  "Food",
  "Other",
];

export default function CommunityPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const identity = useIdentity();
  const profile = identity.profile;

  const [community, setCommunity] = useState<Community | null>(null);
  const [communities, setCommunities] = useState<CommunityWithMembership[]>([]);
  const [member, setMember] = useState(false);
  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [sort, setSort] = useState<FeedSort>("hot");
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [intent, setIntent] = useState<PostIntent | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile || !slug) return;
    await syncMyCommunities();
    const mine = await listMyCommunities(profile.id);
    setCommunities(mine.data);

    const { data: c, error: cErr } = await getCommunityBySlug(slug);
    if (cErr || !c) {
      setError(cErr ?? "Community not found");
      return;
    }
    setCommunity(c);
    const joined = await isMember(c.id, profile.id);
    setMember(joined);
    const feed = await listCampusPosts({
      profileId: profile.id,
      communityId: c.id,
      limit: 50,
    });
    setPosts(feed.data);
  }, [profile, slug]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) void load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const sorted = useMemo(() => sortPosts(posts, sort), [posts, sort]);

  if (!identity.ready || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-slate-500">
        Loading…
      </main>
    );
  }

  if (!community) {
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <p className="text-slate-600">{error ?? "Loading community…"}</p>
        <Link href="/campus" className="mt-4 inline-block text-[var(--brand)]">
          ← Back to Home
        </Link>
      </main>
    );
  }

  const accent = communityAccent(community.kind);
  const handle = `c/${community.slug}`;

  return (
    <CampusShell
      communities={communities}
      rightRail={
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="h-12" style={{ background: accent }} />
          <div className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {kindLabel(community.kind)} community
            </p>
            <h2 className="mt-1 text-lg font-bold">{community.name}</h2>
            {community.description ? (
              <p className="mt-2 text-sm text-slate-600">{community.description}</p>
            ) : null}
            {community.rules ? (
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                <p className="font-bold text-slate-800">Rules</p>
                <p className="mt-1 whitespace-pre-wrap">{community.rules}</p>
              </div>
            ) : null}
          </div>
        </div>
      }
    >
      <div className="space-y-3 pb-20 lg:pb-4">
        {/* Subreddit-style banner */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="h-16 sm:h-20" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}cc)` }} />
          <div className="relative px-4 pb-4 pt-0">
            <div
              className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white text-xl font-bold text-white shadow"
              style={{ background: accent }}
            >
              {community.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{community.name}</h1>
                <p className="text-sm font-semibold text-slate-500">{handle}</p>
              </div>
              <div className="flex gap-2">
                {member ? (
                  !community.is_auto ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        await leaveCommunity(community.id, profile.id);
                        setMember(false);
                      }}
                    >
                      Joined
                    </Button>
                  ) : (
                    <span className="rounded-full bg-[var(--brand-soft)] px-3 py-2 text-xs font-bold text-[var(--brand)]">
                      Auto-joined
                    </span>
                  )
                ) : (
                  <Button
                    size="sm"
                    onClick={async () => {
                      const res = await joinCommunity(community.id, profile.id);
                      if (res.error) setError(res.error);
                      else await load();
                    }}
                  >
                    Join
                  </Button>
                )}
                {member ? (
                  <Button size="sm" variant="secondary" onClick={() => setComposerOpen(true)}>
                    Create Post
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {info ? (
          <p className="rounded-xl border border-[var(--brand-soft)] bg-[var(--brand-soft)] px-4 py-3 text-sm text-[var(--brand-ink)]">
            {info}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
            {error}
          </p>
        ) : null}

        {/* Composer */}
        {member && composerOpen ? (
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-slate-800">
              Create a post in {handle}
            </p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Text"
              rows={4}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Flair</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={intent}
                onChange={(e) => setIntent(e.target.value as PostIntent | "")}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Discussion</option>
                <option value="looking_for_people">Looking for people</option>
                <option value="plan_idea">Plan idea</option>
              </select>
              <Button
                size="sm"
                disabled={busy || body.trim().length < 3 || !identity.university}
                onClick={async () => {
                  if (!identity.university) return;
                  setBusy(true);
                  setError(null);
                  const res = await createPost({
                    authorId: profile.id,
                    universityId: identity.university.id,
                    communityId: community.id,
                    title,
                    body,
                    category: category || undefined,
                    intent: intent || null,
                  });
                  setBusy(false);
                  if (res.error) {
                    setError(res.error);
                    return;
                  }
                  setTitle("");
                  setBody("");
                  setCategory("");
                  setIntent("");
                  setComposerOpen(false);
                  await load();
                }}
              >
                Post
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setComposerOpen(false)}>
                Cancel
              </Button>
            </div>
          </section>
        ) : null}

        {/* Sort tabs */}
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
          {(["hot", "new", "top"] as FeedSort[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              className={`rounded-lg px-4 py-2 text-sm font-bold capitalize ${
                sort === s
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {sorted.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onVote={async (id, next) => {
                await setVote(id, profile.id, next);
                await load();
              }}
              onSave={async (id, saved) => {
                await toggleSave(id, profile.id, saved);
                await load();
              }}
              onReport={async (id) => {
                await reportPost({
                  reporterId: profile.id,
                  postId: id,
                  reason: "Reported from community feed",
                });
                setInfo("Report submitted.");
              }}
              onStartPlan={async (p) => {
                const res = await createPlanFromPost(p.id);
                setInfo(res.error ?? "Plan created.");
                await load();
              }}
              onCreateCircle={async (p) => {
                const res = await createCircleFromPost(p.id);
                setInfo(res.error ?? "Circle created.");
                await load();
              }}
            />
          ))}
          {sorted.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="font-semibold text-slate-800">No posts in {handle} yet</p>
              {member ? (
                <button
                  type="button"
                  onClick={() => setComposerOpen(true)}
                  className="mt-3 text-sm font-semibold text-[var(--brand)]"
                >
                  Be the first to post
                </button>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Join to start posting.</p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </CampusShell>
  );
}
