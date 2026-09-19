"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { useIdentity } from "@/context/IdentityContext";
import { useRealCircle } from "@/context/RealCircleContext";
import { createClient } from "@/lib/supabase/client";
import { YEAR_LEVELS } from "@/lib/identity/catalog";
import { useEffect } from "react";

interface DirectoryPerson {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  year: string | null;
  major_id: string | null;
  residence_hall_id: string | null;
  bio: string | null;
  university_id: string | null;
}

function avatarFallback(name: string) {
  const initial = (name || "C")[0].toUpperCase();
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="#0d9488"/><text x="48" y="56" text-anchor="middle" fill="white" font-family="system-ui" font-size="32" font-weight="700">${initial}</text></svg>`
  )}`;
}

export default function PeoplePage() {
  const identity = useIdentity();
  const real = useRealCircle();
  const [people, setPeople] = useState<DirectoryPerson[]>([]);
  const [interestMap, setInterestMap] = useState<Record<string, string[]>>({});
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [majorId, setMajorId] = useState("");
  const [hallId, setHallId] = useState("");
  const [interestId, setInterestId] = useState("");
  const [loading, setLoading] = useState(true);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!identity.ready || !identity.profile?.university_id) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const uni = identity.profile!.university_id!;

      const [{ data: directory }, { data: interests }] = await Promise.all([
        supabase
          .from("student_directory")
          .select(
            "id, first_name, last_name, avatar_url, year, major_id, residence_hall_id, bio, university_id"
          )
          .eq("university_id", uni),
        supabase.from("user_interests").select("user_id, interest_id"),
      ]);

      if (cancelled) return;

      const rows = (directory ?? [])
        .filter((p) => Boolean(p.id))
        .map((p) => ({
          id: p.id as string,
          first_name: p.first_name,
          last_name: p.last_name,
          avatar_url: p.avatar_url,
          year: p.year,
          major_id: p.major_id,
          residence_hall_id: p.residence_hall_id,
          bio: p.bio,
          university_id: p.university_id,
        }));
      setPeople(rows);

      const map: Record<string, string[]> = {};
      for (const row of interests ?? []) {
        (map[row.user_id] ??= []).push(row.interest_id);
      }
      setInterestMap(map);
      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
    // identity.profile object identity changes often; university_id is the load key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity.ready, identity.profile?.university_id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people.filter((p) => {
      if (p.id === identity.profile?.id) return false;
      if (year && p.year !== year) return false;
      if (majorId && p.major_id !== majorId) return false;
      if (hallId && p.residence_hall_id !== hallId) return false;
      if (interestId && !(interestMap[p.id] ?? []).includes(interestId)) return false;
      if (q) {
        const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.toLowerCase();
        if (!name.includes(q)) return false;
      }
      return true;
    });
  }, [people, year, majorId, hallId, interestId, interestMap, query, identity.profile?.id]);

  const majorName = (id: string | null) =>
    identity.majors.find((m) => m.id === id)?.name ?? "Major TBD";
  const hallName = (id: string | null) =>
    identity.halls.find((h) => h.id === id)?.name ?? "On campus";

  const invite = async (id: string) => {
    setInviteMsg(null);
    const { error, circleId } = await real.inviteStudent(id);
    if (error) setInviteMsg(error);
    else setInviteMsg(`Invite sent. Circle ${circleId?.slice(0, 8)}…`);
  };

  if (!identity.ready) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-500">
        Loading campus directory...
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-6 sm:px-8">
      <AppHeader />
      <h1 className="font-display text-3xl font-bold">People on campus</h1>
      <p className="mt-2 text-slate-500">
        Discover students at your university. No swiping — just filters and friendly cards.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[var(--brand)]"
        />
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
        >
          <option value="">Any year</option>
          {YEAR_LEVELS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          value={majorId}
          onChange={(e) => setMajorId(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
        >
          <option value="">Any major</option>
          {identity.majors.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select
          value={hallId}
          onChange={(e) => setHallId(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
        >
          <option value="">Any residence</option>
          {identity.halls.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
        <select
          value={interestId}
          onChange={(e) => setInterestId(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:col-span-2"
        >
          <option value="">Any interest</option>
          {identity.interests.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </div>

      {inviteMsg ? <p className="mt-4 text-sm text-[var(--brand-ink)]">{inviteMsg}</p> : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-500">No students match those filters yet.</p>
        ) : (
          filtered.map((p) => {
            const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "Student";
            const shared = (interestMap[p.id] ?? []).filter((id) =>
              identity.selectedInterestIds.includes(id)
            );
            return (
              <article key={p.id} className="card-surface flex flex-col gap-3 p-5">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.avatar_url || avatarFallback(name)}
                    alt=""
                    className="h-14 w-14 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="font-semibold text-slate-900">{name}</h2>
                    <p className="text-sm text-slate-500">
                      {[p.year, majorName(p.major_id)].filter(Boolean).join(" · ")}
                    </p>
                    <p className="text-xs text-slate-400">{hallName(p.residence_hall_id)}</p>
                  </div>
                </div>
                {shared.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {shared.slice(0, 4).map((id) => {
                      const label = identity.interests.find((i) => i.id === id)?.name ?? "Interest";
                      return <Chip key={id} label={label} selected />;
                    })}
                  </div>
                ) : null}
                <div className="mt-auto flex gap-2">
                  <Link href={`/people/${p.id}`} className="flex-1">
                    <Button variant="secondary" fullWidth>
                      View profile
                    </Button>
                  </Link>
                  <Button onClick={() => void invite(p.id)}>Invite</Button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </main>
  );
}
