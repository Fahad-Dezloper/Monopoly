"use client";

import { HOW_TO_PLAY_STEPS } from "@/components/home/homeContent";

export function HowToPlaySteps() {
  return (
    <div>
      <h2 className="mt-0 mb-4 font-display text-[clamp(26px,3.2vw,40px)] font-normal tracking-[0.02em] text-body">
        How to play
      </h2>
      <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
        {HOW_TO_PLAY_STEPS.map((step) => (
          <li
            key={step.number}
            className="flex items-start gap-3.5 rounded-panel border border-line bg-surface px-4 py-3.5"
          >
            <span className="font-display text-[20px] leading-[1.2] text-accent">
              {step.number}
            </span>
            <div className="flex flex-col gap-[3px]">
              <strong className="text-[13px]">{step.title}</strong>
              <span className="text-[12px] leading-[1.5] text-dim">
                {step.body}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
