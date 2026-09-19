"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "coral";

const styles: Record<Variant, string> = {
  primary:
    "bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/25",
  secondary:
    "bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 shadow-sm",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
  coral:
    "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/25",
};

interface ButtonProps {
  children: ReactNode;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth,
  className = "",
  disabled,
  type = "button",
  onClick,
}: ButtonProps) {
  const sizes = {
    sm: "px-3.5 py-2 text-sm",
    md: "px-5 py-3 text-base",
    lg: "px-6 py-4 text-lg",
  };

  return (
    <motion.button
      type={type}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      whileHover={disabled ? undefined : { y: -1 }}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}
