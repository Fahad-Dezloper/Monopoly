"use client";

import { HOME_FEATURES } from "@/components/home/homeContent";

export function FeatureStrip() {
  return (
    <section
      id="features"
      className="mx-[clamp(16px,5vw,72px)] mb-[clamp(28px,5vw,48px)] grid grid-cols-4 overflow-hidden rounded-panel border border-line bg-surface max-[1080px]:grid-cols-2 max-[720px]:grid-cols-1"
    >
      {HOME_FEATURES.map((feature) => (
        <div
          key={feature.title}
          className="flex items-center gap-3 border-r border-line px-4.5 py-4 last:border-r-0 max-[1080px]:nth-2:border-r-0 max-[720px]:border-r-0 max-[720px]:border-b max-[720px]:border-line"
        >
          <span className="text-[18px]" aria-hidden>
            {feature.icon}
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <strong className="text-[12px] tracking-[0.08em]">
              {feature.title}
            </strong>
            <span className="text-[11px] leading-[1.45] text-dim">
              {feature.body}
            </span>
          </div>
        </div>
      ))}
    </section>
  );
}
