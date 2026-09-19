"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  listNotifications,
  markNotificationRead,
} from "@/lib/campus/api";
import type { Notification } from "@/lib/supabase/database.types";

export function NotificationBell({ profileId }: { profileId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    let cancelled = false;
    void listNotifications(profileId).then((res) => {
      if (!cancelled) setItems(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [profileId, open]);

  const unread = items.filter((n) => !n.read_at).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="font-display text-sm font-bold">Campus updates</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">
                No notifications yet.
              </p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={n.href || "/campus"}
                  onClick={() => {
                    void markNotificationRead(n.id);
                    setOpen(false);
                  }}
                  className={`block border-b border-slate-50 px-4 py-3 hover:bg-slate-50 ${
                    n.read_at ? "opacity-70" : ""
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                  {n.body ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                      {n.body}
                    </p>
                  ) : null}
                </Link>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
