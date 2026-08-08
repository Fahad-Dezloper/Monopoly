"use client";

import type { GameAction } from "@/lib/monopoly/engine";
import type { GameState } from "@/lib/monopoly/types";
import { cx } from "@/lib/ui";

const BUTTON =
  "inline-flex items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-[12px] font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40";

const PRIMARY =
  "border-transparent bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-[0_4px_12px_rgba(124,58,237,0.35)] hover:not-disabled:opacity-95";

const NEUTRAL =
  "border-white/25 bg-white/90 text-slate-800 shadow-sm hover:not-disabled:bg-white";

const BUY =
  "border-transparent bg-emerald-600 text-white shadow-[0_4px_12px_rgba(22,163,74,0.3)] hover:not-disabled:bg-emerald-500";

const DANGER =
  "border-rose-300/80 bg-white/90 text-rose-600 hover:not-disabled:bg-rose-50";

interface ActionBarProps {
  state: GameState;
  isMyTurn: boolean;
  canBuy: boolean;
  diceRolling: boolean;
  canTrade?: boolean;
  act: (action: GameAction) => void;
  onRollStart: () => void;
  onOpenTrade?: () => void;
}

export function ActionBar({
  state,
  isMyTurn,
  canBuy,
  diceRolling,
  canTrade = false,
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
  const inJail = isMyTurn && !!me?.jail && !state.diceRolled;
  const price = state.squares[me?.position ?? 0]?.price ?? 0;
  const declined =
    typeof state.landedMessage === "string" &&
    state.landedMessage.toLowerCase().includes("declined");
  const showBuy = canBuy && !declined;

  const rollLabel = diceRolling
    ? "Rolling…"
    : state.doubleCount > 0 && state.diceRolled
      ? "Roll Again"
      : "Roll Dice";

  const primary = (() => {
    if (inJail) {
      return (
        <>
          <button
            type="button"
            className={cx(BUTTON, PRIMARY)}
            disabled={blocked}
            onClick={() => {
              onRollStart();
              act({ type: "NEXT" });
            }}
          >
            🎲 Roll doubles
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
        </>
      );
    }

    if (showBuy) {
      return (
        <>
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
        </>
      );
    }

    if (canRoll || diceRolling) {
      return (
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
      );
    }

    if (canEndTurn) {
      return (
        <button
          type="button"
          className={cx(BUTTON, PRIMARY)}
          onClick={() => act({ type: "NEXT" })}
        >
          ▶ End Turn
        </button>
      );
    }

    return (
      <span className="rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-[11px] font-semibold text-white/70">
        {isMyTurn ? "Resolving…" : "Waiting…"}
      </span>
    );
  })();

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 px-1 py-0.5">
      {primary}

      {canTrade && onOpenTrade && state.phase !== "auction" && (
        <button
          type="button"
          className={cx(BUTTON, NEUTRAL)}
          disabled={!isMyTurn || state.phase === "game_over"}
          onClick={onOpenTrade}
          title="Propose a trade"
        >
          ⇄ Trade
        </button>
      )}

      {state.phase === "auction" && (
        <button type="button" className={cx(BUTTON, NEUTRAL)} disabled>
          🔨 Auction live
        </button>
      )}

      {isMyTurn && state.phase !== "game_over" && (
        <button
          type="button"
          className={cx(BUTTON, DANGER)}
          onClick={() => {
            if (confirm("Resign and hand your assets over?")) {
              act({ type: "RESIGN" });
            }
          }}
        >
          ☠ Bankrupt
        </button>
      )}
    </div>
  );
}
