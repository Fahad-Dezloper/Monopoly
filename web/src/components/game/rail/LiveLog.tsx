"use client";

import { useEffect, useRef } from "react";
import { parseActivity } from "@/components/game/rail/activityFormat";
import type { Player } from "@/lib/monopoly/types";
import { cx } from "@/lib/ui";

const MAX_LINES = 40;

interface LiveLogProps {
  alerts: string[];
  players: Player[];
  /** Smaller glass panel for board center. */
  compact?: boolean;
}

export function LiveLog({ alerts, players, compact = false }: LiveLogProps) {
  const feedRef = useRef<HTMLDivElement>(null);
  const lines = alerts.slice(-MAX_LINES);

  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [alerts.length]);

  return (
    <div
      className={cx("relative flex h-full min-h-0 flex-col overflow-hidden")}
    >
      <div
        className={cx("pointer-events-none absolute inset-x-0 top-0 z-10 h-5")}
        aria-hidden
      />
      <div
        className={cx(
          "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6",
        )}
        aria-hidden
      />

      <div
        ref={feedRef}
        className={cx(
          "scrollless flex flex-1 flex-col gap-1 overflow-y-auto",
          compact ? "px-[1.4cqi] py-[1.2cqi]" : "px-3 py-3",
        )}
      >
        {lines.length === 0 && (
          <div
            className={cx(
              "py-1 text-center",
              compact
                ? "text-[1.1cqi] text-white/45"
                : "text-[11px] text-slate-400",
            )}
          >
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
              className={cx(
                "flex gap-1.5 w-full text-center justify-center items-center leading-snug",
                compact
                  ? "text-base text-white/80"
                  : "text-base text-slate-600",
              )}
              style={{ opacity }}
            >
              <span className="shrink-0" aria-hidden>
                {icon}
              </span>
              <span className="min-w-0 wrap-break-word">
                {player && (
                  <strong
                    className={cx(
                      "font-bold",
                      compact ? "text-white" : "text-slate-800",
                    )}
                  >
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
