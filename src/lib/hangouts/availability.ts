import { WEEKDAYS } from "@/lib/identity/catalog";
import type { AvailabilityWindow } from "@/lib/supabase/database.types";
import type { AvailabilitySlot, HangoutMember, OverlapWindow } from "./types";

const WINDOW_LABEL: Record<AvailabilityWindow, string> = {
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
};

const WINDOW_HOUR: Record<AvailabilityWindow, number> = {
  morning: 10,
  afternoon: 14,
  evening: 19,
};

export function slotKey(slot: AvailabilitySlot) {
  return `${slot.weekday}:${slot.time_window}`;
}

export function weekdayLabel(weekday: number) {
  return WEEKDAYS.find((d) => d.id === weekday)?.label ?? "This week";
}

export function formatOverlapLabel(weekday: number, window: AvailabilityWindow) {
  return `${weekdayLabel(weekday)} ${WINDOW_LABEL[window]}`;
}

export function memberHasSlot(member: HangoutMember, slot: AvailabilitySlot) {
  return member.availability.some(
    (s) => s.weekday === slot.weekday && s.time_window === slot.time_window
  );
}

export function computeAvailabilityOverlap(members: HangoutMember[]): OverlapWindow[] {
  const total = Math.max(members.length, 1);
  const counts = new Map<string, OverlapWindow>();

  for (const member of members) {
    const seen = new Set<string>();
    for (const slot of member.availability) {
      const key = slotKey(slot);
      if (seen.has(key)) continue;
      seen.add(key);
      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, {
          weekday: slot.weekday,
          time_window: slot.time_window,
          count: 1,
          total,
          label: formatOverlapLabel(slot.weekday, slot.time_window),
        });
      }
    }
  }

  return [...counts.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    if (a.weekday !== b.weekday) return a.weekday - b.weekday;
    return a.time_window.localeCompare(b.time_window);
  });
}

export function bestOverlap(members: HangoutMember[]): OverlapWindow | null {
  return computeAvailabilityOverlap(members)[0] ?? null;
}

export function nextOccurrence(
  weekday: number,
  window: AvailabilityWindow,
  now = new Date(),
  earlyEvening = false
) {
  const result = new Date(now);
  const current = now.getDay();
  let delta = (weekday - current + 7) % 7;
  const hour = earlyEvening && window === "evening" ? 18 : WINDOW_HOUR[window];
  const minute = window === "evening" ? 30 : 0;
  result.setHours(hour, minute, 0, 0);
  if (delta === 0 && result.getTime() <= now.getTime() + 30 * 60 * 1000) {
    delta = 7;
  }
  result.setDate(result.getDate() + delta);
  return result;
}

export function spontaneousStart(now = new Date()) {
  return new Date(now.getTime() + 15 * 60 * 1000);
}

export function formatPlanWhen(iso: string | null) {
  if (!iso) return "Time TBD";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Time TBD";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
