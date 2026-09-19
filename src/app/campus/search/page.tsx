"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { CampusShell } from "@/components/campus/CampusShell";
import { Button } from "@/components/ui/Button";
import { useIdentity } from "@/context/IdentityContext";
import {
  campusSearch,
  kindLabel,
  listMyCommunities,
  syncMyCommunities,
  type CommunityWithMembership,
} from "@/lib/campus/api";
import type { CommunityKind } from "@/lib/supabase/database.types";

type SearchResult = {
  people?: Array<{
    id: string;
    first_name: string | null;
    major_name?: string | null;
    residence_name?: string | null;
    year?: string | null;
  }>;
  communities?: Array<{
    id: string;
    name: string;
    slug: string;
    kind: CommunityKind;
    description: string | null;
  }>;
  circles?: Array<{
    id: string;
    title: string | null;
    stage: string;
    active_member_count: number;
  }>;
  posts?: Array<{
    id: string;
    title: string | null;
    body: string;
    vote_score: number;
  }>;
};

export default function CampusSearchPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-slate-500">
          Loading search…
        </main>
      }
    >
      <CampusSearchInner />
    </Suspense>
  );
}

function CampusSearchInner() {
  const identity = useIdentity();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [communities, setCommunities] = useState<CommunityWithMembership[]>([]);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) return;
    setBusy(true);
    setError(null);
    const res = await campusSearch(q.trim());
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setResult((res.data as SearchResult) ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (!identity.profile) return;
      await syncMyCommunities();
      const mine = await listMyCommunities(identity.profile.id);
      if (!cancelled) setCommunities(mine.data);
      if (initialQ.trim().length >= 2 && !cancelled) {
        await runSearch(initialQ);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [identity.profile, initialQ, runSearch]);

  if (!identity.ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-slate-500">
        Loading…
      </main>
    );
  }

  return (
    <CampusShell communities={communities}>
      <div className="space-y-4 pb-20 lg:pb-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Explore campus</h1>
          <p className="mt-1 text-sm text-slate-500">
            People, communities, Circles, and posts you can access.
          </p>
          <form
            className="mt-4 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              await runSearch(query);
            }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search communities, people, posts…"
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[var(--brand)] focus:bg-white"
              />
            </div>
            <Button type="submit" disabled={busy || query.trim().length < 2}>
              Search
            </Button>
          </form>
          {error ? <p className="mt-3 text-sm text-orange-700">{error}</p> : null}
        </div>

        {result ? (
          <div className="space-y-4">
            <ResultCard title="Communities">
              {(result.communities ?? []).length === 0 ? (
                <Empty />
              ) : (
                (result.communities ?? []).map((c) => (
                  <Link
                    key={c.id}
                    href={`/campus/c/${c.slug}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-bold text-white">
                      {c.name.slice(0, 1)}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">c/{c.slug}</p>
                      <p className="text-xs text-slate-500">
                        {kindLabel(c.kind)}
                        {c.description ? ` · ${c.description}` : ""}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </ResultCard>

            <ResultCard title="People">
              {(result.people ?? []).length === 0 ? (
                <Empty />
              ) : (
                (result.people ?? []).map((p) => (
                  <div key={p.id} className="rounded-lg px-2 py-2">
                    <p className="text-sm font-bold text-slate-900">
                      {p.first_name ?? "Student"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {[p.year, p.major_name, p.residence_name]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                ))
              )}
            </ResultCard>

            <ResultCard title="Posts">
              {(result.posts ?? []).length === 0 ? (
                <Empty />
              ) : (
                (result.posts ?? []).map((p) => (
                  <Link
                    key={p.id}
                    href={`/campus/post/${p.id}`}
                    className="block rounded-lg px-2 py-2 hover:bg-slate-50"
                  >
                    <p className="text-sm font-bold text-slate-900">
                      {p.title || p.body.slice(0, 80)}
                    </p>
                    <p className="line-clamp-2 text-xs text-slate-500">{p.body}</p>
                  </Link>
                ))
              )}
            </ResultCard>

            <ResultCard title="Your Circles">
              {(result.circles ?? []).length === 0 ? (
                <Empty />
              ) : (
                (result.circles ?? []).map((c) => (
                  <div key={c.id} className="rounded-lg px-2 py-2">
                    <p className="text-sm font-bold text-slate-900">
                      {c.title ?? "Your Circle"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {c.stage} · {c.active_member_count} members
                    </p>
                  </div>
                ))
              )}
            </ResultCard>
          </div>
        ) : null}
      </div>
    </CampusShell>
  );
}

function ResultCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <h2 className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        {title}
      </h2>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

function Empty() {
  return <p className="px-2 py-2 text-sm text-slate-500">No matches.</p>;
}
