"use client";

import {
  PanelSection,
  PanelShell,
  PanelStat,
} from "@/components/game/property/PanelShell";
import { RentTable } from "@/components/game/property/RentTable";
import { FLAG_EMOJI } from "@/lib/monopoly/board";
import type { GameAction } from "@/lib/monopoly/engine";
import { money } from "@/lib/monopoly/panelView";
import { groupLabel, groupProgress } from "@/lib/monopoly/stats";
import type { GameState, Square } from "@/lib/monopoly/types";
import { btn, buyButton, cx } from "@/lib/ui";

interface LandedBuyViewProps {
  state: GameState;
  square: Square;
  price: number;
  cashAfter: number;
  mySeat: number | null;
  act: (action: GameAction) => void;
}

export function LandedBuyView({
  state,
  square,
  price,
  cashAfter,
  mySeat,
  act,
}: LandedBuyViewProps) {
  const flag = square.flagCode ? FLAG_EMOJI[square.flagCode] : null;
  const mineInGroup = square.group.filter(
    (index) => state.squares[index].owner === mySeat,
  ).length;
  const progress = { owned: mineInGroup, total: square.group.length };
  const completesSet = progress.total > 0 && progress.owned + 1 === progress.total;

  return (
    <PanelShell
      eyebrow="You landed here"
      title={`${flag ? `${flag} ` : ""}${square.name}`}
      subtitle={`Unclaimed · ${groupLabel(square)}`}
      accent={square.color}
      tone="positive"
      footer={
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            className={cx(buyButton, "w-full")}
            onClick={() => act({ type: "BUY" })}
          >
            Buy for {money(price)}
          </button>
          <button
            type="button"
            className={cx(btn, "w-full")}
            onClick={() => act({ type: "NEXT" })}
            title="Passing sends this property to auction"
          >
            Pass — send to auction
          </button>
        </div>
      }
    >
      <PanelSection label="The deal">
        <PanelStat label="Price" value={money(price)} />
        <PanelStat label="Your cash after" value={money(cashAfter)} tone="good" />
        <PanelStat
          label="Set progress"
          value={`${progress.owned + 1} of ${progress.total}`}
        />
      </PanelSection>

      {completesSet && (
        <div className="my-1 rounded-chip border border-good/35 bg-good/12 px-2.5 py-2 text-[12px] font-semibold text-good">
          Buying this completes the {groupLabel(square)} — you can start building.
        </div>
      )}

      <PanelSection label="What it earns">
        <RentTable square={square} />
      </PanelSection>
    </PanelShell>
  );
}
