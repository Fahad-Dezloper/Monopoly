"use client";

import { BuildMarker } from "@/components/game/board/BuildMarker";
import { netWorth } from "@/lib/monopoly/stats";
import type { GameAction } from "@/lib/monopoly/engine";
import type { GameState } from "@/lib/monopoly/types";
import { Dialog, dialogGhost } from "@/components/game/dialogs/Dialog";
import { cx } from "@/lib/ui";

interface StatsDialogProps {
  state: GameState;
  act: (action: GameAction) => void;
  onShowDeed: (index: number | null) => void;
}

export function StatsDialog({ state, act, onShowDeed }: StatsDialogProps) {
  if (!state.showStats) return null;

  const close = () => act({ type: "TOGGLE_STATS" });
  const players = state.players.filter(
    (player) =>
      player.index > 0 &&
      player.index <= state.playerCount &&
      player.position >= 0,
  );

  return (
    <Dialog
      eyebrow="Ledger"
      title="Player standings"
      subtitle="Cash, net worth and every deed on the table"
      size="lg"
      onClose={close}
      footer={
        <button type="button" className={dialogGhost} onClick={close}>
          Close
        </button>
      }
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        {players.map((player) => {
          const deeds = state.squares.filter(
            (square) => square.owner === player.index,
          );
          return (
            <div
              key={player.index}
              className="overflow-hidden rounded-sm border border-line"
            >
              <div
                className="border-b border-line bg-surface-2 px-3 py-2 text-[12.5px] font-bold"
                style={{ borderLeft: `4px solid ${player.color}` }}
              >
                {player.name}
                <span className="ml-1.5 font-semibold text-dim">
                  ${Math.floor(player.money)} · net $
                  {netWorth(state, player.index)}
                </span>
              </div>
              {deeds.length === 0 && (
                <div className="px-3 py-2 text-[11.5px] text-dim">
                  No properties yet
                </div>
              )}
              {deeds.map((square) => (
                <div
                  key={square.index}
                  className={cx(
                    "flex items-center gap-2 px-3 py-1.5 text-[11.5px]",
                    square.mortgage && "text-dim",
                  )}
                  onMouseEnter={() => onShowDeed(square.index)}
                  onMouseLeave={() => onShowDeed(null)}
                >
                  <span
                    className="h-3.5 w-2 shrink-0 rounded-xs"
                    style={{ background: square.color }}
                  />
                  <span className="min-w-0 flex-1 truncate">{square.name}</span>
                  <BuildMarker square={square} compact />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </Dialog>
  );
}
