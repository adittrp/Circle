"use client";

import { motion } from "framer-motion";
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
        <div className="grid grid-cols-2 gap-3">
          {HANGOUT_MOODS.map((m) => (
            <button
              key={m.mood}
              type="button"
              onClick={() => void pick(m.mood)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-left transition hover:border-teal-400 hover:bg-teal-50"
            >
              <span className="text-2xl">{m.emoji}</span>
              <p className="mt-2 font-semibold">{m.label}</p>
            </button>
          ))}
        </div>
      ) : null}
      {checking ? (
        <div className="flex flex-col items-center py-10 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            className="mb-4 h-10 w-10 rounded-full border-4 border-teal-200 border-t-teal-600"
          />
          <p className="font-medium text-slate-700">Checking schedules and campus spots...</p>
        </div>
      ) : null}
      {draft ? (
        <div>
          <p className="text-sm font-medium text-teal-700">{draft.reason}</p>
          <h4 className="font-display mt-2 text-2xl font-bold">
            {draft.emoji} {draft.title}
          </h4>
          <p className="mt-1 text-slate-600">{formatPlanWhen(draft.startTime)}</p>
          <p className="mt-1 text-sm text-slate-500">{draft.locationLabel}</p>
          <p className="mt-3 text-sm text-slate-600">{draft.description}</p>
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
