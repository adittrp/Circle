"use client";

import { Button } from "@/components/ui/Button";
import { CIRCLE_RULE_OPTIONS, type CircleRuleSet } from "@/lib/trust/core";

export function CircleRulesEditor({
  rules,
  onChange,
  onSave,
}: {
  rules: CircleRuleSet;
  onChange: (next: CircleRuleSet) => void;
  onSave?: () => void;
}) {
  return (
    <div className="space-y-3">
      {CIRCLE_RULE_OPTIONS.map((opt) => {
        if (opt.key === "notes") return null;
        const on = Boolean(rules[opt.key]);
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange({ ...rules, [opt.key]: !on })}
            className={`flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left ${
              on ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white"
            }`}
          >
            <span>
              <span className="block font-medium text-slate-900">{opt.title}</span>
              <span className="text-sm text-slate-500">{opt.description}</span>
            </span>
            <span className="text-sm font-semibold text-teal-700">{on ? "On" : "Off"}</span>
          </button>
        );
      })}
      {onSave ? (
        <Button fullWidth variant="secondary" onClick={onSave}>
          Save Circle rules
        </Button>
      ) : null}
    </div>
  );
}

export function VerifiedBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800">
      {compact ? "Verified" : "University Verified"}
    </span>
  );
}
