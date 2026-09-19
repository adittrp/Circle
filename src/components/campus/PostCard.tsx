"use client";

import Link from "next/link";
import {
  Bookmark,
  Calendar,
  Flag,
  MessageCircle,
  ChevronUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { PostWithMeta } from "@/lib/campus/api";

function timeAgo(iso: string) {
  const mins = Math.max(
    1,
    Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  );
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

interface PostCardProps {
  post: PostWithMeta;
  onVote?: (postId: string, next: 1 | 0) => void;
  onSave?: (postId: string, currentlySaved: boolean) => void;
  onReport?: (postId: string) => void;
  onStartPlan?: (post: PostWithMeta) => void;
  onCreateCircle?: (post: PostWithMeta) => void;
  compact?: boolean;
}

export function PostCard({
  post,
  onVote,
  onSave,
  onReport,
  onStartPlan,
  onCreateCircle,
  compact,
}: PostCardProps) {
  const interested = post.my_vote === 1;
  const showPlan =
    post.intent === "plan_idea" ||
    /tonight|tomorrow|anyone want|hang|play|study|gym|dining/i.test(
      `${post.title ?? ""} ${post.body}`
    );
  const showCircle =
    post.intent === "looking_for_people" ||
    /looking for|study group|crew|semester|who wants/i.test(
      `${post.title ?? ""} ${post.body}`
    );

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300">
      <div className="flex">
        {/* Vote rail — Reddit-style */}
        <div className="flex w-11 shrink-0 flex-col items-center gap-0.5 bg-slate-50 py-3">
          <button
            type="button"
            aria-label={interested ? "Remove interest" : "Mark interested"}
            onClick={() => onVote?.(post.id, interested ? 0 : 1)}
            className={`rounded-md p-1 transition ${
              interested
                ? "text-[var(--brand)]"
                : "text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            }`}
          >
            <ChevronUp className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <span
            className={`text-xs font-bold tabular-nums ${
              interested ? "text-[var(--brand)]" : "text-slate-700"
            }`}
          >
            {post.vote_score}
          </span>
        </div>

        <div className="min-w-0 flex-1 px-3 py-3 sm:px-4">
          <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            {post.community_slug ? (
              <Link
                href={`/campus/c/${post.community_slug}`}
                className="font-bold text-slate-800 hover:underline"
              >
                c/{post.community_slug}
              </Link>
            ) : null}
            <span>·</span>
            <span>Posted by {post.author_name ?? "student"}</span>
            <span>·</span>
            <span>{timeAgo(post.created_at)}</span>
            {post.category ? (
              <>
                <span>·</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                  {post.category}
                </span>
              </>
            ) : null}
            {post.intent === "looking_for_people" ? (
              <span className="rounded-full bg-violet-50 px-2 py-0.5 font-medium text-violet-700">
                looking for people
              </span>
            ) : null}
            {post.intent === "plan_idea" ? (
              <span className="rounded-full bg-orange-50 px-2 py-0.5 font-medium text-orange-700">
                plan idea
              </span>
            ) : null}
          </div>

          <Link href={`/campus/post/${post.id}`} className="block">
            {post.title ? (
              <h3 className="text-[17px] font-semibold leading-snug text-slate-900">
                {post.title}
              </h3>
            ) : null}
            <p
              className={`mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700 ${
                compact ? "line-clamp-3" : ""
              }`}
            >
              {post.body}
            </p>
          </Link>

          <div className="mt-2.5 flex flex-wrap items-center gap-1">
            <Link
              href={`/campus/post/${post.id}`}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {post.comment_count} comments
            </Link>
            <button
              type="button"
              onClick={() => onSave?.(post.id, post.saved)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold hover:bg-slate-100 ${
                post.saved ? "text-orange-600" : "text-slate-500"
              }`}
            >
              <Bookmark className="h-3.5 w-3.5" />
              {post.saved ? "Saved" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => onReport?.(post.id)}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"
            >
              <Flag className="h-3.5 w-3.5" />
              Report
            </button>
          </div>

          {(showPlan || showCircle || post.suggested_activity_id || post.suggested_circle_id) ? (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              {showPlan && !post.suggested_activity_id ? (
                <Button size="sm" onClick={() => onStartPlan?.(post)}>
                  <Calendar className="h-4 w-4" />
                  Start a Plan
                </Button>
              ) : null}
              {showCircle && !post.suggested_circle_id ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onCreateCircle?.(post)}
                >
                  <Users className="h-4 w-4" />
                  Create a Circle
                </Button>
              ) : null}
              {post.suggested_activity_id ? (
                <span className="self-center text-xs font-semibold text-[var(--brand)]">
                  Plan started from this post
                </span>
              ) : null}
              {post.suggested_circle_id ? (
                <span className="self-center text-xs font-semibold text-[var(--brand)]">
                  Circle created from this post
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
