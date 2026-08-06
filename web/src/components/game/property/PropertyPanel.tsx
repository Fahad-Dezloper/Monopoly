"use client";

import { AuctionView } from "@/components/game/property/views/AuctionView";
import { DealPendingView } from "@/components/game/property/views/DealPendingView";
import { DeedView } from "@/components/game/property/views/DeedView";
import { GameOverView } from "@/components/game/property/views/GameOverView";
import { IdleView } from "@/components/game/property/views/IdleView";
import { LandedBuyView } from "@/components/game/property/views/LandedBuyView";
import { LandedShortView } from "@/components/game/property/views/LandedShortView";
import { RentDueView } from "@/components/game/property/views/RentDueView";
import { SpecialTileView } from "@/components/game/property/views/SpecialTileView";
import type { GameAction } from "@/lib/monopoly/engine";
import { resolvePanelView, type PanelView } from "@/lib/monopoly/panelView";
import type { GameState } from "@/lib/monopoly/types";

interface PropertyPanelProps {
  state: GameState;
  mySeat: number | null;
  isMyTurn: boolean;
  selectedIndex: number | null;
  act: (action: GameAction) => void;
  onOpenTrade: (recipient?: number) => void;
  onClose: () => void;
  forcedView?: PanelView;
}

export function PropertyPanel({
  state,
  mySeat,
  isMyTurn,
  selectedIndex,
  act,
  onOpenTrade,
  onClose,
  forcedView,
}: PropertyPanelProps) {
  const view =
    forcedView ?? resolvePanelView({ state, mySeat, isMyTurn, selectedIndex });

  return (
    <aside className="flex h-full min-h-0 flex-col max-[1080px]:order-3">
      {view.kind === "idle" && <IdleView state={state} mySeat={mySeat} />}

      {view.kind === "gameOver" && (
        <GameOverView state={state} winner={view.winner} mySeat={mySeat} />
      )}

      {view.kind === "auction" && (
        <AuctionView
          state={state}
          square={view.square}
          highestBid={view.highestBid}
          highestBidder={view.highestBidder}
        />
      )}

      {view.kind === "dealPending" && (
        <DealPendingView
          state={state}
          mySeat={mySeat}
          onOpenTrade={onOpenTrade}
        />
      )}

      {view.kind === "landedBuy" && (
        <LandedBuyView
          state={state}
          square={view.square}
          price={view.price}
          cashAfter={view.cashAfter}
          mySeat={mySeat}
          act={act}
        />
      )}

      {view.kind === "landedShort" && (
        <LandedShortView
          state={state}
          square={view.square}
          price={view.price}
          shortBy={view.shortBy}
          mySeat={mySeat}
          act={act}
          onOpenTrade={onOpenTrade}
        />
      )}

      {view.kind === "rentDue" && (
        <RentDueView
          state={state}
          square={view.square}
          rent={view.rent}
          owner={view.owner}
          mySeat={mySeat}
          act={act}
          onOpenTrade={onOpenTrade}
        />
      )}

      {view.kind === "specialTile" && (
        <SpecialTileView state={state} square={view.square} onClose={onClose} />
      )}

      {view.kind === "deed" && (
        <DeedView
          state={state}
          square={view.square}
          relation={view.relation}
          mySeat={mySeat}
          isMyTurn={isMyTurn}
          act={act}
          onOpenTrade={onOpenTrade}
          onClose={onClose}
        />
      )}
    </aside>
  );
}
