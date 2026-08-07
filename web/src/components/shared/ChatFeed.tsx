"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/api/types";
import { cx, feed } from "@/lib/ui";

interface ChatFeedProps {
  messages: ChatMessage[];
  playerId: string;
  emptyLabel: string;
  className?: string;
}

export function ChatFeed({
  messages,
  playerId,
  emptyLabel,
  className,
}: ChatFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  return (
    <div className={cx(feed, className)} ref={feedRef}>
      {messages.length === 0 && (
        <div className="px-0.5 py-2 text-[12px] text-dim">{emptyLabel}</div>
      )}
      {messages.map((message) => {
        const mine = message.playerId === playerId;
        return (
          <div
            key={message.id}
            className={cx(
              "flex max-w-[92%] flex-col gap-0.5 rounded-[9px] px-2 py-1.5 text-[12px]",
              mine ? "self-end bg-accent/22" : "self-start bg-surface-2",
            )}
          >
            <span
              className="text-[10px] font-bold lowercase"
              style={{ color: message.color }}
            >
              {mine ? "you" : message.username}
            </span>
            <span className="break-words">{message.text}</span>
          </div>
        );
      })}
    </div>
  );
}
