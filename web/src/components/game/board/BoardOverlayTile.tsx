"use client";

import { BuildMarker } from "@/components/game/board/BuildMarker";
import { PlayerTokens } from "@/components/game/board/PlayerTokens";
import type { TileRect } from "@/lib/monopoly/boardGeometry";
import type { Player, Square } from "@/lib/monopoly/types";
import { cx } from "@/lib/ui";

interface BoardOverlayTileProps {
  rect: TileRect;
  square: Square;
  active: boolean;
  selected: boolean;
  ownerColor?: string;
  ownerName?: string;
  playersHere: Player[];
  hopping: Record<number, number>;
  showGrid?: boolean;
  onSelect: () => void;
}

export function BoardOverlayTile({
  rect,
  square,
  active,
  selected,
  ownerColor,
  ownerName,
  playersHere,
  hopping,
  showGrid = false,
  onSelect,
}: BoardOverlayTileProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      title={ownerName ? `${square.name} — ${ownerName}` : square.name}
      aria-label={square.name}
      style={{
        left: `${rect.left}%`,
        top: `${rect.top}%`,
        width: `${rect.width}%`,
        height: `${rect.height}%`,
        background: ownerColor
          ? `color-mix(in srgb, ${ownerColor} ${square.mortgage ? 22 : 38}%, transparent)`
          : undefined,
      }}
      className={cx(
        "absolute flex items-center justify-center transition-[box-shadow,background-color] duration-150",
        "hover:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.65)]",
        active && "shadow-[inset_0_0_0_3px_var(--color-ink)]",
        selected && "shadow-[inset_0_0_0_3px_var(--color-accent)]",
        square.mortgage && "grayscale-[0.35]",
        showGrid && "shadow-[inset_0_0_0_1px_rgba(255,0,128,0.9)]",
      )}
    >
      <BuildMarker
        square={square}
        compact
        className="absolute inset-x-0 top-[4%] z-20 flex justify-center gap-[2px]"
      />
      <PlayerTokens players={playersHere} hopping={hopping} />
    </button>
  );
}
