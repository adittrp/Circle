"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { HangoutMember } from "@/lib/hangouts/types";
import type { MessageReactionRow, MessageRow } from "@/lib/supabase/database.types";

const REACTIONS = ["👍", "🔥", "🌮", "🙌"];

export function CircleChat({
  members,
  messages,
  reactions,
  profileId,
  emphasized,
  onSend,
  onReact,
}: {
  members: HangoutMember[];
  messages: MessageRow[];
  reactions: MessageReactionRow[];
  profileId: string | null;
  emphasized?: boolean;
  onSend: (body: string) => Promise<void>;
  onReact: (messageId: string, emoji: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const names = new Map(members.map((m) => [m.id, m.firstName]));

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <section className={`card-surface flex flex-col ${emphasized ? "min-h-[420px]" : "min-h-[280px]"}`}>
      <div className="border-b border-slate-100 px-5 py-3">
        <h2 className="font-display text-lg font-bold">Chat</h2>
        <p className="text-xs text-slate-500">Secondary to plans — use it to lock the details.</p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">No messages yet. A plan is a better first move.</p>
        ) : null}
        {messages.map((message) => {
          const mine = message.author_id === profileId;
          const mineReactions = reactions.filter((r) => r.message_id === message.id);
          const grouped = new Map<string, number>();
          for (const row of mineReactions) grouped.set(row.emoji, (grouped.get(row.emoji) ?? 0) + 1);
          return (
            <div key={message.id} className={message.is_system ? "text-center" : mine ? "text-right" : ""}>
              {message.is_system ? (
                <p className="text-xs text-slate-500">{message.body}</p>
              ) : (
                <div className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-left ${
                  mine ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-800"
                }`}
                >
                  <p className={`text-[11px] ${mine ? "text-teal-100" : "text-slate-500"}`}>
                    {mine ? "You" : names.get(message.author_id) || "Member"} ·{" "}
                    {new Date(message.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </p>
                  <p className="text-sm">{message.body}</p>
                </div>
              )}
              {!message.is_system ? (
                <div className={`mt-1 flex flex-wrap gap-1 ${mine ? "justify-end" : ""}`}>
                  {REACTIONS.map((emoji) => {
                    const count = grouped.get(emoji) ?? 0;
                    const selected = mineReactions.some(
                      (r) => r.profile_id === profileId && r.emoji === emoji
                    );
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => void onReact(message.id, emoji)}
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          selected ? "bg-teal-50 text-teal-800" : "bg-white text-slate-500"
                        } border border-slate-200`}
                      >
                        {emoji}
                        {count ? ` ${count}` : ""}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      <form
        className="flex gap-2 border-t border-slate-100 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          const value = draft.trim();
          if (!value) return;
          setDraft("");
          void onSend(value);
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message your Circle"
          className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm"
        />
        <Button type="submit" size="sm">
          Send
        </Button>
      </form>
    </section>
  );
}
