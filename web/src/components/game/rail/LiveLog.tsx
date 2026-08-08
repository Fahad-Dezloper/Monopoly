"use client";

import { useEffect, useRef } from "react";
import { parseActivity } from "@/components/game/rail/activityFormat";
import type { Player } from "@/lib/monopoly/types";

const MAX_LINES = 40;

interface LiveLogProps {
  alerts: string[];
  players: Player[];
}

export function LiveLog({ alerts, players }: LiveLogProps) {
  const feedRef = useRef<HTMLDivElement>(null);
  const lines = alerts.slice(-MAX_LINES);

  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [alerts.length]);

  return (
    <div className="relative flex h-[120px] min-h-[100px] max-h-[140px] flex-col overflow-hidden rounded-2xl border border-[#e9e2ff] bg-white/90 shadow-sm">
      {/* Fade top */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-white to-transparent"
        aria-hidden
      />
      {/* Fade bottom */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-white to-transparent"
        aria-hidden
      />

      <div
        ref={feedRef}
        className="scrollless flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3"
      >
        {lines.length === 0 && (
          <div className="py-2 text-center text-[11px] text-slate-400">
            Game log will appear here…
          </div>
        )}
        {lines.map((raw, index) => {
          const { player, rest, icon } = parseActivity(raw, players);
          const age = lines.length - 1 - index;
          const opacity = Math.max(0.35, 1 - age * 0.04);
          return (
            <div
              key={`${index}-${raw.slice(0, 24)}`}
              className="flex gap-2 text-[11.5px] leading-snug text-slate-600"
              style={{ opacity }}
            >
              <span className="shrink-0" aria-hidden>
                {icon}
              </span>
              <span className="min-w-0 wrap-break-word">
                {player && (
                  <strong className="font-bold text-slate-800">
                    {player.name}
                  </strong>
                )}
                {player ? ` ${rest}` : rest}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
