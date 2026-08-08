"use client";

import type { GameAction } from "@/lib/monopoly/engine";
import type { GameState } from "@/lib/monopoly/types";
import { cx } from "@/lib/ui";

const BUTTON =
  "inline-flex items-center justify-center gap-1.5 rounded-full border px-5 py-2.5 text-[13px] font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40";

const PRIMARY =
  "border-transparent bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-[0_6px_16px_rgba(124,58,237,0.35)] hover:not-disabled:opacity-95";

const NEUTRAL =
  "border-[#e9e2ff] bg-white text-slate-700 shadow-sm hover:not-disabled:border-[#7c3aed]/40 hover:not-disabled:bg-[#f8f6ff]";

const BUY =
  "border-transparent bg-emerald-600 text-white shadow-[0_6px_16px_rgba(22,163,74,0.3)] hover:not-disabled:bg-emerald-500";

interface ActionBarProps {
  state: GameState;
  isMyTurn: boolean;
  canBuy: boolean;
  diceRolling: boolean;
  act: (action: GameAction) => void;
  onRollStart: () => void;
}

/**
 * Only shows the action that is relevant right now (roll → buy → end turn / jail).
 */
export function ActionBar({
  state,
  isMyTurn,
  canBuy,
  diceRolling,
  act,
  onRollStart,
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

  // Jail branch
  if (inJail) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-2 px-1 py-1">
        <button
          type="button"
          className={cx(BUTTON, PRIMARY)}
          disabled={blocked}
          onClick={() => {
            onRollStart();
            act({ type: "NEXT" });
          }}
        >
          🎲 Roll for doubles
        </button>
        <button
          type="button"
          className={cx(BUTTON, NEUTRAL)}
          disabled={me.money < 50}
          onClick={() => act({ type: "PAY_JAIL_FINE" })}
        >
          Pay $50
        </button>
        {(me.communityChestJailCard || me.chanceJailCard) && (
          <button
            type="button"
            className={cx(BUTTON, NEUTRAL)}
            onClick={() => act({ type: "USE_JAIL_CARD" })}
          >
            Use card
          </button>
        )}
      </div>
    );
  }

  // Buy opportunity
  if (canBuy) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-2 px-1 py-1">
        <button
          type="button"
          className={cx(BUTTON, BUY)}
          onClick={() => act({ type: "BUY" })}
        >
          Buy ${price}
        </button>
        <button
          type="button"
          className={cx(BUTTON, NEUTRAL)}
          onClick={() => act({ type: "DECLINE_BUY" })}
        >
          Decline
        </button>
      </div>
    );
  }

  // Roll
  if (canRoll || diceRolling) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-2 px-1 py-1">
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
          🎲 {rollLabel}
        </button>
      </div>
    );
  }

  // End turn
  if (canEndTurn) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-2 px-1 py-1">
        <button
          type="button"
          className={cx(BUTTON, PRIMARY)}
          onClick={() => act({ type: "NEXT" })}
        >
          ▶ End Turn
        </button>
      </div>
    );
  }

  // Spectator / waiting
  return (
    <div className="flex items-center justify-center px-1 py-1">
      <span className="rounded-full border border-[#e9e2ff] bg-white px-4 py-2 text-[12px] font-semibold text-slate-400 shadow-sm">
        {isMyTurn ? "Resolving…" : "Waiting for turn…"}
      </span>
    </div>
  );
}
