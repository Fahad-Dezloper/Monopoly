"use client";

import { ActionBar } from "@/components/game/ActionBar";
import { DiceCubes } from "@/components/game/board/DiceCubes";
import { LiveLog } from "@/components/game/rail/LiveLog";
import type { GameAction } from "@/lib/monopoly/engine";
import type { GameState, Player } from "@/lib/monopoly/types";

interface BoardCenterProps {
  state: GameState;
  die1: number;
  die2: number;
  diceRolled: boolean;
  diceRolling: boolean;
  currentPlayer?: Player;
  isMyTurn: boolean;
  canBuy: boolean;
  canTrade?: boolean;
  act: (action: GameAction) => void;
  onRollStart: () => void;
  onOpenTrade?: () => void;
}

export function BoardCenter({
  state,
  die1,
  die2,
  diceRolled,
  diceRolling,
  currentPlayer,
  isMyTurn,
  canBuy,
  canTrade = false,
  act,
  onRollStart,
  onOpenTrade,
}: BoardCenterProps) {
  return (
    <div className="relative flex size-full flex-col items-center justify-center gap-[1.1cqi] overflow-hidden px-[2cqi] py-[1.2cqi]">
      <div className="flex shrink-0 items-center gap-[2cqi]">
        <DiceCubes
          die1={die1}
          die2={die2}
          rolling={diceRolling}
          ghost={!diceRolled && !diceRolling}
        />
      </div>

      {currentPlayer && currentPlayer.index > 0 && (
        <div className="flex shrink-0 items-center gap-[1.2cqi] rounded-full border border-white/12 bg-black/40 px-[2cqi] py-[0.8cqi]">
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

      <div className="z-20 w-full max-w-[96%] shrink-0">
        <ActionBar
          state={state}
          isMyTurn={isMyTurn}
          canBuy={canBuy}
          diceRolling={diceRolling}
          canTrade={canTrade}
          act={act}
          onRollStart={onRollStart}
          onOpenTrade={onOpenTrade}
        />
      </div>

      <div className="z-20 min-h-0 w-full max-w-[92%] flex-1 basis-[26%] overflow-hidden">
        <LiveLog alerts={state.alerts} players={state.players} compact />
      </div>
    </div>
  );
}
