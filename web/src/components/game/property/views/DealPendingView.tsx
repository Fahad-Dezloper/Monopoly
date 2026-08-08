"use client";

import {
  PanelNote,
  PanelSection,
  PanelShell,
  PanelStat,
} from "@/components/game/property/PanelShell";
import { money } from "@/lib/monopoly/panelView";
import type { GameState } from "@/lib/monopoly/types";
import { btn, cx } from "@/lib/ui";

interface DealPendingViewProps {
  state: GameState;
  mySeat: number | null;
  onOpenTrade: (recipient?: number) => void;
}

export function DealPendingView({
  state,
  mySeat,
  onOpenTrade,
}: DealPendingViewProps) {
  const trade = state.trade;
  if (!trade) return null;

  const initiator = state.players[trade.initiator];
  const recipient = state.players[trade.recipient];
  const offered = trade.properties.filter((value) => value === 1).length;
  const requested = trade.properties.filter((value) => value === -1).length;
  const iAmRecipient = mySeat === trade.recipient;

  return (
    <PanelShell
      eyebrow={
        trade.awaitingResponse ? "Offer on the table" : "Building a deal"
      }
      title={`${initiator?.name} ⇄ ${recipient?.name}`}
      subtitle={
        trade.awaitingResponse
          ? iAmRecipient
            ? "Waiting on your answer"
            : `Waiting on ${recipient?.name}`
          : "Nothing sent yet"
      }
      accent="#6c5ce7"
      footer={
        <button
          type="button"
          className={cx(btn, "w-full border-accent bg-accent text-white")}
          onClick={() => onOpenTrade(trade.recipient)}
        >
          {iAmRecipient && trade.awaitingResponse
            ? "Review offer"
            : "Open deal sheet"}
        </button>
      }
    >
      <PanelSection label={`${initiator?.name} gives`}>
        <PanelStat label="Cash" value={money(trade.leftMoney)} />
        <PanelStat label="Deeds" value={String(offered)} />
      </PanelSection>

      <PanelSection label={`${recipient?.name} gives`}>
        <PanelStat label="Cash" value={money(trade.rightMoney)} />
        <PanelStat label="Deeds" value={String(requested)} />
      </PanelSection>

      <PanelNote>
        Deeds with houses on them cannot be traded — sell the buildings first.
      </PanelNote>
    </PanelShell>
  );
}
