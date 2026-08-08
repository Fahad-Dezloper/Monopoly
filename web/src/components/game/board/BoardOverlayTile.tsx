"use client";

import { BuildMarker } from "@/components/game/board/BuildMarker";
import { PlayerTokens } from "@/components/game/board/PlayerTokens";
import type { TileRect } from "@/lib/monopoly/boardGeometry";
import type { Player, Square } from "@/lib/monopoly/types";
import { cx } from "@/lib/ui";

const BAND_EDGE: Record<TileRect["side"], string> = {
  top: "inset-x-0 bottom-[3%] flex-row justify-center",
  bottom: "inset-x-0 top-[3%] flex-row justify-center",
  left: "inset-y-0 right-[3%] flex-col justify-center",
  right: "inset-y-0 left-[3%] flex-col justify-center",
  corner: "inset-x-0 top-[3%] flex-row justify-center",
};

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
  /** When set, owned tiles of this seat pop; others dim. */
  focusOwner?: number | null;
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
  focusOwner = null,
  onSelect,
}: BoardOverlayTileProps) {
  const focusing = focusOwner != null && focusOwner > 0;
  const isFocusOwned = focusing && square.owner === focusOwner;
  const isFocusOther =
    focusing && square.price > 0 && square.owner !== focusOwner;

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
        background: isFocusOwned
          ? `color-mix(in srgb, ${ownerColor ?? "#7c3aed"} 55%, transparent)`
          : ownerColor && !focusing
            ? `color-mix(in srgb, ${ownerColor} ${square.mortgage ? 22 : 38}%, transparent)`
            : undefined,
      }}
      className={cx(
        "absolute flex items-center justify-center transition-[box-shadow,background-color,opacity,filter] duration-200",
        "hover:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.65)]",
        active && "shadow-[inset_0_0_0_3px_var(--color-ink)]",
        selected && "shadow-[inset_0_0_0_3px_var(--color-accent)]",
        isFocusOwned &&
          "z-10 shadow-[inset_0_0_0_3px_rgba(124,58,237,0.85)]",
        isFocusOther && "opacity-30 grayscale",
        square.mortgage && !focusing && "grayscale-[0.35]",
        showGrid && "shadow-[inset_0_0_0_1px_rgba(255,0,128,0.9)]",
      )}
    >
      <BuildMarker
        square={square}
        compact
        className={cx("absolute z-20 flex gap-[2px]", BAND_EDGE[rect.side])}
      />
      <PlayerTokens players={playersHere} hopping={hopping} />
    </button>
  );
}
