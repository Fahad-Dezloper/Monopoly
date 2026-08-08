"use client";

import type { GameAction } from "@/lib/monopoly/engine";
import type { GameState, Player, Square } from "@/lib/monopoly/types";
import { cx, input, panelClose } from "@/lib/ui";
import {
  dialogDanger,
  dialogGhost,
  dialogPrimary,
} from "@/components/game/dialogs/Dialog";

interface TradeDialogProps {
  state: GameState;
  mySeat: number | null;
  act: (action: GameAction) => void;
  onClose: () => void;
}

export function TradeDialog({ state, mySeat, act, onClose }: TradeDialogProps) {
  const trade = state.trade;
  if (!trade) return null;

  const initiator = state.players[trade.initiator];
  const recipient = state.players[trade.recipient];
  // A malformed draft must not take the whole screen down with it.
  if (!initiator || !recipient) return null;
  const iAmRecipient = mySeat === trade.recipient;

  const tradableFor = (seat: number): Square[] =>
    state.squares.filter(
      (square) =>
        square.owner === seat &&
        square.groupNumber > 0 &&
        square.house === 0 &&
        square.group.every((index) => state.squares[index].house === 0),
    );

  const toggleProperty = (index: number, side: "left" | "right") => {
    const properties = [...trade.properties];
    if (side === "left") {
      properties[index] = properties[index] === 1 ? 0 : 1;
    } else {
      properties[index] = properties[index] === -1 ? 0 : -1;
    }
    act({ type: "UPDATE_TRADE", trade: { ...trade, properties } });
  };

  const setMoney = (field: "leftMoney" | "rightMoney", value: number) =>
    act({
      type: "UPDATE_TRADE",
      trade: { ...trade, [field]: value, awaitingResponse: false },
    });

  const columns: { seat: number; side: "left" | "right"; player: Player }[] = [
    { seat: trade.initiator, side: "left", player: initiator },
    { seat: trade.recipient, side: "right", player: recipient },
  ];

  return (
    <div
      className="fixed inset-0 z-60 grid place-items-center bg-slate-900/35 p-5 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[86vh] w-[min(720px,100%)] flex-col overflow-auto rounded-3xl border border-[#e9e2ff] bg-white text-slate-800 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label="Trade"
      >
        <header className="flex items-center justify-between bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-4 py-3.5 text-[13px] font-bold text-white">
          <span>
            Deal · {initiator.name} ⇄ {recipient.name}
          </span>
          <button
            type="button"
            className={cx(panelClose, "text-white/80 hover:text-white")}
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        <div className="grid grid-cols-2 gap-3 p-4 max-[720px]:grid-cols-1">
          {columns.map(({ seat, side, player }) => (
            <div
              key={side}
              className="flex min-w-0 flex-col gap-2 rounded-2xl border border-[#e9e2ff] bg-[#fdfcff] p-3"
            >
              <div className="text-[13px] font-extrabold text-slate-800">
                {side === "right" && state.playerCount > 2 ? (
                  <select
                    className={input}
                    value={trade.recipient}
                    onChange={(event) =>
                      act({
                        type: "OPEN_TRADE",
                        recipient: Number(event.target.value),
                      })
                    }
                  >
                    {state.players
                      .filter(
                        (option) =>
                          option.index > 0 &&
                          option.index !== trade.initiator &&
                          option.position >= 0,
                      )
                      .map((option) => (
                        <option key={option.index} value={option.index}>
                          {option.name}
                        </option>
                      ))}
                  </select>
                ) : (
                  player.name
                )}
              </div>

              <label className="flex flex-col gap-1 text-[11px] font-extrabold tracking-wider text-[#7c3aed] uppercase">
                <span>Cash</span>
                <input
                  className={input}
                  type="number"
                  min={0}
                  value={side === "left" ? trade.leftMoney : trade.rightMoney}
                  onChange={(event) =>
                    setMoney(
                      side === "left" ? "leftMoney" : "rightMoney",
                      Number(event.target.value) || 0,
                    )
                  }
                />
              </label>

              <div className="flex max-h-55 flex-col gap-1 overflow-y-auto">
                {tradableFor(seat).length === 0 && (
                  <div className="text-[11px] text-slate-400">
                    No tradable deeds.
                  </div>
                )}
                {tradableFor(seat).map((square) => (
                  <label
                    key={square.index}
                    className="flex items-center gap-1.75 rounded-lg px-1.5 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-white"
                  >
                    <input
                      type="checkbox"
                      checked={
                        side === "left"
                          ? trade.properties[square.index] === 1
                          : trade.properties[square.index] === -1
                      }
                      onChange={() => toggleProperty(square.index, side)}
                    />
                    <span
                      className="size-2.5 shrink-0 rounded-[3px]"
                      style={{ background: square.color }}
                    />
                    {square.name}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 border-t border-[#e9e2ff] bg-[#fdfcff] px-4 py-3">
          {!trade.awaitingResponse ? (
            <>
              <button
                type="button"
                className={dialogPrimary}
                onClick={() => act({ type: "PROPOSE_TRADE" })}
              >
                Propose deal
              </button>
              <button
                type="button"
                className={dialogGhost}
                onClick={() => {
                  act({ type: "CANCEL_TRADE" });
                  onClose();
                }}
              >
                Cancel
              </button>
            </>
          ) : iAmRecipient ? (
            <>
              <button
                type="button"
                className={dialogPrimary}
                onClick={() => act({ type: "ACCEPT_TRADE" })}
              >
                Accept
              </button>
              <button
                type="button"
                className={dialogDanger}
                onClick={() => act({ type: "CANCEL_TRADE" })}
              >
                Reject
              </button>
            </>
          ) : (
            <button
              type="button"
              className={dialogGhost}
              onClick={() => {
                act({ type: "CANCEL_TRADE" });
                onClose();
              }}
            >
              Cancel proposal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
