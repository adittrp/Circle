"use client";

interface AvatarProps {
  src: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  ring?: boolean;
}

const sizes = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
};

export function Avatar({ src, name, size = "md", ring }: AvatarProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-full bg-teal-100 ${sizes[size]} ${ring ? "ring-4 ring-teal-100" : ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={name} className="h-full w-full object-cover" />
    </div>
  );
}
