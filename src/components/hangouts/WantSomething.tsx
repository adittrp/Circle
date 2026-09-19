"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatPlanWhen } from "@/lib/hangouts/availability";
import { HANGOUT_MOODS, type CoordinatorSuggestion, type HangoutMood } from "@/lib/hangouts/types";

export function WantSomething({
  open,
  onClose,
  onSuggest,
  onStart,
}: {
  open: boolean;
  onClose: () => void;
  onSuggest: (mood: HangoutMood) => Promise<CoordinatorSuggestion | null>;
  onStart: (suggestion: CoordinatorSuggestion) => Promise<void>;
}) {
  const [checking, setChecking] = useState(false);
  const [draft, setDraft] = useState<CoordinatorSuggestion | null>(null);

  const pick = async (mood: HangoutMood) => {
    setChecking(true);
    setDraft(null);
    try {
      const suggestion = await onSuggest(mood);
      setDraft(suggestion);
    } finally {
      setChecking(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose();
        setDraft(null);
        setChecking(false);
      }}
      title="What are you feeling?"
    >
      {!draft && !checking ? (
        <div className="grid grid-cols-2 gap-2">
          {HANGOUT_MOODS.map((m) => (
            <button
              key={m.mood}
              type="button"
              onClick={() => void pick(m.mood)}
              className="rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-4 text-left transition-colors hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]"
            >
              <span className="text-xl" aria-hidden>
                {m.emoji}
              </span>
              <p className="mt-1.5 text-sm font-semibold">{m.label}</p>
            </button>
          ))}
        </div>
      ) : null}
      {checking ? (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="skeleton mb-4 h-10 w-10 rounded-full" />
          <p className="text-label">Checking schedules and campus spots…</p>
        </div>
      ) : null}
      {draft ? (
        <div>
          <p className="text-caption font-semibold text-[var(--brand-ink)]">{draft.reason}</p>
          <h4 className="text-section mt-2">
            <span aria-hidden>{draft.emoji} </span>
            {draft.title}
          </h4>
          <p className="mt-2 text-[var(--ink-secondary)]">{formatPlanWhen(draft.startTime)}</p>
          <p className="mt-1 text-caption">{draft.locationLabel}</p>
          <p className="text-body-secondary mt-3 text-sm">{draft.description}</p>
          <Button
            fullWidth
            className="mt-6"
            size="lg"
            onClick={() => {
              void onStart(draft).then(() => {
                setDraft(null);
                onClose();
              });
            }}
          >
            Create this plan
          </Button>
        </div>
      ) : null}
    </Modal>
  );
}
