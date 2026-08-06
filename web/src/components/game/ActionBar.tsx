"use client";

import type { GameAction } from "@/lib/monopoly/engine";
import type { GameState } from "@/lib/monopoly/types";
import { cx } from "@/lib/ui";

const BUTTON =
  "inline-flex items-center gap-1.75 rounded-[10px] border px-4 py-2.5 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-38 max-[720px]:px-3 max-[720px]:text-[12px]";

const NEUTRAL =
  "border-line bg-surface text-body hover:not-disabled:border-[#3e3e48] hover:not-disabled:bg-surface-2";

const PRIMARY =
  "border-accent bg-accent text-white hover:not-disabled:border-accent-hover hover:not-disabled:bg-accent-hover";

const BUY =
  "border-[#1f8a45] bg-[#1f8a45] text-white hover:not-disabled:border-[#239b4e] hover:not-disabled:bg-[#239b4e]";

const DANGER = "border-bad/35 bg-surface text-[#f07a8a]";

interface ActionBarProps {
  state: GameState;
  isMyTurn: boolean;
  canBuy: boolean;
  diceRolling: boolean;
  canTrade: boolean;
  act: (action: GameAction) => void;
  onRollStart: () => void;
  onOpenTrade: () => void;
}

export function ActionBar({
  state,
  isMyTurn,
  canBuy,
  diceRolling,
  canTrade,
  act,
  onRollStart,
  onOpenTrade,
}: ActionBarProps) {
  const me = state.players[state.turn];
  const blocked =
    !isMyTurn ||
    !!state.popup?.open ||
    state.phase === "auction" ||
    state.phase === "game_over" ||
    diceRolling;

  const canRoll = !blocked && (!state.diceRolled || state.doubleCount > 0);
  const canEndTurn = !blocked && state.diceRolled && state.doubleCount === 0;
  const inJail = isMyTurn && me?.jail && !state.diceRolled;
  const price = state.squares[me?.position ?? 0]?.price ?? 0;

  const rollLabel = diceRolling
    ? "Rolling…"
    : state.doubleCount > 0 && state.diceRolled
      ? "Roll Again"
      : "Roll Dice";

  return (
    <div className="flex flex-wrap justify-center gap-2 p-2">
      <button
        type="button"
        className={cx(BUTTON, PRIMARY)}
        disabled={!canRoll}
        title={state.nextButtonTitle}
        onClick={() => {
          onRollStart();
          act({ type: "NEXT" });
        }}
      >
        <span aria-hidden>🎲</span>
        {rollLabel}
      </button>

      <button
        type="button"
        className={cx(BUTTON, NEUTRAL)}
        disabled={!canEndTurn}
        onClick={() => act({ type: "NEXT" })}
      >
        <span aria-hidden>▶</span> End Turn
      </button>

      {canBuy && (
        <button
          type="button"
          className={cx(BUTTON, BUY)}
          onClick={() => act({ type: "BUY" })}
        >
          <span aria-hidden>＋</span> Buy ${price}
        </button>
      )}

      {inJail && (
        <>
          <button
            type="button"
            className={cx(BUTTON, NEUTRAL)}
            disabled={me.money < 50}
            onClick={() => act({ type: "PAY_JAIL_FINE" })}
          >
            <span aria-hidden>💵</span> Pay $50
          </button>
          {(me.communityChestJailCard || me.chanceJailCard) && (
            <button
              type="button"
              className={cx(BUTTON, NEUTRAL)}
              onClick={() => act({ type: "USE_JAIL_CARD" })}
            >
              <span aria-hidden>🎟</span> Use Card
            </button>
          )}
        </>
      )}

      <button
        type="button"
        className={cx(BUTTON, NEUTRAL)}
        disabled={!canTrade}
        onClick={onOpenTrade}
        title={canTrade ? "Propose a trade" : "Trade on your turn"}
      >
        <span aria-hidden>⇄</span> Trade
      </button>

      <button
        type="button"
        className={cx(BUTTON, NEUTRAL)}
        disabled={state.phase !== "auction"}
        title={
          state.phase === "auction"
            ? "Auction in progress"
            : "Auctions start when a property goes unbought"
        }
      >
        <span aria-hidden>🔨</span> Auction
      </button>

      <button
        type="button"
        className={cx(BUTTON, DANGER)}
        disabled={!isMyTurn || state.phase === "game_over"}
        onClick={() => {
          if (confirm("Resign and hand your assets over?")) {
            act({ type: "RESIGN" });
          }
        }}
      >
        <span aria-hidden>☠</span> Bankrupt
      </button>
    </div>
  );
}
