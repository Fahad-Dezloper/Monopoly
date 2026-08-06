"use client";

import { cardColor } from "@/components/game/rail/playerPalette";
import { playerHoldings } from "@/lib/monopoly/stats";
import type { GameState } from "@/lib/monopoly/types";
import { cx, feed } from "@/lib/ui";

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
    <div className={cx(feed, "gap-2")}>
      {trade && (
        <div className="rounded-chip border border-accent bg-accent/12 p-2.5">
          <div className="text-[11px] font-bold tracking-[0.06em] text-accent uppercase">
            {trade.awaitingResponse ? "Awaiting response" : "Deal in progress"}
          </div>
          <div className="mt-1 text-[12px] text-body">
            {state.players[trade.initiator]?.name} ⇄{" "}
            {state.players[trade.recipient]?.name}
          </div>
          <div className="mt-0.5 text-[11px] text-dim">
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
            className="mt-2 w-full rounded-chip bg-accent px-2 py-1.5 text-[12px] font-bold text-white hover:bg-accent-hover"
            onClick={() => onOpenTrade(trade.recipient)}
          >
            Open deal sheet
          </button>
        </div>
      )}

      <div className="text-[10px] font-bold tracking-[0.08em] text-dim uppercase">
        Trade with
      </div>

      {opponents.length === 0 && (
        <div className="text-[12px] text-dim">No one left to trade with.</div>
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
              "flex items-center gap-2 rounded-chip border border-line bg-surface-2 px-2.5 py-2 text-left transition-colors",
              canTrade
                ? "hover:border-accent"
                : "cursor-not-allowed opacity-45",
            )}
          >
            <span
              className="h-7 w-1.5 shrink-0 rounded-full"
              style={{ background: cardColor(player.index) }}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-bold text-body">
                {player.name}
              </span>
              <span className="block text-[10.5px] text-dim">
                {holdings.deeds} places · ${holdings.cash.toLocaleString()} cash
              </span>
            </span>
            <span className="shrink-0 text-[11px] font-bold text-accent">
              Offer
            </span>
          </button>
        );
      })}

      {!canTrade && (
        <div className="mt-1 text-[11px] text-dim">
          Deals can only be proposed on your turn.
        </div>
      )}
    </div>
  );
}
