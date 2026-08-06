"use client";

import { HERO_STATS } from "@/components/home/homeContent";

export function HeroStats() {
  return (
    <div className="mt-1 flex flex-wrap items-stretch">
      {HERO_STATS.map((stat) => (
        <div
          key={stat.bottom}
          className="flex flex-col items-center gap-[3px] border-r border-line px-[clamp(14px,2vw,24px)] text-center first:pl-0 last:border-r-0 max-[720px]:px-3"
        >
          <span className="text-[18px] leading-none" aria-hidden>
            {stat.icon}
          </span>
          <strong className="text-[13px] tracking-[0.04em]">{stat.top}</strong>
          <span className="text-[10px] tracking-[0.08em] text-dim">
            {stat.bottom}
          </span>
        </div>
      ))}
    </div>
  );
}
