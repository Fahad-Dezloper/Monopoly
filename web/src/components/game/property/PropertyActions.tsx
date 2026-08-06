"use client";

import {
  buildHint,
  canDowngrade,
  canUpgrade,
  downgradeRefund,
  mortgageValue,
  unmortgageCost,
  upgradeCost,
} from "@/lib/monopoly/building";
import type { GameAction } from "@/lib/monopoly/engine";
import type { GameState, Square } from "@/lib/monopoly/types";
import { cx } from "@/lib/ui";

const BUTTON =
  "flex-1 justify-center inline-flex items-center gap-1.75 rounded-[10px] border px-2.5 py-2.25 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-38";

const NEUTRAL =
  "border-line bg-surface text-body hover:not-disabled:border-[#3e3e48] hover:not-disabled:bg-surface-2";

const PRIMARY =
  "border-accent bg-accent text-white hover:not-disabled:border-accent-hover hover:not-disabled:bg-accent-hover";

interface PropertyActionsProps {
  state: GameState;
  square: Square;
  seat: number;
  isMyTurn: boolean;
  act: (action: GameAction) => void;
}

export function PropertyActions({
  state,
  square,
  seat,
  isMyTurn,
  act,
}: PropertyActionsProps) {
  const isStreet = square.groupNumber >= 3;
  const player = state.players[seat];
  const hint = buildHint(state, seat, isMyTurn, square);

  const mortgageDisabled = square.mortgage
    ? (player?.money ?? 0) < unmortgageCost(square)
    : square.house > 0;

  return (
    <div className="flex flex-wrap gap-1.5 border-t border-line px-3.5 py-2.5">
      {isStreet && (
        <>
          <button
            type="button"
            className={cx(BUTTON, PRIMARY)}
            disabled={!isMyTurn || !canUpgrade(state, seat, square)}
            onClick={() => act({ type: "BUY_HOUSE", index: square.index })}
          >
            {square.house >= 4 ? "Buy hotel" : "Buy house"} · $
            {upgradeCost(square)}
          </button>
          <button
            type="button"
            className={cx(BUTTON, NEUTRAL)}
            disabled={!isMyTurn || !canDowngrade(state, seat, square)}
            onClick={() => act({ type: "SELL_HOUSE", index: square.index })}
          >
            {square.hotel === 1 ? "Sell hotel" : "Sell house"} · +$
            {downgradeRefund(square)}
          </button>
        </>
      )}
      <button
        type="button"
        className={cx(BUTTON, NEUTRAL)}
        disabled={!isMyTurn || mortgageDisabled}
        onClick={() => {
          act({ type: "SELECT_PROPERTY", index: square.index });
          act({ type: square.mortgage ? "UNMORTGAGE" : "MORTGAGE" });
        }}
      >
        {square.mortgage
          ? `Unmortgage · $${unmortgageCost(square)}`
          : `Mortgage · +$${mortgageValue(square)}`}
      </button>
      {hint && <div className="w-full text-[11px] text-dim">{hint}</div>}
    </div>
  );
}
