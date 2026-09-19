"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { useIdentity } from "@/context/IdentityContext";
import { useRealCircle } from "@/context/RealCircleContext";
import { createClient } from "@/lib/supabase/client";

interface PublicProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  year: string | null;
  major_id: string | null;
  residence_hall_id: string | null;
  hometown: string | null;
  bio: string | null;
  university_id: string | null;
}

export default function PublicStudentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const identity = useIdentity();
  const real = useRealCircle();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [interestIds, setInterestIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const id = params.id;
    if (!id || !identity.ready) return;
    let cancelled = false;

    const load = async () => {
      const supabase = createClient();
      const { data, error: dirError } = await supabase
        .from("student_directory")
        .select(
          "id, first_name, last_name, avatar_url, year, major_id, residence_hall_id, hometown, bio, university_id"
        )
        .eq("id", id)
        .maybeSingle();

      if (cancelled) return;
      if (dirError || !data?.id) {
        setError("That student isn&apos;t visible in the campus directory.");
        return;
      }
      if (
        identity.profile?.university_id &&
        data.university_id &&
        data.university_id !== identity.profile.university_id
      ) {
        setError("Students from other universities stay on their own campus.");
        return;
      }

      setProfile(data as PublicProfile);
      const { data: interests } = await supabase
        .from("user_interests")
        .select("interest_id")
        .eq("user_id", id);
      if (!cancelled) setInterestIds((interests ?? []).map((r) => r.interest_id));
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [params.id, identity.ready, identity.profile?.university_id]);

  if (error) {
    return (
      <main className="mx-auto max-w-xl px-5 py-10 text-center">
        <p className="text-slate-600">{error.replace("&apos;", "'")}</p>
        <Button className="mt-6" onClick={() => router.push("/people")}>
          Back to people
        </Button>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-500">
        Loading profile...
      </main>
    );
  }

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Student";
  const major = identity.majors.find((m) => m.id === profile.major_id)?.name;
  const hall = identity.halls.find((h) => h.id === profile.residence_hall_id)?.name;
  const shared = interestIds.filter((id) => identity.selectedInterestIds.includes(id));

  return (
    <main className="mx-auto max-w-2xl px-5 py-6 sm:px-8">
      <AppHeader />
      <div className="card-surface p-6">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              profile.avatar_url ||
              `data:image/svg+xml;utf8,${encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="#0d9488"/><text x="48" y="56" text-anchor="middle" fill="white" font-size="32" font-weight="700">${(profile.first_name || "C")[0]}</text></svg>`
              )}`
            }
            alt=""
            className="h-20 w-20 rounded-full object-cover"
          />
          <div>
            <h1 className="font-display text-3xl font-bold">{name}</h1>
            <p className="text-slate-500">
              {[profile.year, major].filter(Boolean).join(" · ")}
            </p>
            {hall ? <p className="text-sm text-slate-400">{hall}</p> : null}
            {profile.hometown ? (
              <p className="text-sm text-slate-400">From {profile.hometown}</p>
            ) : null}
          </div>
        </div>

        {profile.bio ? <p className="mt-5 text-slate-700">{profile.bio}</p> : null}

        <h2 className="mt-6 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Interests
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {interestIds.map((id) => {
            const label = identity.interests.find((i) => i.id === id)?.name ?? "Interest";
            return <Chip key={id} label={label} selected={shared.includes(id)} />;
          })}
        </div>

        {shared.length ? (
          <p className="mt-4 text-sm text-[var(--brand-ink)]">
            You share {shared.length} interest{shared.length === 1 ? "" : "s"}.
          </p>
        ) : null}

        {message ? <p className="mt-4 text-sm text-[var(--brand-ink)]">{message}</p> : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={async () => {
              const { error: inviteError } = await real.inviteStudent(profile.id);
              setMessage(inviteError ?? "Invite sent — they’ll show as invited in your Circle.");
            }}
          >
            Invite to Circle
          </Button>
          <Link href="/people">
            <Button variant="secondary">Back</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
