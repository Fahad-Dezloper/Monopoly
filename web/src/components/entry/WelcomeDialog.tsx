"use client";

import {
  Dialog,
  dialogGhost,
  dialogPrimary,
} from "@/components/game/dialogs/Dialog";
import {
  GAME_POINTS,
  GAME_TAGLINE,
  HOW_IT_WORKS,
} from "@/components/entry/entryContent";

interface WelcomeDialogProps {
  onCreate: () => void;
  onJoin: () => void;
}

export function WelcomeDialog({ onCreate, onJoin }: WelcomeDialogProps) {
  return (
    <Dialog
      eyebrow="Robinverse"
      title="The property game, online with friends"
      subtitle={GAME_TAGLINE}
      size="lg"
      footer={
        <div className="flex gap-2 max-[480px]:flex-col">
          <button type="button" className={dialogPrimary} onClick={onCreate}>
            Create a lobby
          </button>
          <button type="button" className={dialogGhost} onClick={onJoin}>
            Join with a code
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-2.5 max-[560px]:grid-cols-1">
        {GAME_POINTS.map((point) => (
          <div
            key={point.title}
            className="rounded-sm border border-line bg-surface-2 p-3"
          >
            <div className="text-[13px] font-bold text-body">{point.title}</div>
            <p className="mt-1 text-[12px] leading-relaxed text-dim">
              {point.body}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-4">
        <h3 className="mb-2 text-[10px] font-bold tracking-[0.14em] text-dim uppercase">
          How a game plays out
        </h3>
        <ol className="flex flex-col gap-1.5">
          {HOW_IT_WORKS.map((step, index) => (
            <li
              key={step}
              className="flex gap-2.5 text-[12.5px] leading-relaxed text-body"
            >
              <span className="mt-px grid size-4.5 shrink-0 place-items-center rounded-full bg-accent/20 text-[10px] font-bold text-accent">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>
    </Dialog>
  );
}
