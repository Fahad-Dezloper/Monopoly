"use client";

import {
  PanelNote,
  PanelSection,
  PanelShell,
  PanelStat,
} from "@/components/game/property/PanelShell";
import { FLAG_EMOJI } from "@/lib/monopoly/board";
import {
  canDowngrade,
  downgradeRefund,
  mortgageValue,
} from "@/lib/monopoly/building";
import type { GameAction } from "@/lib/monopoly/engine";
import { money } from "@/lib/monopoly/panelView";
import { ownedBy } from "@/lib/monopoly/stats";
import type { GameState, Square } from "@/lib/monopoly/types";
import { btn, cx } from "@/lib/ui";

interface LandedShortViewProps {
  state: GameState;
  square: Square;
  price: number;
  shortBy: number;
  mySeat: number | null;
  act: (action: GameAction) => void;
  onOpenTrade: (recipient?: number) => void;
}

export function LandedShortView({
  state,
  square,
  price,
  shortBy,
  mySeat,
  act,
  onOpenTrade,
}: LandedShortViewProps) {
  const flag = square.flagCode ? FLAG_EMOJI[square.flagCode] : null;
  const deeds = mySeat != null ? ownedBy(state, mySeat) : [];

  const mortgageable = deeds.filter(
    (deed) => !deed.mortgage && deed.house === 0,
  );
  const sellable =
    mySeat != null
      ? deeds.filter((deed) => canDowngrade(state, mySeat, deed))
      : [];

  const raisable =
    mortgageable.reduce((sum, deed) => sum + mortgageValue(deed), 0) +
    sellable.reduce((sum, deed) => sum + downgradeRefund(deed), 0);

  return (
    <PanelShell
      eyebrow="Not enough cash"
      title={`${flag ? `${flag} ` : ""}${square.name}`}
      subtitle={`You are ${money(shortBy)} short of the ${money(price)} price`}
      accent={square.color}
      tone="alert"
      footer={
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            className={cx(btn, "w-full border-accent bg-accent text-white")}
            onClick={() => onOpenTrade()}
          >
            Raise cash with a deal
          </button>
          <button
            type="button"
            className={cx(btn, "w-full")}
            onClick={() => act({ type: "NEXT" })}
          >
            Pass — send to auction
          </button>
        </div>
      }
    >
      <PanelSection label="The gap">
        <PanelStat label="Price" value={money(price)} />
        <PanelStat label="Short by" value={money(shortBy)} tone="bad" />
        <PanelStat
          label="You could raise"
          value={money(raisable)}
          tone={raisable >= shortBy ? "good" : "bad"}
        />
      </PanelSection>

      {raisable < shortBy && (
        <PanelNote>
          Even after mortgaging and selling buildings you are still short — a
          trade is the only way to reach {money(price)}.
        </PanelNote>
      )}

      {mortgageable.length > 0 && (
        <PanelSection label="Mortgage a deed">
          <div className="flex flex-col gap-1">
            {mortgageable.slice(0, 5).map((deed) => (
              <RaiseRow
                key={deed.index}
                square={deed}
                amount={mortgageValue(deed)}
                actionLabel="Mortgage"
                onClick={() => {
                  act({ type: "SELECT_PROPERTY", index: deed.index });
                  act({ type: "MORTGAGE" });
                }}
              />
            ))}
          </div>
        </PanelSection>
      )}

      {sellable.length > 0 && (
        <PanelSection label="Sell buildings">
          <div className="flex flex-col gap-1">
            {sellable.slice(0, 5).map((deed) => (
              <RaiseRow
                key={deed.index}
                square={deed}
                amount={downgradeRefund(deed)}
                actionLabel={deed.hotel === 1 ? "Sell hotel" : "Sell house"}
                onClick={() => act({ type: "SELL_HOUSE", index: deed.index })}
              />
            ))}
          </div>
        </PanelSection>
      )}

      {mortgageable.length === 0 && sellable.length === 0 && (
        <PanelNote>
          You have nothing to mortgage or sell. Try a trade, or pass and let it
          go to auction.
        </PanelNote>
      )}
    </PanelShell>
  );
}

function RaiseRow({
  square,
  amount,
  actionLabel,
  onClick,
}: {
  square: Square;
  amount: number;
  actionLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-chip border border-line bg-surface-2 px-2.5 py-2 text-left transition-colors hover:border-accent"
    >
      <span
        className="h-6 w-1.5 shrink-0 rounded-full"
        style={{ background: square.color }}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-body">
        {square.name}
      </span>
      <span className="shrink-0 text-[12px] font-bold tabular-nums text-good">
        +{money(amount)}
      </span>
      <span className="shrink-0 text-[10px] font-bold text-accent uppercase">
        {actionLabel}
      </span>
    </button>
  );
}
