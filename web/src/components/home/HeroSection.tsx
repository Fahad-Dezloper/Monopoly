"use client";

import { HeroStats } from "@/components/home/HeroStats";

interface HeroSectionProps {
  onCreate: () => void;
  onJoin: () => void;
  onScrollDown: () => void;
}

const CTA =
  "inline-flex items-center justify-center gap-2 rounded-xl border px-6.5 py-[15px] text-[14px] font-bold tracking-[0.04em] transition-colors";

export function HeroSection({
  onCreate,
  onJoin,
  onScrollDown,
}: HeroSectionProps) {
  return (
    <section
      id="top"
      className="relative grid min-h-[min(78vh,700px)] grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] items-center gap-[clamp(16px,3vw,40px)] pt-[clamp(24px,5vw,56px)] pr-0 pb-[clamp(30px,5vw,60px)] pl-[clamp(16px,5vw,72px)] max-[1080px]:min-h-0 max-[1080px]:grid-cols-[minmax(0,1fr)] max-[1080px]:pr-[clamp(16px,5vw,72px)] min-[1081px]:min-h-[min(74vh,660px)] min-[1081px]:grid-cols-[minmax(0,1fr)] min-[1081px]:pr-[clamp(16px,5vw,72px)]"
    >
      <div className="relative z-2 flex max-w-[620px] flex-col gap-4.5 min-[1081px]:pr-[6%]">
        <span className="inline-flex items-center gap-2.5 text-[11px] font-bold tracking-[0.18em] text-warn">
          <span aria-hidden>◆</span> MULTIPLAYER PROPERTY WARS{" "}
          <span aria-hidden>◆</span>
        </span>

        <h1 className="m-0 flex flex-col font-display text-[clamp(40px,6.8vw,88px)] leading-[0.95] font-normal tracking-[0.01em]">
          <span className="text-body">Own it all.</span>
          <span className="text-hot">Live the game.</span>
        </h1>

        <p className="m-0 max-w-[44ch] text-[clamp(13px,1.2vw,15px)] leading-[1.65] text-dim">
          Buy, sell, trade and build your empire across 40 world cities.
          Outsmart your friends and be the last player standing.
        </p>

        <HeroStats />

        <div className="mt-1.5 flex flex-wrap gap-3">
          <button
            type="button"
            className={`${CTA} border-hot bg-hot text-white hover:border-[#c41222] hover:bg-[#c41222]`}
            onClick={onCreate}
          >
            Play online <span aria-hidden>→</span>
          </button>
          <button
            type="button"
            className={`${CTA} border-line bg-transparent text-body hover:border-[#4a4a58] hover:bg-surface`}
            onClick={onJoin}
          >
            Join with code{" "}
            <span
              className="grid size-[22px] place-items-center rounded-full border border-line text-[11px]"
              aria-hidden
            >
              #
            </span>
          </button>
        </div>

        <button
          type="button"
          className="mt-2 inline-flex items-center gap-2.5 border-none bg-transparent p-0 text-[12px] font-semibold text-dim hover:text-body"
          onClick={onScrollDown}
        >
          <span
            className="relative h-6 w-4 rounded-[9px] border-[1.5px] border-current after:absolute after:top-[5px] after:left-1/2 after:h-[5px] after:w-0.5 after:-translate-x-1/2 after:animate-scroll-hint after:rounded-sm after:bg-current after:content-[''] motion-reduce:after:animate-none"
            aria-hidden
          />
          Scroll down
          <span aria-hidden>⌄</span>
        </button>
      </div>

      <div
        className="relative w-full justify-self-end -mr-[clamp(16px,5vw,72px)] max-[1080px]:order-first max-[1080px]:mr-0 min-[1081px]:absolute min-[1081px]:inset-y-0 min-[1081px]:right-0 min-[1081px]:left-auto min-[1081px]:m-0 min-[1081px]:w-[min(62%,960px)]"
        aria-hidden
      >
        <img
          src="/assets/hero.png"
          alt=""
          width={1248}
          height={832}
          loading="eager"
          fetchPriority="high"
          className="relative h-auto w-full rounded-l-[16px] opacity-92 max-[1080px]:rounded-xl min-[1081px]:h-full min-[1081px]:rounded-none min-[1081px]:object-cover min-[1081px]:object-[40%_45%]"
        />
      </div>
    </section>
  );
}
