"use client";

import { BuildMarker } from "@/components/game/board/BuildMarker";
import { currentRent, groupLabel, playerHoldings } from "@/lib/monopoly/stats";
import { ownedBy } from "@/lib/monopoly/stats";
import type { GameState, Player } from "@/lib/monopoly/types";
import {
  cx,
  dialogCard,
  liveBar,
  overlay,
  overlayWrap,
  panelClose,
} from "@/lib/ui";

interface PlayerDetailsDialogProps {
  state: GameState;
  player: Player;
  isYou: boolean;
  tint: string;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line-soft py-2 text-[12px] text-dim last:border-b-0">
      <span>{label}</span>
      <span className="font-bold tabular-nums text-body">{value}</span>
    </div>
  );
}

export function PlayerDetailsDialog({
  state,
  player,
  isYou,
  tint,
  onClose,
}: PlayerDetailsDialogProps) {
  const holdings = playerHoldings(state, player.index);
  const deeds = ownedBy(state, player.index);
  const jailCards =
    (player.communityChestJailCard ? 1 : 0) + (player.chanceJailCard ? 1 : 0);

  return (
    <>
      <div className={overlay} onClick={onClose} />
      <div className={overlayWrap}>
        <div className={cx(dialogCard, "w-[min(420px,100%)]")}>
          <div
            className={cx(liveBar, "flex items-center justify-between")}
            style={{ background: tint, color: "#1a1a1a" }}
          >
            <span>{isYou ? `${player.name} (you)` : player.name}</span>
            <button
              type="button"
              className={cx(panelClose, "text-ink")}
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="px-3.5 py-2">
            <Row label="Cash in hand" value={`$ ${holdings.cash.toLocaleString()}`} />
            <Row
              label="Invested in property"
              value={`$ ${holdings.invested.toLocaleString()}`}
            />
            <Row
              label="Net worth"
              value={`$ ${(holdings.cash + holdings.invested).toLocaleString()}`}
            />
            <Row
              label="Rent per landing"
              value={`$ ${holdings.rentPerLanding.toLocaleString()}`}
            />
            <Row label="Properties" value={String(holdings.deeds)} />
            <Row label="Complete sets" value={String(holdings.sets)} />
            <Row label="Houses" value={String(holdings.houses)} />
            <Row label="Hotels" value={String(holdings.hotels)} />
            <Row label="Mortgaged" value={String(holdings.mortgaged)} />
            <Row label="Get out of jail cards" value={String(jailCards)} />
            <Row
              label="Status"
              value={
                player.position < 0
                  ? "Eliminated"
                  : player.jail
                    ? "In jail"
                    : "Playing"
              }
            />
          </div>

          <div className="border-t border-line px-3.5 py-3">
            <div className="mb-2 text-[10px] font-bold tracking-[0.08em] text-dim uppercase">
              Property list
            </div>
            {deeds.length === 0 && (
              <div className="text-[12px] text-dim">No properties yet.</div>
            )}
            <div className="flex max-h-60 flex-col gap-1 overflow-y-auto">
              {deeds.map((square) => (
                <div
                  key={square.index}
                  className={cx(
                    "flex items-center gap-2 rounded-chip border border-line bg-surface-2 px-2 py-1.5 text-[12px]",
                    square.mortgage && "opacity-60",
                  )}
                >
                  <span
                    className="h-4 w-2 shrink-0 rounded-xs"
                    style={{ background: square.color }}
                  />
                  <span className="min-w-0 flex-1 truncate">{square.name}</span>
                  <BuildMarker square={square} compact />
                  {square.mortgage ? (
                    <span className="text-[10px] font-bold text-warn uppercase">
                      mortgaged
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold tabular-nums text-good">
                      $ {currentRent(state, square)}
                    </span>
                  )}
                  <span className="text-[10px] text-dim">
                    {groupLabel(square)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
