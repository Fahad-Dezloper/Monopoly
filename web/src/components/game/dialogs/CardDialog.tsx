"use client";

import { useState } from "react";
import {
  Dialog,
  dialogGhost,
  dialogPrimary,
} from "@/components/game/dialogs/Dialog";
import type { GameAction } from "@/lib/monopoly/engine";
import type { GameState } from "@/lib/monopoly/types";

interface CardDialogProps {
  state: GameState;
  mySeat: number | null;
  act: (action: GameAction) => void;
  /** Hold the modal closed until the token finishes hopping. */
  ready?: boolean;
}

export function CardDialog({
  state,
  mySeat,
  act,
  ready = true,
}: CardDialogProps) {
  const [dismissed, setDismissed] = useState<string | null>(null);
  const popup = state.popup;

  if (!ready || !popup?.open) return null;

  const key = popup.resolveId ?? popup.message;
  if (dismissed === key) return null;

  const actor = state.players[state.turn];
  // Prefer seat match — `human` is often false on-chain.
  const mine = mySeat != null ? state.turn === mySeat : !!actor?.human;
  const isFortune = popup.title?.toLowerCase() === "fortune";
  const isTreasury =
    popup.title?.toLowerCase() === "treasury" ||
    popup.title?.toLowerCase() === "community chest";
  const accent = isFortune ? "#C589FA" : isTreasury ? "#38bdf8" : "#7c3aed";

  return (
    <Dialog
      eyebrow={mine ? "Your turn" : `${actor?.name ?? "Player"}'s event`}
      title={popup.title ?? "Board event"}
      subtitle={
        mine
          ? "Read it, then continue."
          : "Watching — they must confirm before play continues."
      }
      accent={accent}
      size="sm"
      onClose={mine ? undefined : () => setDismissed(key)}
      closeLabel="Dismiss"
      footer={
        mine ? (
          <div className="flex gap-2">
            {popup.mode === "yesno" ? (
              <>
                <button
                  type="button"
                  className={dialogPrimary}
                  onClick={() => act({ type: "POPUP_YES" })}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={dialogGhost}
                  onClick={() => act({ type: "POPUP_NO" })}
                >
                  No
                </button>
              </>
            ) : (
              <button
                type="button"
                className={dialogPrimary}
                autoFocus
                onClick={() => act({ type: "POPUP_OK" })}
              >
                Got it — continue
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            className={dialogGhost}
            onClick={() => setDismissed(key)}
          >
            Close preview
          </button>
        )
      }
    >
      <div className="rounded-2xl border border-[#e9e2ff] bg-gradient-to-br from-[#f8f6ff] to-white p-4 shadow-sm">
        <p className="text-[15px] leading-relaxed font-semibold text-slate-800">
          {popup.message}
        </p>
      </div>
      {!mine && (
        <p className="mt-3 text-[12px] font-medium text-slate-500">
          Waiting on {actor?.name ?? "the current player"} to confirm.
        </p>
      )}
    </Dialog>
  );
}
