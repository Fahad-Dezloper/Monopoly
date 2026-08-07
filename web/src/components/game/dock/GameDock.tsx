"use client";

import type { ReactNode } from "react";
import { CardHand, type HeldCard } from "@/components/game/dock/CardHand";
import { DeedStrip } from "@/components/game/dock/DeedStrip";
import { MoneySummary } from "@/components/game/dock/MoneySummary";
import {
  CertificateIcon,
  RulesIcon,
  SendIcon,
} from "@/components/shared/icons";
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
    <section className="flex min-w-0 flex-col gap-2 rounded-sm border border-line bg-surface p-2.5">
      <header className="flex shrink-0 items-center gap-2">
        <span className="text-dim" aria-hidden>
          {icon}
        </span>
        <span className="text-[11px] font-bold tracking-wider text-dim uppercase">
          {title}
        </span>
        {count != null && (
          <span className="grid h-4.5 min-w-4.5 place-items-center rounded-full bg-accent px-1.25 text-[10px] font-bold text-white">
            {count}
          </span>
        )}
        {meta && (
          <span className="ml-auto text-[10.5px] font-semibold text-dim">
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
      : "No full sets"
    : undefined;

  return (
    <footer className="grid h-full min-h-0 grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,0.85fr)] gap-2.5 max-[1080px]:grid-cols-[minmax(0,1fr)]">
      <DockCard
        icon={<CertificateIcon className="size-4.5" />}
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
        icon={<RulesIcon className="size-4.5" />}
        title="Cards"
        count={cards.length}
      >
        <CardHand cards={cards} canUse={!!player?.jail && !!act} act={act} />
      </DockCard>

      <DockCard icon={<SendIcon className="size-4.5" />} title="Your money">
        <MoneySummary holdings={holdings} />
      </DockCard>
    </footer>
  );
}
