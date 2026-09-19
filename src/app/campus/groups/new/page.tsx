"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CampusShell } from "@/components/campus/CampusShell";
import { Button } from "@/components/ui/Button";
import { useIdentity } from "@/context/IdentityContext";
import {
  createCampusGroup,
  listMyCommunities,
  syncMyCommunities,
  type CommunityWithMembership,
} from "@/lib/campus/api";
import type { YearLevel } from "@/lib/supabase/database.types";

export default function NewGroupPage() {
  const identity = useIdentity();
  const router = useRouter();
  const [communities, setCommunities] = useState<CommunityWithMembership[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [discoverable, setDiscoverable] = useState(true);
  const [memberLimit, setMemberLimit] = useState("");
  const [year, setYear] = useState<YearLevel | "">("");
  const [majorId, setMajorId] = useState("");
  const [hallId, setHallId] = useState("");
  const [interestId, setInterestId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (!identity.profile) return;
      await syncMyCommunities();
      const mine = await listMyCommunities(identity.profile.id);
      if (!cancelled) setCommunities(mine.data);
    });
    return () => {
      cancelled = true;
    };
  }, [identity.profile]);

  if (!identity.ready || !identity.profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#dae0e6] text-slate-500">
        Loading…
      </main>
    );
  }

  return (
    <CampusShell communities={communities}>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm pb-20 lg:pb-5">
        <h1 className="text-2xl font-bold text-slate-900">Create a community</h1>
        <p className="mt-2 text-sm text-slate-600">
          Public groups for crews like runners, study partners, or pickup soccer —
          still campus-scoped.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            const res = await createCampusGroup({
              name,
              description,
              rules,
              isDiscoverable: discoverable,
              memberLimit: memberLimit ? Number(memberLimit) : null,
              interestId: interestId || null,
              constraintYear: year || null,
              constraintMajorId: majorId || null,
              constraintResidenceHallId: hallId || null,
            });
            setBusy(false);
            if (res.error || !res.data) {
              setError(res.error ?? "Could not create group");
              return;
            }
            const { createClient } = await import("@/lib/supabase/client");
            const { data: community } = await createClient()
              .from("communities")
              .select("slug")
              .eq("id", res.data)
              .maybeSingle();
            if (community?.slug) router.push(`/campus/c/${community.slug}`);
            else router.push("/campus");
          }}
        >
          <Field label="Name">
            <input
              required
              minLength={3}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Jester Runners"
            />
          </Field>
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Morning runs around the mall, no pace judgment."
            />
          </Field>
          <Field label="Rules (optional)">
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={discoverable}
              onChange={(e) => setDiscoverable(e.target.checked)}
            />
            Discoverable on campus
          </label>
          <Field label="Member limit (optional)">
            <input
              type="number"
              min={2}
              value={memberLimit}
              onChange={(e) => setMemberLimit(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </Field>
          <Field label="Interest (optional)">
            <select
              value={interestId}
              onChange={(e) => setInterestId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">None</option>
              {identity.interests.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Year constraint (optional)">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value as YearLevel | "")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">Any year</option>
              {(
                [
                  "Freshman",
                  "Sophomore",
                  "Junior",
                  "Senior",
                  "Graduate",
                ] as YearLevel[]
              ).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Major constraint (optional)">
            <select
              value={majorId}
              onChange={(e) => setMajorId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">Any major</option>
              {identity.majors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Residence constraint (optional)">
            <select
              value={hallId}
              onChange={(e) => setHallId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">Any residence</option>
              {identity.halls.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </Field>

          {error ? <p className="text-sm text-orange-700">{error}</p> : null}

          <Button type="submit" fullWidth disabled={busy}>
            Create community
          </Button>
        </form>
      </div>
    </CampusShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}
