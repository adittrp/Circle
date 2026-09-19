"use client";

import { motion } from "framer-motion";

export function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="progress-track w-full">
      <motion.div
        className="progress-fill"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      />
    </div>
  );
}

export function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all ${
            i <= step ? "w-6 bg-teal-600" : "w-2 bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}
