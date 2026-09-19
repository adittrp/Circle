"use client";

import { Avatar } from "./Avatar";

interface MemberCardProps {
  name: string;
  avatar: string;
  major: string;
  year: string;
  dorm: string;
  interests: string[];
  isYou?: boolean;
  compact?: boolean;
  universityVerified?: boolean;
}

export function MemberCard({
  name,
  avatar,
  major,
  year,
  dorm,
  interests,
  isYou,
  compact,
  universityVerified,
}: MemberCardProps) {
  return (
    <div
      className={`card-surface ${compact ? "p-3 min-w-[140px]" : "p-5"} flex flex-col items-center text-center gap-2`}
    >
      <Avatar src={avatar} name={name} size={compact ? "md" : "lg"} ring={isYou} />
      <div>
        <p className="font-semibold text-slate-900">
          {name}
          {isYou ? (
            <span className="ml-1 text-xs font-medium text-teal-700">(you)</span>
          ) : null}
        </p>
        {universityVerified ? (
          <p className="mt-1 text-[11px] font-semibold text-teal-800">University Verified</p>
        ) : null}
        <p className="text-sm text-slate-500">
          {year} · {major}
        </p>
        {!compact ? <p className="text-xs text-slate-400 mt-0.5">{dorm}</p> : null}
      </div>
      {!compact ? (
        <div className="flex flex-wrap justify-center gap-1.5 mt-1">
          {interests.slice(0, 3).map((i) => (
            <span
              key={i}
              className="rounded-full bg-slate-50 border border-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
            >
              {i}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
