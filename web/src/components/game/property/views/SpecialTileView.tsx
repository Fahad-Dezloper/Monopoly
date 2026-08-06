"use client";

import {
  PanelNote,
  PanelSection,
  PanelShell,
  PanelStat,
} from "@/components/game/property/PanelShell";
import { money } from "@/lib/monopoly/panelView";
import type { GameState, Square } from "@/lib/monopoly/types";

interface SpecialTileViewProps {
  state: GameState;
  square: Square;
  onClose: () => void;
}

interface TileCopy {
  eyebrow: string;
  accent: string;
  note: string;
}

function describe(square: Square): TileCopy {
  if ((square.taxAmount ?? 0) > 0) {
    return {
      eyebrow: "Tax",
      accent: "#ef5b6e",
      note: `Landing here costs ${money(square.taxAmount ?? 0)}, paid straight to the bank.`,
    };
  }
  if (square.tileType === "fortune") {
    return {
      eyebrow: "Fortune",
      accent: "#f0b429",
      note: "Draw the top Fortune card and follow whatever it says — money, movement or jail.",
    };
  }
  if (square.tileType === "treasury") {
    return {
      eyebrow: "Treasury",
      accent: "#86D6F7",
      note: "Draw the top Treasury card. Most pay out, a few cost you.",
    };
  }
  if (square.index === 0) {
    return {
      eyebrow: "Go",
      accent: "#3ecf6e",
      note: "Collect $200 every time you pass or land here.",
    };
  }
  if (square.index === 10) {
    return {
      eyebrow: "Jail",
      accent: "#8e8e9a",
      note: "Just visiting costs nothing. If you are jailed: pay $50, use a card, or roll doubles.",
    };
  }
  if (square.index === 20) {
    return {
      eyebrow: "Free parking",
      accent: "#9DF18F",
      note: "A rest stop. Nothing is collected or paid here.",
    };
  }
  return {
    eyebrow: "Go to jail",
    accent: "#ef5b6e",
    note: "Straight to jail — do not pass GO, do not collect $200.",
  };
}

export function SpecialTileView({
  state,
  square,
  onClose,
}: SpecialTileViewProps) {
  const copy = describe(square);
  const visitors = state.players.filter(
    (player) => player.index > 0 && player.position === square.index,
  );

  return (
    <PanelShell
      eyebrow={copy.eyebrow}
      title={square.name}
      subtitle="No deed — nobody can own this tile"
      accent={copy.accent}
      onClose={onClose}
    >
      <PanelNote>{copy.note}</PanelNote>

      <PanelSection label="Traffic">
        <PanelStat label="Times landed on" value={String(square.landcount)} />
        <PanelStat
          label="Standing here"
          value={
            visitors.length > 0
              ? visitors.map((player) => player.name).join(", ")
              : "Nobody"
          }
        />
      </PanelSection>
    </PanelShell>
  );
}
