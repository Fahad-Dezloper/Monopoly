"use client";

import { BoardCenter } from "@/components/game/board/BoardCenter";
import { BoardOverlayTile } from "@/components/game/board/BoardOverlayTile";
import {
  BOARD_IMAGE,
  centerRect,
  DEFAULT_BOARD_SPEC,
  tileRects,
  type BoardSpec,
} from "@/lib/monopoly/boardGeometry";
import type { GameState, Player } from "@/lib/monopoly/types";

interface GameBoardProps {
  state: GameState;
  selectedIndex: number | null;
  onSelectSquare: (index: number | null) => void;
  diceRolling?: boolean;
  displayPositions?: Record<number, number>;
  hopping?: Record<number, number>;
  spec?: BoardSpec;
  showGrid?: boolean;
  /** Highlight this player's owned tiles; dim others. */
  focusOwner?: number | null;
}

export function GameBoard({
  state,
  selectedIndex,
  onSelectSquare,
  diceRolling = false,
  displayPositions = {},
  hopping = {},
  spec = DEFAULT_BOARD_SPEC,
  showGrid = false,
  focusOwner = null,
}: GameBoardProps) {
  const rects = tileRects(spec);
  const center = centerRect(spec);
  const tokenPosition = (player: Player) =>
    displayPositions[player.index] ?? player.position;

  const playersOn = (index: number) =>
    state.players.filter((player) => {
      if (player.index <= 0 || !Number.isFinite(player.money)) return false;
      return tokenPosition(player) === index;
    });

  return (
    <div className="grid h-full min-h-0 place-items-center [container-type:size]">
      <div
        className="relative aspect-square h-[min(100cqh,100cqw)] w-[min(100cqh,100cqw)] overflow-hidden rounded-2xl bg-ink shadow-[0_1.5cqi_4cqi_rgba(0,0,0,0.35)] [container-type:size]"
        role="grid"
        aria-label="game board"
      >
        <img
          src={BOARD_IMAGE}
          alt=""
          className="absolute inset-0 size-full object-cover select-none"
          draggable={false}
        />

        <div
          className="absolute"
          style={{
            left: `${center.left}%`,
            top: `${center.top}%`,
            width: `${center.width}%`,
            height: `${center.height}%`,
          }}
        >
          <BoardCenter
            die1={state.die1}
            die2={state.die2}
            diceRolled={state.diceRolled}
            diceRolling={diceRolling}
            currentPlayer={state.players[state.turn]}
          />
        </div>

        {rects.map((rect) => {
          const square = state.squares[rect.index];
          if (!square) return null;
          const playersHere = playersOn(rect.index);
          const owner =
            square.owner > 0 ? state.players[square.owner] : undefined;

          return (
            <BoardOverlayTile
              key={rect.index}
              rect={rect}
              square={square}
              active={playersHere.some((player) => player.index === state.turn)}
              selected={selectedIndex === rect.index}
              ownerColor={owner?.color}
              ownerName={owner?.name}
              playersHere={playersHere}
              hopping={hopping}
              showGrid={showGrid}
              focusOwner={focusOwner}
              onSelect={() =>
                onSelectSquare(selectedIndex === rect.index ? null : rect.index)
              }
            />
          );
        })}
      </div>
    </div>
  );
}
