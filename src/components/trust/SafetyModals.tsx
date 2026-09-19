"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useDemo } from "@/context/DemoContext";
import { useTrust } from "@/context/TrustContext";
import { LEAVE_REASONS, REPORT_CATEGORIES } from "@/lib/trust/core";
import type { CircleLeaveReason, ReportCategory } from "@/lib/supabase/database.types";

export function ReportModal({
  open,
  onClose,
  subjectId,
  subjectName,
}: {
  open: boolean;
  onClose: () => void;
  subjectId: string;
  subjectName: string;
}) {
  const { reportProfile } = useTrust();
  const { state } = useDemo();
  const [category, setCategory] = useState<ReportCategory>("harassment");
  const [details, setDetails] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const message = await reportProfile({
      subjectId,
      category,
      details,
      circleId: state.circle?.id,
    });
    if (message) {
      setError(message);
      return;
    }
    setDone(true);
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setDone(false);
        onClose();
      }}
      title={done ? "Thanks for telling us" : "Report"}
    >
      {done ? (
        <p className="text-slate-600">
          We received this privately. {subjectName} won&apos;t see that you reported them.
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            This stays between you and Circle safety. It does not automatically change anyone&apos;s Karma.
          </p>
          <div className="grid grid-cols-1 gap-2">
            {REPORT_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`rounded-xl border px-3 py-2 text-left text-sm ${
                  category === c.id
                    ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-ink)]"
                    : "border-slate-200 bg-white"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Anything else we should know? (optional)"
            className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
            rows={3}
          />
          {error ? <p className="text-sm text-orange-700">{error}</p> : null}
          <Button fullWidth onClick={() => void submit()}>
            Send report
          </Button>
        </div>
      )}
    </Modal>
  );
}

export function LeaveCircleModal({
  open,
  onClose,
  onLeft,
  onReport,
}: {
  open: boolean;
  onClose: () => void;
  onLeft: () => void;
  onReport?: () => void;
}) {
  const { leaveCurrentCircle } = useTrust();
  const [reason, setReason] = useState<CircleLeaveReason | "">("");

  const selected = LEAVE_REASONS.find((r) => r.id === reason);

  return (
    <Modal open={open} onClose={onClose} title="Leave Circle?">
      <p className="text-slate-600">
        You will stop receiving messages and plans from this Circle.
      </p>
      <p className="mt-4 text-sm font-medium text-slate-700">Why are you leaving? (optional)</p>
      <div className="mt-2 space-y-2">
        {LEAVE_REASONS.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setReason(r.id)}
            className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
              reason === r.id ? "border-[var(--brand)] bg-[var(--brand-soft)]" : "border-slate-200"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      {selected?.safetyRelated ? (
        <div className="mt-3 rounded-xl bg-[var(--brand-soft)] px-3 py-3 text-sm text-[var(--brand-ink)]">
          <p>If you felt uncomfortable, you can report someone. You don&apos;t have to.</p>
          {onReport ? (
            <button type="button" className="mt-2 font-semibold underline" onClick={onReport}>
              Report instead / as well
            </button>
          ) : null}
        </div>
      ) : null}
      <Button
        fullWidth
        className="mt-5"
        onClick={async () => {
          await leaveCurrentCircle(reason || undefined);
          onLeft();
        }}
      >
        Leave Circle
      </Button>
    </Modal>
  );
}
