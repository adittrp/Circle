"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { HANGOUT_MOODS, type HangoutMood } from "@/lib/hangouts/types";
import type { CampusLocation } from "@/lib/supabase/database.types";

export function CreatePlanModal({
  open,
  onClose,
  locations,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  locations: CampusLocation[];
  onCreate: (input: {
    title: string;
    category: HangoutMood;
    description: string;
    locationId: string | null;
    locationLabel: string;
    startsAt: string;
    durationMinutes: number;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<HangoutMood>("Food");
  const [description, setDescription] = useState("");
  const [locationId, setLocationId] = useState("");
  const [when, setWhen] = useState("");
  const [duration, setDuration] = useState("75");
  const [saving, setSaving] = useState(false);

  const sorted = useMemo(
    () =>
      [...locations].sort((a, b) => {
        if (a.data_status !== b.data_status) return a.data_status === "verified" ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [locations]
  );

  return (
    <Modal open={open} onClose={onClose} title="Create a plan">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const loc = sorted.find((l) => l.id === locationId);
          if (!title.trim() || !when) return;
          setSaving(true);
          void onCreate({
            title: title.trim(),
            category,
            description: description.trim(),
            locationId: loc?.id ?? null,
            locationLabel: loc?.name ?? "On campus",
            startsAt: new Date(when).toISOString(),
            durationMinutes: Number(duration) || 60,
          })
            .then(() => {
              setTitle("");
              setDescription("");
              onClose();
            })
            .finally(() => setSaving(false));
        }}
      >
        <label className="block text-sm font-medium text-slate-700">
          Title
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Basketball Thursday"
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 font-normal"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as HangoutMood)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 font-normal"
          >
            {HANGOUT_MOODS.filter((m) => m.mood !== "Surprise Me").map((m) => (
              <option key={m.mood} value={m.mood}>
                {m.emoji} {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Date and time
          <input
            required
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 font-normal"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Location
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 font-normal"
          >
            <option value="">On campus</option>
            {sorted.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
                {loc.data_status === "needs_review" ? " (unverified)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Duration (minutes)
          <input
            type="number"
            min={15}
            step={15}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 font-normal"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details"
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 font-normal"
            rows={3}
          />
        </label>
        <Button type="submit" fullWidth disabled={saving}>
          Save plan
        </Button>
      </form>
    </Modal>
  );
}
