"use client";

import { HouseIcon } from "@/components/shared/icons";
import { money } from "@/lib/monopoly/panelView";
import { currentRent, groupProgress } from "@/lib/monopoly/stats";
import type { GameState, Square } from "@/lib/monopoly/types";
import { cx } from "@/lib/ui";

interface DeedStripProps {
  state: GameState;
  deeds: Square[];
  onSelectSquare: (index: number) => void;
}

export function DeedStrip({ state, deeds, onSelectSquare }: DeedStripProps) {
  if (deeds.length === 0) {
    return (
      <div className="flex h-full items-center gap-3 rounded-sm border border-dashed border-line px-4 py-5 text-dim">
        <HouseIcon className="size-7 shrink-0 opacity-60" />
        <div>
          <div className="text-[13px] font-bold text-body">No deeds yet</div>
          <div className="text-[11.5px]">
            Land on a city and buy it to start a colour set.
          </div>
        </div>
      </div>
    );
  }

  const sorted = [...deeds].sort(
    (a, b) => a.groupNumber - b.groupNumber || a.index - b.index,
  );

  return (
    <div className="scrollless flex h-full gap-2 overflow-x-auto pb-0.5">
      {sorted.map((square) => {
        const progress = groupProgress(state, square);
        const complete =
          progress.total > 0 && progress.owned === progress.total;
        const houses = square.hotel === 1 ? 0 : square.house;

        return (
          <button
            key={square.index}
            type="button"
            onClick={() => onSelectSquare(square.index)}
            className={cx(
              "group relative flex h-full w-[136px] shrink-0 flex-col overflow-hidden rounded-sm border bg-surface-2 text-left transition-all hover:-translate-y-0.5 hover:border-body/40",
              complete ? "border-body/30" : "border-line",
              square.mortgage && "opacity-55",
            )}
          >
            <span
              className="h-2.5 w-full shrink-0"
              style={{ background: square.color }}
              aria-hidden
            />

            <span className="flex min-h-0 flex-1 flex-col justify-between p-2">
              <span className="block text-[12.5px] leading-tight font-bold text-body">
                {square.name}
              </span>

              <span className="flex flex-col gap-1">
                {(houses > 0 || square.hotel === 1) && (
                  <span
                    className={cx(
                      "flex items-center gap-0.5",
                      square.hotel === 1 ? "text-[#ef4444]" : "text-[#22c55e]",
                    )}
                    aria-hidden
                  >
                    {square.hotel === 1 ? (
                      <HouseIcon className="size-4" />
                    ) : (
                      Array.from({ length: houses }).map((_, index) => (
                        <HouseIcon key={index} className="size-3.5" />
                      ))
                    )}
                  </span>
                )}

                <span className="flex items-baseline justify-between gap-1">
                  <span className="text-[10px] font-bold tracking-wider text-dim uppercase">
                    Rent
                  </span>
                  <span className="text-[13px] font-extrabold tabular-nums text-good">
                    {square.mortgage ? "—" : money(currentRent(state, square))}
                  </span>
                </span>
              </span>
            </span>

            {square.mortgage && (
              <span className="absolute top-4 right-1.5 rounded-xs bg-warn px-1 py-px text-[8.5px] font-bold tracking-wider text-ink uppercase">
                Mtg
              </span>
            )}
            {complete && !square.mortgage && (
              <span
                className="absolute top-4 right-1.5 rounded-xs px-1 py-px text-[8.5px] font-bold tracking-wider text-ink uppercase"
                style={{ background: square.color }}
              >
                Set
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
