"use client";

import { useState } from "react";
import { PlayerDetailsDialog } from "@/components/game/rail/PlayerDetailsDialog";
import { cardColor } from "@/components/game/rail/playerPalette";
import { InfoIcon } from "@/components/shared/icons";
import type { MoneyFlash } from "@/hooks/useGameFx";
import { playerHoldings } from "@/lib/monopoly/stats";
import type { GameState, Player } from "@/lib/monopoly/types";
import { cx } from "@/lib/ui";

const JAIL_BARS =
  "repeating-linear-gradient(90deg, rgba(17,17,17,0.55) 0 7px, transparent 7px 26px)";

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="text-[9px] font-bold tracking-[0.06em] text-ink/55 uppercase">
        {label}
      </span>
      <span className="truncate text-[12px] font-bold tabular-nums text-ink">
        {value}
      </span>
    </div>
  );
}

interface PlayerCardProps {
  state: GameState;
  player: Player;
  isYou: boolean;
  isTurn: boolean;
  flash?: MoneyFlash;
}

export function PlayerCard({
  state,
  player,
  isYou,
  isTurn,
  flash,
}: PlayerCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const isOut = player.position < 0 || !Number.isFinite(player.money);
  const holdings = playerHoldings(state, player.index);
  const inJail = player.jail && !isOut;
  const tint = cardColor(player.index);

  return (
    <>
      <div
        className={cx(
          "relative overflow-hidden rounded-panel px-3 py-2.5",
          isTurn ? "border-2 border-ink" : "border border-black/10",
          isOut && "opacity-45 grayscale",
        )}
        style={{
          background: tint,
          boxShadow: isTurn
            ? `0 0 0 3px color-mix(in srgb, ${tint} 55%, transparent)`
            : undefined,
        }}
      >
        {inJail && (
          <span
            className="pointer-events-none absolute inset-0 z-10"
            style={{ backgroundImage: JAIL_BARS }}
            aria-hidden
          />
        )}

        <div className="relative z-20 flex items-center gap-1.5">
          <span className="truncate text-[13px] font-extrabold text-ink">
            {isYou ? "You" : player.name}
          </span>
          {inJail && (
            <span className="rounded-xs bg-ink px-1.25 py-px text-[9px] font-bold tracking-wider text-white uppercase">
              Jail
            </span>
          )}
          {isOut && (
            <span className="rounded-xs bg-ink/80 px-1.25 py-px text-[9px] font-bold tracking-wider text-white uppercase">
              Out
            </span>
          )}
          <button
            type="button"
            className="ml-auto shrink-0 text-ink/55 transition-colors hover:text-ink"
            onClick={() => setDetailsOpen(true)}
            aria-label={`${player.name} details`}
            title="More details"
          >
            <InfoIcon className="size-4.5" />
          </button>
        </div>

        <div className="relative z-20 mt-1 flex items-baseline gap-1.5">
          <span className="text-[18px] font-extrabold tabular-nums text-ink">
            {isOut ? "—" : `$ ${holdings.cash.toLocaleString()}`}
          </span>
          {flash && flash.delta !== 0 && (
            <span
              key={flash.id}
              className={cx(
                "animate-money-float text-[11px] font-extrabold motion-reduce:animate-none",
                flash.delta > 0 ? "text-[#166534]" : "text-[#9f1239]",
              )}
            >
              {flash.delta > 0 ? "+" : ""}
              {flash.delta}
            </span>
          )}
        </div>

        {!isOut && (
          <div className="relative z-20 mt-2 grid grid-cols-3 gap-2">
            <Stat
              label="Invested"
              value={`$ ${holdings.invested.toLocaleString()}`}
            />
            <Stat
              label="Rent"
              value={`$ ${holdings.rentPerLanding.toLocaleString()}`}
            />
            <Stat label="Places" value={String(holdings.deeds)} />
          </div>
        )}
      </div>

      {detailsOpen && (
        <PlayerDetailsDialog
          state={state}
          player={player}
          isYou={isYou}
          tint={tint}
          onClose={() => setDetailsOpen(false)}
        />
      )}
    </>
  );
}
