"use client";

import { motion } from "framer-motion";

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  emoji?: string;
}

export function Chip({ label, selected, onClick, emoji }: ChipProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      data-selected={selected ? "true" : "false"}
      className="chip cursor-pointer"
    >
      {emoji ? <span>{emoji}</span> : null}
      <span>{label}</span>
    </motion.button>
  );
}
