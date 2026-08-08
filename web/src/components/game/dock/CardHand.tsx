"use client";

import { RulesIcon } from "@/components/shared/icons";
import type { GameAction } from "@/lib/monopoly/engine";
import { cx } from "@/lib/ui";

export interface HeldCard {
  key: "treasury" | "fortune";
  label: string;
}

interface CardHandProps {
  cards: HeldCard[];
  canUse: boolean;
  act?: (action: GameAction) => void;
}

const FACE: Record<HeldCard["key"], { tint: string; glyph: string }> = {
  treasury: { tint: "#86D6F7", glyph: "★" },
  fortune: { tint: "#C589FA", glyph: "?" },
};

export function CardHand({ cards, canUse, act }: CardHandProps) {
  if (cards.length === 0) {
    return (
      <div className="flex h-full min-h-[72px] items-center gap-3 rounded-xl border border-dashed border-line bg-surface-2/60 px-4 py-3 text-dim">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
          <RulesIcon className="size-5" />
        </div>
        <div>
          <div className="text-[13px] font-bold text-slate-700">No cards</div>
          <div className="text-[11.5px] text-slate-500">
            Fortune and Treasury decks hand these out.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scrollless flex h-full gap-2 overflow-x-auto pb-0.5">
      {cards.map((card) => {
        const face = FACE[card.key];
        return (
          <div
            key={card.key}
            className="flex h-full w-[136px] shrink-0 flex-col justify-between rounded-xl p-2.5 text-ink shadow-sm"
            style={{ background: face.tint }}
          >
            <div className="flex items-start justify-between">
              <span
                className="text-[22px] leading-none font-extrabold"
                aria-hidden
              >
                {face.glyph}
              </span>
              <span className="rounded-md bg-ink/15 px-1 py-px text-[8.5px] font-bold tracking-wider uppercase">
                Keep
              </span>
            </div>

            <div>
              <div className="text-[12.5px] font-extrabold">{card.label}</div>
              <div className="text-[10.5px] leading-tight font-semibold text-ink/65">
                Get out of jail free
              </div>
            </div>

            <button
              type="button"
              disabled={!canUse || !act}
              onClick={() => act?.({ type: "USE_JAIL_CARD" })}
              className={cx(
                "rounded-lg py-1 text-[11px] font-bold transition-colors",
                canUse && act
                  ? "bg-ink text-white hover:bg-ink/85"
                  : "cursor-not-allowed bg-ink/12 text-ink/45",
              )}
              title={
                canUse ? "Play this card now" : "Only usable while in jail"
              }
            >
              {canUse ? "Use now" : "In jail only"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
