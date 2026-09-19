"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { useIdentity } from "@/context/IdentityContext";
import { YEAR_LEVELS } from "@/lib/identity/catalog";
import {
  DEFAULT_VISIBILITY,
  type ProfileVisibility,
  type YearLevel,
} from "@/lib/supabase/database.types";

const fieldClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100";

export default function ProfilePage() {
  const router = useRouter();
  const identity = useIdentity();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    first_name: "",
    last_name: "",
    year: "" as YearLevel | "",
    hometown: "",
    bio: "",
  });
  const [seeded, setSeeded] = useState(false);

  const profile = identity.profile;
  const vis: ProfileVisibility = {
    ...DEFAULT_VISIBILITY,
    ...(profile?.visibility ?? {}),
  };

  useEffect(() => {
    if (!profile || seeded) return;
    const next = {
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
      year: (profile.year ?? "") as YearLevel | "",
      hometown: profile.hometown ?? "",
      bio: profile.bio ?? "",
    };
    queueMicrotask(() => {
      setDraft(next);
      setSeeded(true);
    });
  }, [profile, seeded]);

  if (!identity.ready) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-500">
        Loading profile...
      </main>
    );
  }

  const toggleVis = (key: keyof ProfileVisibility) => {
    void identity.saveProfile({
      visibility: { ...vis, [key]: !vis[key] },
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const { error: saveError } = await identity.saveProfile({
      first_name: draft.first_name.trim(),
      last_name: draft.last_name.trim() || null,
      year: draft.year || null,
      hometown: draft.hometown.trim() || null,
      bio: draft.bio.trim() || null,
    });
    setSaving(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    setSaved(true);
    router.push("/home");
  };

  return (
    <main className="mx-auto max-w-2xl px-5 py-6 sm:px-8">
      <AppHeader />
      <h1 className="font-display text-3xl font-bold">Your profile</h1>
      <p className="mt-1 text-slate-500">{identity.email}</p>

      <div className="mt-6 space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-600">First name</span>
          <input
            className={fieldClass}
            value={draft.first_name}
            onChange={(e) => setDraft((d) => ({ ...d, first_name: e.target.value }))}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-600">Last name</span>
          <input
            className={fieldClass}
            value={draft.last_name}
            onChange={(e) => setDraft((d) => ({ ...d, last_name: e.target.value }))}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-600">Year</span>
          <select
            className={fieldClass}
            value={draft.year}
            onChange={(e) =>
              setDraft((d) => ({ ...d, year: e.target.value as YearLevel }))
            }
          >
            {YEAR_LEVELS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-600">Hometown</span>
          <input
            className={fieldClass}
            value={draft.hometown}
            onChange={(e) => setDraft((d) => ({ ...d, hometown: e.target.value }))}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-600">Bio</span>
          <textarea
            className={`${fieldClass} min-h-24`}
            value={draft.bio}
            onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-600">Photo</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void identity.uploadAvatar(file);
            }}
          />
        </label>
      </div>

      <h2 className="font-display mt-10 text-xl font-bold">Visible to other students</h2>
      <p className="mb-3 mt-1 text-sm text-slate-500">
        First name is always shown. Email is never shown.
      </p>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["last_name", "Last name"],
            ["year", "Year"],
            ["major", "Major"],
            ["residence", "Residence"],
            ["hometown", "Hometown"],
            ["bio", "Bio"],
          ] as [keyof ProfileVisibility, string][]
        ).map(([key, label]) => (
          <Chip
            key={key}
            label={label}
            selected={vis[key]}
            onClick={() => toggleVis(key)}
          />
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-orange-700">{error}</p> : null}

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button disabled={saving} onClick={() => void save()}>
          {saving ? "Saving..." : "Save"}
        </Button>
        <form action="/auth/signout" method="post">
          <Button variant="secondary" type="submit">
            Sign out
          </Button>
        </form>
      </div>
      {saved ? <p className="mt-3 text-sm text-teal-700">Saved.</p> : null}
    </main>
  );
}
