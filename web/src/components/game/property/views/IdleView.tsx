"use client";

import { money } from "@/lib/monopoly/panelView";
import { playerHoldings } from "@/lib/monopoly/stats";
import type { GameState } from "@/lib/monopoly/types";
import { cx } from "@/lib/ui";

interface StatBadgeProps {
  label: string;
  value: string | number;
  tone: "purple" | "cyan" | "pink";
}

function StatBadge({ label, value, tone }: StatBadgeProps) {
  const bg =
    tone === "purple"
      ? "bg-accent"
      : tone === "cyan"
        ? "bg-cyan-500"
        : "bg-pink-500";

  return (
    <div
      className={cx(
        "flex flex-col items-center justify-center rounded-2xl px-2 py-2.5 text-center text-white shadow-sm",
        bg,
      )}
    >
      <span className="text-[9px] font-extrabold tracking-wider uppercase opacity-90">
        {label}
      </span>
      <span className="mt-0.5 text-xl leading-none font-black tabular-nums">
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
  const unowned = state.squares.filter(
    (square) => square.price > 0 && square.owner === 0,
  ).length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto text-slate-800">
      <div>
        <div className="mb-2 text-[11px] font-extrabold tracking-wider text-accent uppercase">
          Board
        </div>
        <div className="grid grid-cols-3 gap-2">
          <StatBadge label="Unclaimed" value={unowned} tone="purple" />
          <StatBadge label="Houses" value={state.housesAvailable} tone="cyan" />
          <StatBadge label="Hotels" value={state.hotelsAvailable} tone="pink" />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div>
          <div className="text-base leading-tight font-black text-slate-900">
            {current ? `${current.name}'s turn` : "Waiting for players"}
          </div>
          {onTile && (
            <div className="mt-0.5 text-xs font-semibold text-slate-400">
              Standing on {onTile.name}
            </div>
          )}
        </div>

        {current && holdings && (
          <div className="flex flex-col gap-2 border-t border-line-soft pt-3">
            <div className="text-[10px] font-extrabold tracking-wider text-accent uppercase">
              {current.name}&apos;s turn
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">Cash</span>
              <span className="text-sm font-black text-good">
                {money(holdings.cash)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">Places</span>
              <span className="font-bold text-slate-800">{holdings.deeds}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">
                Rent per landing
              </span>
              <span className="font-bold text-slate-800">
                {money(holdings.rentPerLanding)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
              <span className="font-bold text-slate-700">Net worth</span>
              <span className="text-sm font-black text-slate-900">
                {money(holdings.cash + holdings.invested)}
              </span>
            </div>

            {mySeat === current.index && (
              <p className="text-[11px] font-medium text-slate-400 italic">
                That&apos;s you — roll when you are ready.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-auto flex items-start gap-2.5 rounded-2xl border border-line bg-[#fdfcff] p-3 shadow-sm">
        <span className="shrink-0 text-lg leading-none" aria-hidden>
          💡
        </span>
        <p className="text-xs leading-relaxed font-medium text-slate-600">
          Tap any tile on the board to inspect its deed, rent and owner.
        </p>
      </div>
    </div>
  );
}
