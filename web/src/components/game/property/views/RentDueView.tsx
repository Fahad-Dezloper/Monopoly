"use client";

import { OwnerSummary } from "@/components/game/property/OwnerSummary";
import {
  PanelSection,
  PanelShell,
} from "@/components/game/property/PanelShell";
import { cardColor } from "@/components/game/rail/playerPalette";
import { HouseIcon } from "@/components/shared/icons";
import { FLAG_EMOJI } from "@/lib/monopoly/board";
import { ownsFullGroup } from "@/lib/monopoly/building";
import type { GameAction } from "@/lib/monopoly/engine";
import { money } from "@/lib/monopoly/panelView";
import { groupLabel } from "@/lib/monopoly/stats";
import type { GameState, Square } from "@/lib/monopoly/types";
import { btn, cx } from "@/lib/ui";

interface RentDueViewProps {
  state: GameState;
  square: Square;
  rent: number;
  owner: number;
  mySeat: number | null;
  act: (action: GameAction) => void;
  onOpenTrade: (recipient?: number) => void;
}

interface Reason {
  label: string;
  detail: string;
}

function rentReasons(state: GameState, square: Square): Reason[] {
  const reasons: Reason[] = [];

  if (square.groupNumber === 1) {
    const owned = square.group.filter(
      (index) => state.squares[index].owner === square.owner,
    ).length;
    reasons.push({
      label: `${owned} of ${square.group.length} hubs owned`,
      detail: "Hub rent doubles with every hub the owner holds",
    });
    return reasons;
  }

  if (square.groupNumber === 2) {
    const both = ownsFullGroup(state, square);
    reasons.push({
      label: both ? "Both utilities owned" : "One utility owned",
      detail: `Rent is ${both ? square.rent2 : square.rent1}× the dice roll`,
    });
    return reasons;
  }

  if (square.hotel === 1) {
    reasons.push({
      label: "Hotel built here",
      detail: "Top rent tier — nothing costs more to land on",
    });
  } else if (square.house > 0) {
    reasons.push({
      label: `${square.house} house${square.house > 1 ? "s" : ""} built here`,
      detail: `Base rent ${money(square.baserent)} climbs with every house`,
    });
  } else if (ownsFullGroup(state, square)) {
    reasons.push({
      label: `Complete ${groupLabel(square)}`,
      detail: "Owning the whole set doubles the base rent",
    });
  } else {
    reasons.push({
      label: "Undeveloped deed",
      detail: "Base rent only — no houses yet",
    });
  }

  return reasons;
}

export function RentDueView({
  state,
  square,
  rent,
  owner,
  mySeat,
  act,
  onOpenTrade,
}: RentDueViewProps) {
  const landlord = state.players[owner];
  const me = mySeat != null ? state.players[mySeat] : null;
  const cashNow = me ? Math.floor(me.money) : 0;
  const cashBefore = cashNow + rent;
  const broke = cashNow < 0;
  const flag = square.flagCode ? FLAG_EMOJI[square.flagCode] : null;
  const tint = cardColor(owner);
  const houses = square.hotel === 1 ? 0 : square.house;

  return (
    <PanelShell
      eyebrow="Rent paid"
      title={`${flag ? `${flag} ` : ""}${square.name}`}
      subtitle={`${landlord?.name}'s property`}
      accent={tint}
      tone="alert"
      footer={
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            className={cx(btn, "w-full")}
            onClick={() => act({ type: "NEXT" })}
          >
            End turn
          </button>
          {broke && (
            <button
              type="button"
              className={cx(btn, "w-full border-accent bg-accent text-white")}
              onClick={() => onOpenTrade(owner)}
            >
              Deal with {landlord?.name}
            </button>
          )}
        </div>
      }
    >
      <div className="mt-1 rounded-sm border border-bad/35 bg-bad/12 px-3 py-3 text-center">
        <div className="text-[10px] font-bold tracking-[0.1em] text-bad uppercase">
          You paid
        </div>
        <div className="text-[34px] leading-none font-extrabold tabular-nums text-bad">
          {money(rent)}
        </div>
        <div className="mt-1.5 text-[11.5px] text-dim">
          to <span className="font-bold text-body">{landlord?.name}</span>
        </div>
        <div className="mt-2 flex items-center justify-center gap-2 border-t border-bad/20 pt-2 text-[11.5px] tabular-nums">
          <span className="text-dim">{money(cashBefore)}</span>
          <span className="text-dim">→</span>
          <span className={cx("font-bold", broke ? "text-bad" : "text-good")}>
            {money(cashNow)}
          </span>
        </div>
      </div>

      {broke && (
        <p className="mt-2 rounded-sm border border-bad/35 bg-bad/10 px-2.5 py-2 text-[11.5px] text-[#ffb3c0]">
          You are in the red. Mortgage, sell buildings or strike a deal before
          your next turn or you are out.
        </p>
      )}

      <PanelSection label="Why it cost that">
        <div className="flex flex-col gap-1.5">
          {houses > 0 && (
            <div className="flex items-center gap-1 text-[#22c55e]">
              {Array.from({ length: houses }).map((_, index) => (
                <HouseIcon key={index} className="size-5" />
              ))}
            </div>
          )}
          {square.hotel === 1 && (
            <div className="flex items-center gap-1 text-[#ef4444]">
              <HouseIcon className="size-5" />
            </div>
          )}
          {rentReasons(state, square).map((reason) => (
            <div
              key={reason.label}
              className="rounded-sm border border-line bg-surface-2 px-2.5 py-2"
            >
              <div className="text-[12px] font-bold text-body">
                {reason.label}
              </div>
              <div className="text-[11px] text-dim">{reason.detail}</div>
            </div>
          ))}
        </div>
      </PanelSection>

      <PanelSection label="Landlord">
        {landlord && (
          <OwnerSummary
            state={state}
            square={square}
            owner={landlord}
            isMine={false}
          />
        )}
      </PanelSection>
    </PanelShell>
  );
}
