"use client";

import { cardColor } from "@/components/game/rail/playerPalette";
import { money } from "@/lib/monopoly/panelView";
import {
  groupLabel,
  groupProgress,
  playerHoldings,
} from "@/lib/monopoly/stats";
import type { GameState, Player, Square } from "@/lib/monopoly/types";

interface OwnerSummaryProps {
  state: GameState;
  square: Square;
  owner: Player;
  isMine: boolean;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase() || "??";
}

export function OwnerSummary({
  state,
  square,
  owner,
  isMine,
}: OwnerSummaryProps) {
  const progress = groupProgress(state, square);
  const holdings = playerHoldings(state, owner.index);
  const tint = cardColor(owner.index);
  const complete = progress.total > 0 && progress.owned === progress.total;

  return (
    <section className="overflow-hidden rounded-sm border border-line">
      <header
        className="flex items-center gap-2.5 px-2.5 py-2"
        style={{
          background: `color-mix(in srgb, ${tint} 22%, var(--color-surface-2))`,
        }}
      >
        <span
          className="grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-extrabold text-ink"
          style={{ background: tint }}
          aria-hidden
        >
          {initials(owner.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[9px] font-bold tracking-[0.08em] text-dim uppercase">
            {isMine ? "You own this" : "Owned by"}
          </span>
          <span className="block truncate text-[13px] font-bold text-body">
            {owner.name}
          </span>
        </span>
        {complete && (
          <span
            className="shrink-0 rounded-xs px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-ink uppercase"
            style={{ background: tint }}
          >
            Full set
          </span>
        )}
      </header>

      {progress.total > 0 && (
        <div className="flex items-center justify-between gap-2 border-t border-line px-2.5 py-2">
          <span className="text-[11px] text-dim">
            {progress.owned} of {progress.total} · {groupLabel(square)}
          </span>
          <span className="flex gap-1">
            {Array.from({ length: progress.total }).map((_, index) => (
              <span
                key={index}
                className="h-1.5 w-5 rounded-full"
                style={{
                  background:
                    index < progress.owned ? tint : "var(--color-line)",
                }}
              />
            ))}
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 divide-x divide-line border-t border-line">
        {[
          { label: "Cash", value: money(holdings.cash) },
          { label: "Places", value: String(holdings.deeds) },
          { label: "Rent", value: money(holdings.rentPerLanding) },
        ].map((stat) => (
          <div key={stat.label} className="px-2 py-1.5 text-center">
            <div className="text-[9px] font-bold tracking-[0.06em] text-dim uppercase">
              {stat.label}
            </div>
            <div className="text-[12px] font-bold tabular-nums text-body">
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
