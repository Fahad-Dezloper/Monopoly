"use client";

import { DiceCubes } from "@/components/game/board/DiceCubes";
import type { Player } from "@/lib/monopoly/types";

interface BoardCenterProps {
  die1: number;
  die2: number;
  diceRolled: boolean;
  diceRolling: boolean;
  currentPlayer?: Player;
}

export function BoardCenter({
  die1,
  die2,
  diceRolled,
  diceRolling,
  currentPlayer,
}: BoardCenterProps) {
  return (
    <div className="relative flex size-full flex-col items-center justify-center gap-[3cqi] overflow-hidden">
      <div className="flex items-center gap-[2cqi]">
        <DiceCubes
          die1={die1}
          die2={die2}
          rolling={diceRolling}
          ghost={!diceRolled && !diceRolling}
        />
      </div>

      {currentPlayer && currentPlayer.index > 0 && (
        <div className="flex items-center gap-[1.2cqi] rounded-full border border-white/12 bg-black/40 px-[2cqi] py-[0.8cqi]">
          <span
            className="size-[1.6cqi] rounded-full"
            style={{ background: currentPlayer.color }}
            aria-hidden
          />
          <span className="text-[1.5cqi] font-bold text-white/90">
            {currentPlayer.name}&apos;s turn
          </span>
        </div>
      )}
    </div>
  );
}
