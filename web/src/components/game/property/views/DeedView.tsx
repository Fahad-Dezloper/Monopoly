"use client";

import { OwnerSummary } from "@/components/game/property/OwnerSummary";
import {
  PanelNote,
  PanelSection,
  PanelShell,
  PanelStat,
} from "@/components/game/property/PanelShell";
import { PropertyActions } from "@/components/game/property/PropertyActions";
import { RentTable } from "@/components/game/property/RentTable";
import { FLAG_EMOJI } from "@/lib/monopoly/board";
import type { GameAction } from "@/lib/monopoly/engine";
import { money } from "@/lib/monopoly/panelView";
import { currentRent, groupLabel } from "@/lib/monopoly/stats";
import type { GameState, Square } from "@/lib/monopoly/types";
import { btn, cx } from "@/lib/ui";

interface DeedViewProps {
  state: GameState;
  square: Square;
  relation: "unowned" | "mine" | "theirs";
  mySeat: number | null;
  isMyTurn: boolean;
  act: (action: GameAction) => void;
  onOpenTrade: (recipient?: number) => void;
  onClose: () => void;
}

export function DeedView({
  state,
  square,
  relation,
  mySeat,
  isMyTurn,
  act,
  onOpenTrade,
  onClose,
}: DeedViewProps) {
  const owner = square.owner > 0 ? state.players[square.owner] : null;
  const flag = square.flagCode ? FLAG_EMOJI[square.flagCode] : null;

  const subtitle =
    relation === "unowned"
      ? `Unclaimed · ${groupLabel(square)}`
      : relation === "mine"
        ? `Yours · ${groupLabel(square)}`
        : `${owner?.name} owns this · ${groupLabel(square)}`;

  return (
    <PanelShell
      eyebrow="Property"
      title={`${flag ? `${flag} ` : ""}${square.name}`}
      subtitle={subtitle}
      accent={square.color}
      onClose={onClose}
      footer={
        relation === "theirs" ? (
          <button
            type="button"
            className={cx(btn, "w-full")}
            disabled={!isMyTurn}
            onClick={() => onOpenTrade(square.owner)}
            title={isMyTurn ? "" : "Deals can only be proposed on your turn"}
          >
            Propose a deal for {square.name}
          </button>
        ) : undefined
      }
    >
      <PanelSection label="Rent">
        <RentTable square={square} />
      </PanelSection>

      <PanelSection label="Right now">
        <PanelStat label="List price" value={money(square.price)} />
        <PanelStat
          label="Rent if landed on"
          value={
            square.mortgage
              ? "Mortgaged — none"
              : money(currentRent(state, square))
          }
          tone={square.mortgage ? "bad" : "good"}
        />
      </PanelSection>

      {square.mortgage && (
        <PanelNote>
          This deed is mortgaged, so nobody pays rent until it is lifted.
        </PanelNote>
      )}

      {relation === "mine" && mySeat != null && (
        <PropertyActions
          state={state}
          square={square}
          seat={mySeat}
          isMyTurn={isMyTurn}
          act={act}
        />
      )}

      {owner && (
        <OwnerSummary
          state={state}
          square={square}
          owner={owner}
          isMine={relation === "mine"}
        />
      )}
    </PanelShell>
  );
}
