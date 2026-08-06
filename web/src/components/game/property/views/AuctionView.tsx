"use client";

import {
  PanelNote,
  PanelSection,
  PanelShell,
  PanelStat,
} from "@/components/game/property/PanelShell";
import { RentTable } from "@/components/game/property/RentTable";
import { money } from "@/lib/monopoly/panelView";
import type { GameState, Square } from "@/lib/monopoly/types";

interface AuctionViewProps {
  state: GameState;
  square: Square;
  highestBid: number;
  highestBidder: number;
}

export function AuctionView({
  state,
  square,
  highestBid,
  highestBidder,
}: AuctionViewProps) {
  const leader = highestBidder > 0 ? state.players[highestBidder] : null;
  const bidder = state.auction
    ? state.players[state.auction.currentBidder]
    : null;

  return (
    <PanelShell
      eyebrow="Auction live"
      title={square.name}
      subtitle={`List price ${money(square.price)}`}
      accent={square.color}
      tone="alert"
    >
      <PanelSection label="Bidding">
        <PanelStat
          label="Highest bid"
          value={highestBid > 0 ? money(highestBid) : "No bids yet"}
          tone={highestBid > 0 ? "good" : "body"}
        />
        <PanelStat label="Leading" value={leader?.name ?? "—"} />
        <PanelStat label="On the clock" value={bidder?.name ?? "—"} />
      </PanelSection>

      <PanelNote>
        Bid from the auction window. The winner pays their bid, not the list
        price — a bargain here changes the whole colour set.
      </PanelNote>

      <PanelSection label="What it earns">
        <RentTable square={square} />
      </PanelSection>
    </PanelShell>
  );
}
