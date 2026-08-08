"use client";

import { useState } from "react";
import { PlayerDetailsDialog } from "@/components/game/rail/PlayerDetailsDialog";
import { cardColor } from "@/components/game/rail/playerPalette";
import type { MoneyFlash } from "@/hooks/useGameFx";
import { playerHoldings } from "@/lib/monopoly/stats";
import type { GameState, Player } from "@/lib/monopoly/types";
import { cx } from "@/lib/ui";

const JAIL_BARS =
  "repeating-linear-gradient(90deg, rgba(17,17,17,0.35) 0 7px, transparent 7px 26px)";

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[9px] font-extrabold tracking-[0.08em] text-slate-400/90 uppercase">
        {label}
      </span>
      <span className="truncate text-[12px] font-bold tabular-nums text-slate-600">
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
      <button
        type="button"
        onClick={() => setDetailsOpen(true)}
        className={cx(
          "relative w-full overflow-hidden rounded-2xl border px-3.5 py-3 text-left transition-shadow",
          isTurn
            ? "border-accent/40 shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
            : "border-white/70 shadow-sm",
          isOut && "opacity-45 grayscale",
        )}
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${tint} 55%, white) 0%, color-mix(in srgb, ${tint} 28%, white) 100%)`,
        }}
      >
        {inJail && (
          <span
            className="pointer-events-none absolute inset-0 z-10"
            style={{ backgroundImage: JAIL_BARS }}
            aria-hidden
          />
        )}

        <div className="relative z-20 flex items-center gap-2">
          <span className="truncate text-[13px] font-extrabold text-slate-800">
            {isYou ? "You" : player.name}
          </span>
          {inJail && (
            <span className="rounded-md bg-slate-800 px-1.5 py-px text-[9px] font-bold tracking-wider text-white uppercase">
              Jail
            </span>
          )}
          {isOut && (
            <span className="rounded-md bg-slate-500 px-1.5 py-px text-[9px] font-bold tracking-wider text-white uppercase">
              Out
            </span>
          )}
          <span
            className={cx(
              "ml-auto size-2.5 shrink-0 rounded-full ring-2 ring-white",
              isOut ? "bg-slate-400" : "bg-emerald-400",
            )}
            aria-hidden
          />
        </div>

        <div className="relative z-20 mt-1 flex items-baseline gap-1.5">
          <span className="text-[22px] font-black tabular-nums tracking-tight text-good">
            {isOut ? "—" : `$${holdings.cash.toLocaleString()}`}
          </span>
          {flash && flash.delta !== 0 && (
            <span
              key={flash.id}
              className={cx(
                "animate-money-float text-[11px] font-extrabold motion-reduce:animate-none",
                flash.delta > 0 ? "text-good" : "text-bad",
              )}
            >
              {flash.delta > 0 ? "+" : ""}
              {flash.delta}
            </span>
          )}
        </div>

        {!isOut && (
          <div className="relative z-20 mt-2.5 grid grid-cols-3 gap-2 border-t border-black/5 pt-2">
            <Stat
              label="Invested"
              value={`$${holdings.invested.toLocaleString()}`}
            />
            <Stat
              label="Rent"
              value={`$${holdings.rentPerLanding.toLocaleString()}`}
            />
            <Stat label="Places" value={String(holdings.deeds)} />
          </div>
        )}
      </button>

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
