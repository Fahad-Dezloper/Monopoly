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
  act: (action: GameAction) => void;
}

export function CardDialog({ state, act }: CardDialogProps) {
  const [dismissed, setDismissed] = useState<string | null>(null);
  const popup = state.popup;
  if (!popup?.open) return null;

  const key = popup.resolveId ?? popup.message;
  if (dismissed === key) return null;

  const actor = state.players[state.turn];
  const mine = !!actor?.human;
  const isFortune = popup.title?.toLowerCase() === "fortune";
  const accent = isFortune ? "#C589FA" : popup.title ? "#86D6F7" : "#6c5ce7";

  return (
    <Dialog
      eyebrow={mine ? "Your draw" : `${actor?.name}'s draw`}
      title={popup.title ?? "Board event"}
      subtitle={mine ? undefined : "You are watching this one play out"}
      accent={accent}
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
            Dismiss
          </button>
        )
      }
    >
      <p className="text-[15px] leading-relaxed font-medium text-body">
        {popup.message}
      </p>
      {!mine && (
        <p className="mt-3 text-[12px] text-dim">
          {actor?.name} has to confirm this before the turn continues.
        </p>
      )}
    </Dialog>
  );
}
