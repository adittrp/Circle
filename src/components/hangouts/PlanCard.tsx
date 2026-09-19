"use client";

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
          ? "rounded-[var(--radius-md)] border border-[var(--brand)] bg-[var(--brand-soft)] p-5"
          : "rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--bg-elevated)] p-5"
      }
    >
      <p className="text-caption font-semibold text-[var(--brand-ink)]">
        {isMission ? "First mission" : activity.is_spontaneous ? "Right now" : "Plan"}
      </p>
      <h3 className="text-section mt-2">
        <span aria-hidden>{activity.emoji} </span>
        {activity.title}
      </h3>
      <dl className="mt-3 space-y-1 text-sm text-[var(--ink-secondary)]">
        <div>
          <dt className="sr-only">When</dt>
          <dd>
            {formatPlanWhen(activity.starts_at)}
            {activity.duration_minutes ? ` · ${activity.duration_minutes} min` : ""}
          </dd>
        </div>
        <div>
          <dt className="sr-only">Where</dt>
          <dd>{activity.location_label || "On campus"}</dd>
        </div>
      </dl>
      {activity.reason ? (
        <p className="text-caption mt-3">{activity.reason}</p>
      ) : null}
      <div className="mt-4 flex items-center justify-between text-sm">
        <p className="font-medium text-[var(--ink-secondary)]">
          {going} of {total} going
        </p>
        {mine === "in" && onComplete && activity.status === "upcoming" ? (
          <Button size="sm" variant="quiet" onClick={onComplete}>
            Mark done
          </Button>
        ) : null}
      </div>
      {activity.status === "upcoming" ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {(
            [
              { status: "in" as const, label: mine === "in" ? "Going" : "Going" },
              { status: "maybe" as const, label: "Maybe" },
              { status: "cant" as const, label: "Can't" },
            ] as const
          ).map((opt) => (
            <Button
              key={opt.status}
              size="sm"
              variant={mine === opt.status ? "primary" : "secondary"}
              aria-pressed={mine === opt.status}
              onClick={() => onRsvp(opt.status)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
