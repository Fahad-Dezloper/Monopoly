"use client";

import {
  PanelSection,
  PanelShell,
  PanelStat,
} from "@/components/game/property/PanelShell";
import { cardColor } from "@/components/game/rail/playerPalette";
import { money } from "@/lib/monopoly/panelView";
import { playerHoldings } from "@/lib/monopoly/stats";
import type { GameState } from "@/lib/monopoly/types";

interface GameOverViewProps {
  state: GameState;
  winner: number;
  mySeat: number | null;
}

export function GameOverView({ state, winner, mySeat }: GameOverViewProps) {
  const champion = state.players[winner];
  const holdings = playerHoldings(state, winner);

  return (
    <PanelShell
      eyebrow="Game over"
      title={`${champion?.name} wins`}
      subtitle={mySeat === winner ? "That's you — well played" : "Last player standing"}
      accent={cardColor(winner)}
      tone="positive"
    >
      <PanelSection label="Final standing">
        <PanelStat label="Cash" value={money(holdings.cash)} tone="good" />
        <PanelStat label="Property value" value={money(holdings.invested)} />
        <PanelStat
          label="Net worth"
          value={money(holdings.cash + holdings.invested)}
        />
        <PanelStat label="Properties" value={String(holdings.deeds)} />
        <PanelStat label="Houses" value={String(holdings.houses)} />
        <PanelStat label="Hotels" value={String(holdings.hotels)} />
      </PanelSection>
    </PanelShell>
  );
}
