"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CampusShell } from "@/components/campus/CampusShell";
import { PostCard } from "@/components/campus/PostCard";
import { Button } from "@/components/ui/Button";
import { useIdentity } from "@/context/IdentityContext";
import {
  addComment,
  createCircleFromPost,
  createPlanFromPost,
  getPost,
  listComments,
  listMyCommunities,
  reportPost,
  setVote,
  syncMyCommunities,
  toggleSave,
  type CommunityWithMembership,
  type PostWithMeta,
} from "@/lib/campus/api";

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const identity = useIdentity();
  const profile = identity.profile;
  const [post, setPost] = useState<PostWithMeta | null>(null);
  const [communities, setCommunities] = useState<CommunityWithMembership[]>([]);
  const [comments, setComments] = useState<
    Awaited<ReturnType<typeof listComments>>["data"]
  >([]);
  const [body, setBody] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile || !params.id) return;
    await syncMyCommunities();
    const mine = await listMyCommunities(profile.id);
    setCommunities(mine.data);
    const [postRes, commentsRes] = await Promise.all([
      getPost(params.id, profile.id),
      listComments(params.id),
    ]);
    if (postRes.error || !postRes.data) {
      setError(postRes.error ?? "Post not found");
      return;
    }
    setPost(postRes.data);
    setComments(commentsRes.data);
  }, [profile, params.id]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) void load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  if (!identity.ready || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-slate-500">
        Loading…
      </main>
    );
  }

  if (!post) {
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <p>{error ?? "Loading post…"}</p>
        <Link href="/campus" className="mt-4 inline-block text-[var(--brand)]">
          ← Home
        </Link>
      </main>
    );
  }

  return (
    <CampusShell communities={communities}>
      <div className="space-y-3 pb-20 lg:pb-4">
        {info ? (
          <p className="rounded-xl border border-[var(--brand-soft)] bg-[var(--brand-soft)] px-4 py-3 text-sm text-[var(--brand-ink)]">
            {info}
          </p>
        ) : null}

        <PostCard
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
              reason: "Reported from post detail",
            });
            setInfo("Report submitted.");
          }}
          onStartPlan={async (p) => {
            const res = await createPlanFromPost(p.id);
            setInfo(res.error ?? "Plan created and saved to Supabase.");
            await load();
          }}
          onCreateCircle={async (p) => {
            const res = await createCircleFromPost(p.id);
            setInfo(res.error ?? "Circle created and saved to Supabase.");
            await load();
          }}
        />

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Comments
          </h2>
          <div className="mt-3 space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="border-b border-slate-100 pb-3 last:border-0">
                <p className="text-xs font-bold text-slate-500">
                  {c.author_name ?? "Student"}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                  {c.body}
                </p>
              </div>
            ))}
            {comments.length === 0 ? (
              <p className="text-sm text-slate-500">No comments yet.</p>
            ) : null}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="Add a comment"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <div className="mt-2">
              <Button
                size="sm"
                disabled={body.trim().length < 1}
                onClick={async () => {
                  const res = await addComment({
                    postId: post.id,
                    authorId: profile.id,
                    body,
                  });
                  if (res.error) {
                    setError(res.error);
                    return;
                  }
                  setBody("");
                  await load();
                }}
              >
                Comment
              </Button>
            </div>
          </div>
        </section>
      </div>
    </CampusShell>
  );
}
