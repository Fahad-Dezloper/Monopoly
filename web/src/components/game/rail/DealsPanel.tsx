"use client";

import { cardColor } from "@/components/game/rail/playerPalette";
import { playerHoldings } from "@/lib/monopoly/stats";
import type { GameState } from "@/lib/monopoly/types";
import { cx } from "@/lib/ui";

interface DealsPanelProps {
  state: GameState;
  mySeat: number | null;
  canTrade: boolean;
  onOpenTrade: (recipient: number) => void;
}

export function DealsPanel({
  state,
  mySeat,
  canTrade,
  onOpenTrade,
}: DealsPanelProps) {
  const trade = state.trade;
  const opponents = state.players.filter(
    (player) =>
      player.index > 0 &&
      player.index <= state.playerCount &&
      player.index !== mySeat &&
      player.position >= 0 &&
      Number.isFinite(player.money),
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {trade && (
        <div className="rounded-2xl border border-[#7c3aed]/25 bg-[#f0ebff] p-2.5">
          <div className="text-[11px] font-extrabold tracking-[0.06em] text-[#7c3aed] uppercase">
            {trade.awaitingResponse ? "Awaiting response" : "Deal in progress"}
          </div>
          <div className="mt-1 text-[12px] font-semibold text-slate-800">
            {state.players[trade.initiator]?.name} ⇄{" "}
            {state.players[trade.recipient]?.name}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">
            {trade.leftMoney > 0 && `They put in $${trade.leftMoney}. `}
            {trade.rightMoney > 0 && `You put in $${trade.rightMoney}. `}
            {trade.properties.filter((value) => value !== 0).length} deed
            {trade.properties.filter((value) => value !== 0).length === 1
              ? ""
              : "s"}{" "}
            on the table
          </div>
          <button
            type="button"
            className="mt-2 w-full rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-2 py-1.5 text-[12px] font-bold text-white hover:opacity-95"
            onClick={() => onOpenTrade(trade.recipient)}
          >
            Open deal sheet
          </button>
        </div>
      )}

      <div className="text-[10px] font-extrabold tracking-[0.08em] text-[#7c3aed] uppercase">
        Trade with
      </div>

      {opponents.length === 0 && (
        <div className="text-[12px] text-slate-400">
          No one left to trade with.
        </div>
      )}

      {opponents.map((player) => {
        const holdings = playerHoldings(state, player.index);
        return (
          <button
            key={player.index}
            type="button"
            disabled={!canTrade}
            onClick={() => onOpenTrade(player.index)}
            className={cx(
              "flex items-center gap-2 rounded-xl border border-[#e9e2ff] bg-white px-2.5 py-2 text-left shadow-sm transition-colors",
              canTrade
                ? "hover:border-[#7c3aed]/40 hover:bg-[#f8f6ff]"
                : "cursor-not-allowed opacity-45",
            )}
          >
            <span
              className="h-7 w-1.5 shrink-0 rounded-full"
              style={{ background: cardColor(player.index) }}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-bold text-slate-800">
                {player.name}
              </span>
              <span className="block text-[10.5px] text-slate-400">
                {holdings.deeds} places · ${holdings.cash.toLocaleString()} cash
              </span>
            </span>
            <span className="shrink-0 text-[11px] font-bold text-[#7c3aed]">
              Offer
            </span>
          </button>
        );
      })}
    </div>
  );
}
