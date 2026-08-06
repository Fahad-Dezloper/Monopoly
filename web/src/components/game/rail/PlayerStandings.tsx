"use client";

import { PlayerCard } from "@/components/game/rail/PlayerCard";
import type { MoneyFlash } from "@/hooks/useGameFx";
import type { GameState } from "@/lib/monopoly/types";

interface PlayerStandingsProps {
  state: GameState;
  mySeat: number | null;
  moneyFlashes: Record<number, MoneyFlash>;
}

export function PlayerStandings({
  state,
  mySeat,
  moneyFlashes,
}: PlayerStandingsProps) {
  const players = state.players.filter(
    (player) =>
      player.index > 0 && player.index <= state.playerCount && player.name,
  );

  return (
    <div className="flex flex-col gap-1.5  p-2">
      {players.map((player) => (
        <PlayerCard
          key={player.index}
          state={state}
          player={player}
          isYou={mySeat === player.index}
          isTurn={player.index === state.turn}
          flash={moneyFlashes[player.index]}
        />
      ))}
    </div>
  );
}
