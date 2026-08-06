"use client";

import { PlayerTokens } from "@/components/game/board/PlayerTokens";
import type { Player } from "@/lib/monopoly/types";
import { cx } from "@/lib/ui";

interface CornerTileProps {
  index: number;
  row: number;
  col: number;
  active: boolean;
  selected: boolean;
  playersHere: Player[];
  jailPlayers: Player[];
  hopping: Record<number, number>;
  onSelect: () => void;
}

const TITLE = "text-[clamp(6px,1.3cqi,11px)] font-extrabold uppercase leading-tight";
const SUB = "text-[clamp(5px,1cqi,8px)] font-bold uppercase text-ink/60";

export function CornerTile({
  index,
  row,
  col,
  active,
  selected,
  playersHere,
  jailPlayers,
  hopping,
  onSelect,
}: CornerTileProps) {
  return (
    <button
      type="button"
      style={{ gridRow: row, gridColumn: col, background: "var(--color-paper)" }}
      onClick={onSelect}
      className={cx(
        "relative flex items-center justify-center overflow-hidden border border-ink/45 p-1 text-ink",
        active && "z-20 ring-2 ring-ink ring-inset",
        selected && "z-20 ring-2 ring-accent ring-inset",
      )}
    >
      {index === 0 && (
        <span className="flex -rotate-45 flex-col items-center gap-0.5">
          <span className={SUB}>Collect $200</span>
          <span className="font-display text-[clamp(14px,3.6cqi,30px)] leading-none text-hot">
            GO
          </span>
          <span className="text-[clamp(9px,2cqi,16px)] leading-none text-hot">
            ⬅
          </span>
        </span>
      )}

      {index === 10 && (
        <span className="flex size-full flex-col items-center justify-between">
          <span className={cx(SUB, "self-start")}>Just</span>
          <span className="relative flex size-[62%] items-center justify-center rounded-xs border border-ink/50 bg-[#f0a34a]">
            <span
              className="absolute inset-0 rounded-xs"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, rgba(26,26,26,0.7) 0 2px, transparent 2px 7px)",
              }}
              aria-hidden
            />
            <span className={cx(TITLE, "relative")}>Jail</span>
            <PlayerTokens players={jailPlayers} hopping={hopping} />
          </span>
          <span className={cx(SUB, "self-end")}>Visiting</span>
        </span>
      )}

      {index === 20 && (
        <span className="flex rotate-45 flex-col items-center gap-0.5">
          <span className={TITLE}>Free</span>
          <span className="text-[clamp(12px,2.8cqi,24px)] leading-none" aria-hidden>
            🅿️
          </span>
          <span className={TITLE}>Parking</span>
        </span>
      )}

      {index === 30 && (
        <span className="flex -rotate-45 flex-col items-center gap-0.5">
          <span className={TITLE}>Go to</span>
          <span className="text-[clamp(12px,2.8cqi,24px)] leading-none" aria-hidden>
            👮
          </span>
          <span className={TITLE}>Jail</span>
        </span>
      )}

      {index !== 10 && <PlayerTokens players={playersHere} hopping={hopping} />}
    </button>
  );
}
