"use client";

import { BuildMarker } from "@/components/game/board/BuildMarker";
import { PlayerTokens } from "@/components/game/board/PlayerTokens";
import {
  isTileClickable,
  ownerWash,
  tileGlyph,
} from "@/components/game/board/tileVisuals";
import { FLAG_EMOJI } from "@/lib/monopoly/board";
import type { Player, Square } from "@/lib/monopoly/types";
import { cx } from "@/lib/ui";

export type TileSide = "top" | "right" | "bottom" | "left";

const FRAME: Record<TileSide, string> = {
  top: "flex-col",
  bottom: "flex-col-reverse",
  left: "flex-row",
  right: "flex-row-reverse",
};

const BAND: Record<TileSide, string> = {
  top: "order-last h-[18%] w-full border-t",
  bottom: "order-last h-[18%] w-full border-b",
  left: "order-last h-full w-[18%] border-l",
  right: "order-last h-full w-[18%] border-r",
};

const VERTICAL: Record<TileSide, string> = {
  top: "",
  bottom: "",
  left: "[writing-mode:vertical-rl] rotate-180",
  right: "[writing-mode:vertical-rl]",
};

interface BoardTileProps {
  square: Square;
  side: TileSide;
  row: number;
  col: number;
  active: boolean;
  selected: boolean;
  ownerName?: string;
  ownerColor?: string;
  playersHere: Player[];
  hopping: Record<number, number>;
  onSelect: () => void;
}

export function BoardTile({
  square,
  side,
  row,
  col,
  active,
  selected,
  ownerName,
  ownerColor,
  playersHere,
  hopping,
  onSelect,
}: BoardTileProps) {
  const glyph = tileGlyph(square);
  const clickable = isTileClickable(square);
  const hasBand = square.groupNumber >= 3;

  return (
    <button
      type="button"
      style={{
        gridRow: row,
        gridColumn: col,
        background: ownerColor
          ? ownerWash(ownerColor, square.mortgage)
          : "var(--color-paper)",
      }}
      title={ownerName ? `Owned by ${ownerName}` : square.name}
      onClick={() => clickable && onSelect()}
      className={cx(
        "relative flex overflow-hidden border border-ink/45 p-0 text-ink",
        FRAME[side],
        clickable ? "cursor-pointer" : "cursor-default",
        square.mortgage && "opacity-80 saturate-50",
        active && "z-20 ring-2 ring-ink ring-inset",
        selected && "z-20 ring-2 ring-accent ring-inset",
      )}
    >
      {hasBand && (
        <span
          className={cx("shrink-0 border-ink/45", BAND[side])}
          style={{ background: square.color }}
          aria-hidden
        />
      )}

      <span
        className={cx(
          "flex min-h-0 min-w-0 flex-1 flex-col items-center justify-between gap-[2px] p-[3px] text-center",
          VERTICAL[side],
        )}
      >
        <span className="line-clamp-3 text-[clamp(5px,1.15cqi,9px)] leading-[1.15] font-bold tracking-[0.02em] uppercase">
          {square.name}
        </span>

        {glyph && !square.flagCode && (
          <span
            className="text-[clamp(9px,2.2cqi,17px)] leading-none"
            aria-hidden
          >
            {glyph.symbol}
          </span>
        )}

        {square.flagCode && (
          <span
            className="text-[clamp(9px,2.1cqi,16px)] leading-none"
            aria-hidden
          >
            {FLAG_EMOJI[square.flagCode] ?? "🏳️"}
          </span>
        )}

        {square.price > 0 && (
          <span className="text-[clamp(5px,1.05cqi,8.5px)] font-extrabold tabular-nums">
            {square.mortgage ? "MORTGAGED" : `$${square.price}`}
          </span>
        )}
        {square.price === 0 && (square.taxAmount ?? 0) > 0 && (
          <span className="text-[clamp(5px,1.05cqi,8.5px)] font-extrabold tabular-nums">
            PAY ${square.taxAmount}
          </span>
        )}
      </span>

      <BuildMarker
        square={square}
        compact
        className="absolute inset-x-0 top-[1px] z-20 flex justify-center gap-[1px]"
      />

      <PlayerTokens players={playersHere} hopping={hopping} />
    </button>
  );
}
