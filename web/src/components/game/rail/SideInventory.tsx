"use client";

import type { HeldCard } from "@/components/game/rail/CardHand";
import { money } from "@/lib/monopoly/panelView";
import type { GameAction } from "@/lib/monopoly/engine";
import {
  currentRent,
  groupProgress,
  ownedBy,
  playerHoldings,
} from "@/lib/monopoly/stats";
import type { GameState } from "@/lib/monopoly/types";
import { cx } from "@/lib/ui";

interface SideInventoryProps {
  state: GameState;
  mySeat: number | null;
  onSelectSquare: (index: number) => void;
  act?: (action: GameAction) => void;
}

export function SideInventory({
  state,
  mySeat,
  onSelectSquare,
  act,
}: SideInventoryProps) {
  const player = mySeat != null ? state.players[mySeat] : null;
  const deeds = mySeat != null ? ownedBy(state, mySeat) : [];
  const holdings = mySeat != null ? playerHoldings(state, mySeat) : null;

  const cards: HeldCard[] = [];
  if (player?.communityChestJailCard) {
    cards.push({ key: "treasury", label: "Treasury" });
  }
  if (player?.chanceJailCard) {
    cards.push({ key: "fortune", label: "Fortune" });
  }

  const canUseCard = !!player?.jail && !!act;
  const worth = holdings ? holdings.cash + holdings.invested : 0;
  const cashShare =
    holdings && worth > 0 ? Math.round((holdings.cash / worth) * 100) : 0;

  const sorted = [...deeds].sort(
    (a, b) => a.groupNumber - b.groupNumber || a.index - b.index,
  );

  return (
    <div className="flex min-h-0 flex-col gap-2">
      {/* MONEY */}
      <section className="shrink-0 rounded-2xl border border-[#e9e2ff] bg-white p-2.5 shadow-sm">
        <header className="mb-1.5 flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold tracking-wider text-[#7c3aed] uppercase">
            Your money
          </span>
        </header>
        {holdings ? (
          <div>
            <div className="text-[20px] leading-none font-black tabular-nums text-emerald-600">
              {money(holdings.cash)}
            </div>
            <div className="mt-1.5 flex h-1 overflow-hidden rounded-full bg-[#e9e2ff]">
              <span
                className="bg-emerald-500"
                style={{ width: `${cashShare}%` }}
                aria-hidden
              />
              <span
                className="bg-[#7c3aed]"
                style={{ width: `${100 - cashShare}%` }}
                aria-hidden
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] font-semibold text-slate-400">
              <span>{cashShare}% liquid</span>
              <span>Net {money(worth)}</span>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400">Not seated</p>
        )}
      </section>

      {/* PROPERTIES */}
      <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[#e9e2ff] bg-white p-2.5 shadow-sm">
        <header className="mb-1.5 flex shrink-0 items-center gap-1.5">
          <span className="text-[10px] font-extrabold tracking-wider text-[#7c3aed] uppercase">
            Properties
          </span>
          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[#7c3aed] px-1 text-[9px] font-bold text-white">
            {deeds.length}
          </span>
          {holdings && holdings.sets > 0 && (
            <span className="ml-auto text-[9px] font-semibold text-slate-400">
              {holdings.sets} set{holdings.sets > 1 ? "s" : ""}
            </span>
          )}
        </header>

        <div className="scrollless min-h-0 flex-1 space-y-1 overflow-y-auto">
          {sorted.length === 0 && (
            <p className="rounded-xl border border-dashed border-[#e9e2ff] bg-[#f8f6ff] px-2 py-2 text-[11px] text-slate-400">
              No deeds yet — buy a city to start a set.
            </p>
          )}
          {sorted.map((square) => {
            const progress = groupProgress(state, square);
            const complete =
              progress.total > 0 && progress.owned === progress.total;
            return (
              <button
                key={square.index}
                type="button"
                onClick={() => onSelectSquare(square.index)}
                className={cx(
                  "flex w-full items-center gap-2 rounded-xl border border-[#e9e2ff] bg-[#fdfcff] px-2 py-1.5 text-left transition-colors hover:border-[#7c3aed]/40 hover:bg-[#f8f6ff]",
                  square.mortgage && "opacity-55",
                )}
              >
                <span
                  className="h-7 w-1.5 shrink-0 rounded-full"
                  style={{ background: square.color }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-bold text-slate-800">
                    {square.name}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600">
                    {square.mortgage
                      ? "Mortgaged"
                      : `Rent ${money(currentRent(state, square))}`}
                  </span>
                </span>
                {complete && !square.mortgage && (
                  <span className="shrink-0 rounded-md bg-[#7c3aed]/12 px-1 py-px text-[8px] font-extrabold tracking-wide text-[#7c3aed] uppercase">
                    Set
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* CARDS */}
      <section className="shrink-0 rounded-2xl border border-[#e9e2ff] bg-white p-2.5 shadow-sm">
        <header className="mb-1.5 flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold tracking-wider text-[#7c3aed] uppercase">
            Cards
          </span>
          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[#7c3aed] px-1 text-[9px] font-bold text-white">
            {cards.length}
          </span>
        </header>

        {cards.length === 0 ? (
          <p className="text-[11px] text-slate-400">No jail cards held.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {cards.map((card) => (
              <div
                key={card.key}
                className={cx(
                  "flex items-center justify-between gap-2 rounded-xl px-2.5 py-2",
                  card.key === "treasury" ? "bg-sky-100" : "bg-purple-100",
                )}
              >
                <div>
                  <div className="text-[11px] font-extrabold text-slate-800">
                    {card.label}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500">
                    Get out of jail free
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!canUseCard}
                  onClick={() => act?.({ type: "USE_JAIL_CARD" })}
                  className={cx(
                    "rounded-full px-2 py-1 text-[10px] font-bold",
                    canUseCard
                      ? "bg-slate-900 text-white hover:bg-slate-800"
                      : "cursor-not-allowed bg-white/60 text-slate-400",
                  )}
                >
                  {canUseCard ? "Use" : "Jail only"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
