"use client";

import type { GameAction } from "@/lib/monopoly/engine";
import type { GameState, Player, Square } from "@/lib/monopoly/types";
import { btn, cx, input, panelClose } from "@/lib/ui";

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
    <div className="fixed inset-0 z-60 grid place-items-center bg-black/65 p-5" onClick={onClose}>
      <div
        className="flex max-h-[86vh] w-[min(720px,100%)] flex-col overflow-auto rounded-panel border border-line bg-surface shadow-panel"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label="Trade"
      >
        <header className="flex items-center justify-between bg-accent px-3.5 py-3 text-[13px] font-bold text-white">
          <span>
            Deal · {initiator.name} ⇄ {recipient.name}
          </span>
          <button type="button" className={panelClose} onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="grid grid-cols-2 gap-3 p-3.5 max-[720px]:grid-cols-1">
          {columns.map(({ seat, side, player }) => (
            <div key={side} className="flex min-w-0 flex-col gap-2 rounded-[11px] border border-line bg-surface-2 p-2.5">
              <div className="text-[13px] font-bold" style={{ color: player.color }}>
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

              <label className="flex flex-col gap-1 text-[11px] text-dim">
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
                  <div className="text-[11px] text-dim">No tradable deeds.</div>
                )}
                {tradableFor(seat).map((square) => (
                  <label key={square.index} className="flex items-center gap-1.75 px-0.5 py-1 text-[12px]">
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

        <div className="flex gap-2 border-t border-line px-3.5 py-3">
          {!trade.awaitingResponse ? (
            <>
              <button
                type="button"
                className={cx(btn, "flex-1 border-accent bg-accent text-white hover:not-disabled:border-accent-hover hover:not-disabled:bg-accent-hover")}
                onClick={() => act({ type: "PROPOSE_TRADE" })}
              >
                Propose deal
              </button>
              <button
                type="button"
                className={cx(btn, "flex-1")}
                onClick={() => {
                  act({ type: "CANCEL_TRADE" });
                  onClose();
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={cx(btn, "flex-1 border-accent bg-accent text-white hover:not-disabled:border-accent-hover hover:not-disabled:bg-accent-hover")}
                disabled={!iAmRecipient}
                title={iAmRecipient ? "" : "Waiting for the other player"}
                onClick={() => act({ type: "ACCEPT_TRADE" })}
              >
                {iAmRecipient ? "Accept" : "Waiting for reply…"}
              </button>
              <button
                type="button"
                className={cx(btn, "flex-1 border-bad/35 text-[#f07a8a]")}
                onClick={() => {
                  act({ type: "CANCEL_TRADE" });
                  onClose();
                }}
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
