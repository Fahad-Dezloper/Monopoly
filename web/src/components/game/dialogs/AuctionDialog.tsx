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
  const leader =
    auction.highestBidder > 0 ? state.players[auction.highestBidder] : null;
  const myTurn = !!bidder?.human;
  const me = state.players.find((player) => player.human);
  const inRace = state.players.filter(
    (player) =>
      player.index > 0 && player.index <= state.playerCount && player.bidding,
  );

  if (minimised) {
    return (
      <button
        type="button"
        onClick={() => setMinimised(false)}
        className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-[#e9e2ff] bg-white px-4 py-2.5 shadow-xl"
      >
        <span className="size-2 animate-clock-pulse rounded-full bg-[#7c3aed]" />
        <span className="text-[12.5px] font-bold text-slate-800">
          Auction · {square.name}
        </span>
        <span className="text-[12.5px] font-semibold text-slate-500">
          {auction.highestBid > 0 ? money(auction.highestBid) : "no bids"} ·{" "}
          {myTurn ? "your bid" : `${bidder?.name}'s turn`}
        </span>
        <span className="text-[11px] font-bold text-[#7c3aed] uppercase">
          Open
        </span>
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
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#e9e2ff] bg-[#f8f6ff] px-4 py-3">
        <div>
          <div className="text-[10px] font-extrabold tracking-[0.1em] text-[#7c3aed] uppercase">
            Highest bid
          </div>
          <div className="text-[26px] leading-none font-extrabold tabular-nums text-emerald-600">
            {auction.highestBid > 0 ? money(auction.highestBid) : "—"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-extrabold tracking-[0.1em] text-slate-400 uppercase">
            Leading
          </div>
          <div className="text-[14px] font-bold text-slate-800">
            {leader?.name ?? "No bids yet"}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-[10px] font-extrabold tracking-[0.1em] text-[#7c3aed] uppercase">
          Still bidding
        </div>
        <div className="flex flex-wrap gap-1.5">
          {inRace.map((player) => (
            <span
              key={player.index}
              className={cx(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold",
                player.index === auction.currentBidder
                  ? "border-[#7c3aed]/40 bg-[#f0ebff] text-slate-800"
                  : "border-[#e9e2ff] bg-white text-slate-500",
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
            <span className="text-[10px] font-extrabold tracking-[0.1em] text-[#7c3aed] uppercase">
              Your bid
            </span>
            <span className="text-[11.5px] text-slate-500">
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
            <p className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-semibold text-rose-600">
              {auction.message}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#e9e2ff] bg-[#f8f6ff] px-4 py-3.5">
          <span className="relative flex size-3 shrink-0">
            <span className="absolute inline-flex size-full animate-clock-pulse rounded-full bg-[#7c3aed]" />
          </span>
          <div>
            <div className="text-[13px] font-bold text-slate-800">
              Waiting for {bidder?.name} to bid…
            </div>
            <div className="text-[11.5px] text-slate-500">
              {me?.bidding
                ? "You are still in — it comes back to you unless you win it."
                : "You withdrew from this auction."}
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        className="mt-4 w-full rounded-xl border border-dashed border-[#e9e2ff] bg-white px-3 py-2 text-[11.5px] font-semibold text-slate-500 hover:border-[#7c3aed]/40 hover:bg-[#f8f6ff] hover:text-[#7c3aed]"
        onMouseEnter={() => onShowDeed(auction.propertyIndex)}
        onMouseLeave={() => onShowDeed(null)}
        onClick={() => onShowDeed(auction.propertyIndex)}
      >
        View {square.name} rent table in the side panel
      </button>
    </Dialog>
  );
}
