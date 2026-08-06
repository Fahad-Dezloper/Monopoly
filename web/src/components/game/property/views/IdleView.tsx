"use client";

import {
  PanelSection,
  PanelShell,
  PanelStat,
} from "@/components/game/property/PanelShell";
import { cardColor } from "@/components/game/rail/playerPalette";
import { money } from "@/lib/monopoly/panelView";
import { playerHoldings } from "@/lib/monopoly/stats";
import type { GameState } from "@/lib/monopoly/types";
import { cx } from "@/lib/ui";

interface StatCardProps {
  label: string;
  value: string;
  tint?: string;
  tone?: "body" | "good";
}

function StatCard({ label, value, tint, tone = "body" }: StatCardProps) {
  return (
    <div
      className="flex flex-col items-center gap-0.5 rounded-sm border px-1.5 py-2 text-center"
      style={
        tint
          ? {
              borderColor: `color-mix(in srgb, ${tint} 45%, transparent)`,
              background: `${tint}`,
            }
          : undefined
      }
    >
      <span className="text-[9px] font-bold tracking-[0.06em] text-white uppercase">
        {label}
      </span>
      <span
        className={cx(
          "text-[15px] leading-none font-extrabold tabular-nums",
          tone === "good" ? "text-good" : "text-body",
        )}
      >
        {value}
      </span>
    </div>
  );
}

interface IdleViewProps {
  state: GameState;
  mySeat: number | null;
}

export function IdleView({ state, mySeat }: IdleViewProps) {
  const current = state.players[state.turn];
  const onTile = current ? state.squares[current.position] : null;
  const holdings = current ? playerHoldings(state, current.index) : null;
  const tint = current ? cardColor(current.index) : undefined;
  const unowned = state.squares.filter(
    (square) => square.price > 0 && square.owner === 0,
  ).length;

  return (
    <>
      <PanelSection label="Board">
        <div className="grid grid-cols-3 gap-1.5">
          <StatCard label="Unclaimed" value={String(unowned)} tint="#6c5ce7" />
          <StatCard
            label="Houses"
            value={String(state.housesAvailable)}
            tint="#6c5ce7"
          />
          <StatCard
            label="Hotels"
            value={String(state.hotelsAvailable)}
            tint="#6c5ce7"
          />
        </div>
      </PanelSection>

      <PanelShell
        eyebrow=""
        title={current ? `${current.name}'s turn` : "Waiting for players"}
        subtitle={onTile ? `Standing on ${onTile.name}` : undefined}
        accent={tint}
      >
        {current && holdings && (
          <PanelSection label={`${current.name}'s turn`}>
            <PanelStat label="Cash" value={money(holdings.cash)} tone="good" />
            <PanelStat label="Places" value={String(holdings.deeds)} />
            <PanelStat
              label="Rent per landing"
              value={money(holdings.rentPerLanding)}
            />
            <PanelStat
              label="Net worth"
              value={money(holdings.cash + holdings.invested)}
            />
            {mySeat === current.index && (
              <p className="mt-1.5 text-[11px] text-dim">
                That&apos;s you — roll when you are ready.
              </p>
            )}
          </PanelSection>
        )}
      </PanelShell>
      <div className="mt-1 rounded-sm border border-dashed border-line  px-2.5 py-2.5 text-[12px] text-dim">
        Tap any tile on the board to inspect its deed, rent and owner.
      </div>
    </>
  );
}
