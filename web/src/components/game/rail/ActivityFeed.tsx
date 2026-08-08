"use client";

import { useEffect, useRef } from "react";
import { parseActivity } from "@/components/game/rail/activityFormat";
import type { Player } from "@/lib/monopoly/types";

const MAX_LINES = 60;

interface ActivityFeedProps {
  alerts: string[];
  players: Player[];
}

export function ActivityFeed({ alerts, players }: ActivityFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);
  const lines = alerts.slice(-MAX_LINES);

  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [alerts.length]);

  return (
    <div
      className="scrollless flex min-h-[100px] flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain rounded-2xl border border-line bg-white p-2.5"
      ref={feedRef}
    >
      {lines.length === 0 && (
        <div className="px-0.5 py-2 text-[12px] text-dim">
          Nothing has happened yet
        </div>
      )}
      {lines.map((raw, index) => {
        const { player, rest, icon } = parseActivity(raw, players);
        return (
          <div
            key={`${index}-${raw.slice(0, 18)}`}
            className="flex gap-2 border-b border-line-soft pb-1.5 text-[12px] leading-[1.4] text-slate-600 last:border-b-0 last:pb-0"
          >
            <span className="shrink-0 text-accent" aria-hidden>
              {icon === "•" ? "•" : icon}
            </span>
            <span className="min-w-0 wrap-break-word">
              {player && (
                <strong className="text-slate-800">{player.name}</strong>
              )}
              {player ? ` ${rest}` : rest}
            </span>
          </div>
        );
      })}
    </div>
  );
}
