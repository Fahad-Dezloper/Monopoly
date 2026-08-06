"use client";

import { useState } from "react";
import {
  Dialog,
  dialogDanger,
  dialogGhost,
  dialogPrimary,
} from "@/components/game/dialogs/Dialog";
import { cardColor } from "@/components/game/rail/playerPalette";
import type { GameAction } from "@/lib/monopoly/engine";
import { money } from "@/lib/monopoly/panelView";
import type { GameState } from "@/lib/monopoly/types";
import { cx } from "@/lib/ui";

const BID_STEPS = [2, 10, 25, 50] as const;

interface AuctionDialogProps {
  state: GameState;
  act: (action: GameAction) => void;
  onShowDeed: (index: number | null) => void;
}

export function AuctionDialog({ state, act, onShowDeed }: AuctionDialogProps) {
  const [minimised, setMinimised] = useState(false);
  const auction = state.auction;
  if (!auction) return null;

  const square = state.squares[auction.propertyIndex];
  const bidder = state.players[auction.currentBidder];
  const leader = auction.highestBidder > 0 ? state.players[auction.highestBidder] : null;
  const myTurn = !!bidder?.human;
  const me = state.players.find((player) => player.human);
  const inRace = state.players.filter(
    (player) => player.index > 0 && player.index <= state.playerCount && player.bidding,
  );

  if (minimised) {
    return (
      <button
        type="button"
        onClick={() => setMinimised(false)}
        className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-sm border border-accent bg-surface px-4 py-2.5 shadow-panel"
      >
        <span className="size-2 animate-clock-pulse rounded-full bg-accent" />
        <span className="text-[12.5px] font-bold text-body">
          Auction · {square.name}
        </span>
        <span className="text-[12.5px] font-semibold text-dim">
          {auction.highestBid > 0 ? money(auction.highestBid) : "no bids"} ·{" "}
          {myTurn ? "your bid" : `${bidder?.name}'s turn`}
        </span>
        <span className="text-[11px] font-bold text-accent uppercase">Open</span>
      </button>
    );
  }

  return (
    <Dialog
      eyebrow="Live auction"
      title={square.name}
      subtitle={
        <>
          List price {money(square.price)} · nobody bought it, so it goes to the
          highest bidder
        </>
      }
      accent={square.color}
      size="md"
      onClose={() => setMinimised(true)}
      closeLabel="Minimise"
      footer={
        myTurn ? (
          <div className="flex gap-2">
            <button
              type="button"
              className={dialogGhost}
              onClick={() => act({ type: "AUCTION_PASS" })}
            >
              Pass this round
            </button>
            <button
              type="button"
              className={dialogDanger}
              onClick={() => act({ type: "AUCTION_EXIT" })}
            >
              Withdraw
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={dialogGhost}
            onClick={() => setMinimised(true)}
          >
            Minimise — I&apos;ll watch from the board
          </button>
        )
      }
    >
      <div className="flex items-center justify-between gap-4 rounded-sm border border-line bg-surface-2 px-4 py-3">
        <div>
          <div className="text-[10px] font-bold tracking-[0.1em] text-dim uppercase">
            Highest bid
          </div>
          <div className="text-[26px] leading-none font-extrabold tabular-nums text-good">
            {auction.highestBid > 0 ? money(auction.highestBid) : "—"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold tracking-[0.1em] text-dim uppercase">
            Leading
          </div>
          <div className="text-[14px] font-bold text-body">
            {leader?.name ?? "No bids yet"}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-[10px] font-bold tracking-[0.1em] text-dim uppercase">
          Still bidding
        </div>
        <div className="flex flex-wrap gap-1.5">
          {inRace.map((player) => (
            <span
              key={player.index}
              className={cx(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold",
                player.index === auction.currentBidder
                  ? "border-accent bg-accent/15 text-body"
                  : "border-line text-dim",
              )}
            >
              <span
                className="size-2 rounded-full"
                style={{ background: cardColor(player.index) }}
              />
              {player.human ? "You" : player.name}
              {player.index === auction.currentBidder && " · deciding"}
            </span>
          ))}
        </div>
      </div>

      {myTurn ? (
        <div className="mt-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[10px] font-bold tracking-[0.1em] text-dim uppercase">
              Your bid
            </span>
            <span className="text-[11.5px] text-dim">
              You hold {money(Math.floor(bidder.money))}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {BID_STEPS.map((step) => {
              const amount = auction.highestBid + step;
              const affordable = bidder.money >= amount;
              return (
                <button
                  key={step}
                  type="button"
                  disabled={!affordable}
                  onClick={() => act({ type: "AUCTION_BID", amount })}
                  className={cx(
                    dialogPrimary,
                    "h-12 flex-col gap-0 leading-tight",
                  )}
                  title={affordable ? undefined : "Not enough cash"}
                >
                  <span className="text-[15px]">{money(amount)}</span>
                  <span className="text-[10px] font-semibold opacity-75">
                    +{step}
                  </span>
                </button>
              );
            })}
          </div>
          {auction.message && (
            <p className="mt-2 rounded-sm border border-bad/35 bg-bad/10 px-3 py-2 text-[12px] text-[#ffb3c0]">
              {auction.message}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-3 rounded-sm border border-line bg-surface-2 px-4 py-3.5">
          <span className="relative flex size-3 shrink-0">
            <span className="absolute inline-flex size-full animate-clock-pulse rounded-full bg-accent" />
          </span>
          <div>
            <div className="text-[13px] font-bold text-body">
              Waiting for {bidder?.name} to bid…
            </div>
            <div className="text-[11.5px] text-dim">
              {me?.bidding
                ? "You are still in — it comes back to you unless you win it."
                : "You withdrew from this auction."}
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        className="mt-4 w-full rounded-sm border border-dashed border-line px-3 py-2 text-[11.5px] text-dim hover:border-accent hover:text-body"
        onMouseEnter={() => onShowDeed(auction.propertyIndex)}
        onMouseLeave={() => onShowDeed(null)}
        onClick={() => onShowDeed(auction.propertyIndex)}
      >
        View {square.name} rent table in the side panel
      </button>
    </Dialog>
  );
}
