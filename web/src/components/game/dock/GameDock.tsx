"use client";

import type { ReactNode } from "react";
import { CardHand, type HeldCard } from "@/components/game/dock/CardHand";
import { DeedStrip } from "@/components/game/dock/DeedStrip";
import { MoneySummary } from "@/components/game/dock/MoneySummary";
import type { GameAction } from "@/lib/monopoly/engine";
import { ownedBy, playerHoldings } from "@/lib/monopoly/stats";
import type { GameState } from "@/lib/monopoly/types";

interface DockCardProps {
  icon: ReactNode;
  title: string;
  count?: number;
  meta?: string;
  children: ReactNode;
}

function DockCard({ icon, title, count, meta, children }: DockCardProps) {
  return (
    <section className="flex min-w-0 flex-col gap-2 rounded-2xl border border-[#e9e2ff] bg-white p-3 shadow-sm">
      <header className="flex shrink-0 items-center gap-2">
        <span className="text-[#7c3aed]" aria-hidden>
          {icon}
        </span>
        <span className="text-[11px] font-extrabold tracking-wider text-[#7c3aed] uppercase">
          {title}
        </span>
        {count != null && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#7c3aed] px-1.5 text-[10px] font-bold text-white">
            {count}
          </span>
        )}
        {meta && (
          <span className="ml-auto text-[10.5px] font-semibold text-slate-400">
            {meta}
          </span>
        )}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

interface GameDockProps {
  state: GameState;
  mySeat: number | null;
  onSelectSquare: (index: number) => void;
  act?: (action: GameAction) => void;
}

export function GameDock({
  state,
  mySeat,
  onSelectSquare,
  act,
}: GameDockProps) {
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

  const setsMeta = holdings
    ? holdings.sets > 0
      ? `${holdings.sets} full set${holdings.sets > 1 ? "s" : ""}`
      : undefined
    : undefined;

  return (
    <footer className="grid h-full min-h-0 grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,0.85fr)] gap-2.5 max-[1080px]:grid-cols-[minmax(0,1fr)]">
      <DockCard
        icon={
          <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l-10-5v10l10 5 10-5V6l-10 5z" />
          </svg>
        }
        title="Your properties"
        count={deeds.length}
        meta={setsMeta}
      >
        <DeedStrip
          state={state}
          deeds={deeds}
          onSelectSquare={onSelectSquare}
        />
      </DockCard>

      <DockCard
        icon={
          <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z" />
          </svg>
        }
        title="Cards"
        count={cards.length}
      >
        <CardHand cards={cards} canUse={!!player?.jail && !!act} act={act} />
      </DockCard>

      <DockCard
        icon={
          <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
          </svg>
        }
        title="Your money"
      >
        <MoneySummary holdings={holdings} />
      </DockCard>
    </footer>
  );
}
