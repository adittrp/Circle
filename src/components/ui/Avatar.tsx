"use client";

interface AvatarProps {
  src: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  ring?: boolean;
}

const sizes = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-11 w-11 text-xs",
  lg: "h-14 w-14 text-sm",
  xl: "h-20 w-20 text-lg",
};

export function Avatar({ src, name, size = "md", ring }: AvatarProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-full bg-[var(--brand-soft)] text-[var(--brand-ink)] ${sizes[size]} ${
        ring ? "ring-2 ring-[var(--brand-soft)] ring-offset-2 ring-offset-[var(--bg)]" : ""
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={name} className="h-full w-full object-cover" />
    </div>
  );
}
