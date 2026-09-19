"use client";

import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPlanWhen } from "@/lib/hangouts/availability";
import { rsvpCounts } from "@/lib/hangouts/momentum";
import type { HangoutActivity, HangoutRsvp } from "@/lib/hangouts/types";

export function PlanCard({
  activity,
  memberCount,
  profileId,
  emphasize,
  onRsvp,
  onComplete,
}: {
  activity: HangoutActivity;
  memberCount: number;
  profileId: string | null;
  emphasize?: boolean;
  onRsvp: (status: HangoutRsvp) => void;
  onComplete?: () => void;
}) {
  const mine = activity.rsvps.find((r) => r.profile_id === profileId)?.status ?? "pending";
  const { going, total } = rsvpCounts(activity.rsvps, memberCount);
  const isMission = activity.mood === "first_mission";

  return (
    <section
      className={
        emphasize
          ? "overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl"
          : "card-surface p-5"
      }
    >
      <p
        className={`text-xs font-semibold uppercase tracking-wider ${
          emphasize ? "text-teal-300" : "text-teal-700"
        }`}
      >
        {isMission ? "First Mission" : activity.is_spontaneous ? "Right now" : "Plan"}
      </p>
      <h3 className="font-display mt-2 text-2xl font-bold">
        {activity.emoji} {activity.title}
      </h3>
      <p className={emphasize ? "mt-1 text-teal-100/90" : "mt-1 text-slate-600"}>
        {formatPlanWhen(activity.starts_at)}
        {activity.duration_minutes ? ` · ${activity.duration_minutes} min` : ""}
      </p>
      <p
        className={`mt-1 flex items-center gap-1.5 text-sm ${
          emphasize ? "text-slate-300" : "text-slate-500"
        }`}
      >
        <MapPin className="h-4 w-4" />
        {activity.location_label || "On campus"}
      </p>
      {activity.reason ? (
        <p className={`mt-3 text-sm ${emphasize ? "text-slate-300" : "text-slate-600"}`}>
          {activity.reason}
        </p>
      ) : null}
      <div className="mt-4 flex items-center justify-between text-sm">
        <p className={emphasize ? "text-teal-100" : "font-medium text-slate-700"}>
          {going} / {total} going
        </p>
        {mine === "in" && onComplete && activity.status === "upcoming" ? (
          <Button size="sm" variant={emphasize ? "secondary" : "secondary"} onClick={onComplete}>
            Mark done
          </Button>
        ) : null}
      </div>
      {activity.status === "upcoming" ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant={mine === "in" ? "primary" : "secondary"}
            className={emphasize && mine !== "in" ? "!bg-white/10 !text-white !border-white/20" : ""}
            disabled={mine === "in"}
            onClick={() => onRsvp("in")}
          >
            {mine === "in" ? "You're in" : "I'm In"}
          </Button>
          <Button
            size="sm"
            variant={mine === "maybe" ? "primary" : "secondary"}
            className={emphasize && mine !== "maybe" ? "!bg-white/10 !text-white !border-white/20" : ""}
            disabled={mine === "maybe"}
            onClick={() => onRsvp("maybe")}
          >
            Maybe
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className={emphasize ? "!bg-white/10 !text-white !border-white/20" : ""}
            disabled={mine === "cant"}
            onClick={() => onRsvp("cant")}
          >
            Can&apos;t
          </Button>
        </div>
      ) : null}
    </section>
  );
}
