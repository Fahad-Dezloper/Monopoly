"use client";

import type { Player } from "@/lib/monopoly/types";
import { cx } from "@/lib/ui";

interface PlayerTokensProps {
  players: Player[];
  hopping: Record<number, number>;
  className?: string;
}

export function PlayerTokens({
  players,
  hopping,
  className,
}: PlayerTokensProps) {
  if (players.length === 0) return null;

  return (
    <span
      className={cx(
        "pointer-events-none absolute inset-0 z-30 flex flex-wrap content-center items-center justify-center gap-[2px] p-[2px]",
        className,
      )}
    >
      {players.map((player) => (
        <span
          key={`${player.index}-${hopping[player.index] ?? 0}`}
          className={cx(
            "size-[clamp(8px,1.9cqi,14px)] rounded-full border border-black/45 shadow-[0_1px_2px_rgba(0,0,0,0.45)]",
            !!hopping[player.index] &&
              "animate-token-hop motion-reduce:animate-none",
          )}
          style={{ background: player.color }}
          title={player.name}
        />
      ))}
    </span>
  );
}
