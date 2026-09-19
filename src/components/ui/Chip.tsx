"use client";

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  emoji?: string;
}

export function Chip({ label, selected, onClick, emoji }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-selected={selected ? "true" : "false"}
      className="chip cursor-pointer"
      aria-pressed={selected}
    >
      {emoji ? <span aria-hidden>{emoji}</span> : null}
      <span>{label}</span>
    </button>
  );
}
