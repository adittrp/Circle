"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { HangoutActivity } from "@/lib/hangouts/types";

const EMOJIS = ["😕", "😐", "🙂", "🔥"] as const;
const AGAIN = [
  { id: "yes", label: "Yes" },
  { id: "maybe", label: "Maybe" },
  { id: "no", label: "No" },
] as const;

export function FeedbackModal({
  activity,
  onClose,
  onSubmit,
}: {
  activity: HangoutActivity | null;
  onClose: () => void;
  onSubmit: (emoji: string, hangAgain: "yes" | "maybe" | "no") => void;
}) {
  const [emoji, setEmoji] = useState<string | null>(null);

  return (
    <Modal
      open={Boolean(activity)}
      onClose={onClose}
      title="How was it?"
    >
      {activity ? (
        <div>
          <p className="mb-4 text-slate-600">
            {activity.emoji} {activity.title}
          </p>
          <div className="mb-6 flex justify-between gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl ${
                  emoji === e ? "border-[var(--brand)] bg-[var(--brand-soft)]" : "border-slate-200 bg-white"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          <p className="mb-3 font-semibold">Do something like this again?</p>
          <div className="flex gap-2">
            {AGAIN.map((option) => (
              <Button
                key={option.id}
                variant="secondary"
                className="flex-1"
                disabled={!emoji}
                onClick={() => {
                  if (!emoji) return;
                  onSubmit(emoji, option.id);
                  setEmoji(null);
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
