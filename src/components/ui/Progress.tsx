"use client";

export function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="progress-track w-full" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-fill transition-[width] duration-300 ease-[var(--ease-out)]" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Step ${step + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-200 ${
            i <= step
              ? "w-5 bg-[var(--brand)]"
              : "w-1.5 bg-[var(--bg-sunken)]"
          }`}
        />
      ))}
    </div>
  );
}
