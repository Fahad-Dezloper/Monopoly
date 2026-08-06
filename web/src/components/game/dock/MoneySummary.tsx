"use client";

import { money } from "@/lib/monopoly/panelView";
import type { PlayerHoldings } from "@/lib/monopoly/stats";

interface MoneySummaryProps {
  holdings: PlayerHoldings | null;
}

export function MoneySummary({ holdings }: MoneySummaryProps) {
  if (!holdings) {
    return (
      <div className="flex h-full flex-col justify-center rounded-sm border border-dashed border-line px-4 text-dim">
        <span className="text-[13px] font-bold text-body">Not seated</span>
        <span className="text-[11.5px]">Join a room to track your money.</span>
      </div>
    );
  }

  const worth = holdings.cash + holdings.invested;
  const cashShare = worth > 0 ? Math.round((holdings.cash / worth) * 100) : 0;

  return (
    <div className="flex h-full flex-col justify-between rounded-sm border border-line bg-surface-2 p-3">
      <div>
        <div className="text-[10px] font-bold tracking-wider text-dim uppercase">
          Cash in hand
        </div>
        <div className="text-[30px] leading-none font-extrabold tabular-nums text-good">
          {money(holdings.cash)}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex h-1.5 overflow-hidden rounded-full bg-line">
          <span
            className="bg-good"
            style={{ width: `${cashShare}%` }}
            aria-hidden
          />
          <span
            className="bg-accent"
            style={{ width: `${100 - cashShare}%` }}
            aria-hidden
          />
        </div>
        <div className="flex items-center justify-between text-[10.5px]">
          <span className="font-semibold text-good">
            {cashShare}% liquid
          </span>
          <span className="text-dim">
            {money(holdings.invested)} in property
          </span>
        </div>
      </div>

      <div className="flex items-baseline justify-between border-t border-line pt-1.5">
        <span className="text-[10px] font-bold tracking-wider text-dim uppercase">
          Net worth
        </span>
        <span className="text-[15px] font-extrabold tabular-nums text-body">
          {money(worth)}
        </span>
      </div>
    </div>
  );
}
