"use client";

import { useEffect, useRef } from "react";
import { parseActivity } from "@/components/game/rail/activityFormat";
import type { Player } from "@/lib/monopoly/types";
import { feed } from "@/lib/ui";

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
    <div className={feed} ref={feedRef}>
      {lines.length === 0 && (
        <div className="px-0.5 py-2 text-[12px] text-dim">
          nothing has happened yet
        </div>
      )}
      {lines.map((raw, index) => {
        const { player, rest, icon } = parseActivity(raw, players);
        return (
          <div
            key={`${index}-${raw.slice(0, 18)}`}
            className="flex gap-2 border-b border-line-soft pb-1.5 text-[12px] leading-[1.4] text-[#c8c8d0] last:border-b-0 last:pb-0"
          >
            <span className="shrink-0" aria-hidden>
              {icon}
            </span>
            <span className="min-w-0 wrap-break-word">
              {player && (
                <strong style={{ color: player.color }}>{player.name}</strong>
              )}
              {player ? ` ${rest}` : rest}
            </span>
          </div>
        );
      })}
    </div>
  );
}
