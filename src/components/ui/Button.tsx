"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "quiet" | "destructive";
/** Legacy aliases still used in older screens */
type LegacyVariant = Variant | "ghost" | "coral";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] active:bg-[var(--brand-ink)]",
  secondary:
    "bg-[var(--bg-elevated)] text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--bg-muted)] active:bg-[var(--bg-sunken)]",
  quiet:
    "bg-transparent text-[var(--ink-secondary)] hover:bg-[var(--bg-muted)] active:bg-[var(--bg-sunken)]",
  destructive:
    "bg-[var(--danger)] text-white hover:opacity-90 active:opacity-80",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[var(--text-label)]",
  md: "px-4 py-2.5 text-[var(--text-body)]",
  lg: "px-5 py-3 text-[var(--text-body-lg)]",
};

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  variant?: LegacyVariant;
  size?: Size;
  fullWidth?: boolean;
}

function resolveVariant(variant: LegacyVariant): Variant {
  if (variant === "ghost") return "quiet";
  if (variant === "coral") return "destructive";
  return variant;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth,
  className = "",
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const v = resolveVariant(variant);
  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center gap-2 font-semibold",
        "rounded-[var(--radius-sm)]",
        "transition-[background-color,transform,opacity] duration-[var(--duration-fast)] ease-[var(--ease-out)]",
        "disabled:cursor-not-allowed disabled:opacity-45",
        "active:translate-y-px",
        variants[v],
        sizes[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
