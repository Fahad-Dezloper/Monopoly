"use client";

import { useRef, useState } from "react";
import { CreateJoinPanel, type PanelTab } from "@/components/home/CreateJoinPanel";
import { FeatureStrip } from "@/components/home/FeatureStrip";
import { HeroSection } from "@/components/home/HeroSection";
import { HomeNav } from "@/components/home/HomeNav";
import { HowToPlaySteps } from "@/components/home/HowToPlaySteps";
import type { MockFlag } from "@/components/mock/mockRegistry";

interface HomeMockViewProps {
  flags: Record<string, MockFlag>;
  onAction: (label: string) => void;
}

export function HomeMockView({ flags, onAction }: HomeMockViewProps) {
  const [tab, setTab] = useState<PanelTab>("create");
  const nameRef = useRef<HTMLInputElement>(null);

  const on = (key: string) => flags[key]?.visible ?? false;
  const mocked = (key: string) => flags[key]?.mock ?? false;

  return (
    <div className="min-h-dvh overflow-x-clip bg-shell font-sans text-body">
      {on("nav") && (
        <HomeNav
          onPlay={() => onAction("nav: play now")}
          onRules={() => onAction("nav: rules")}
        />
      )}

      {on("hero") && (
        <HeroSection
          onCreate={() => onAction("hero: play online")}
          onJoin={() => onAction("hero: join with code")}
          onScrollDown={() => onAction("hero: scroll down")}
        />
      )}

      {on("features") && <FeatureStrip />}

      <section id="how" className="grid grid-cols-[minmax(0,1fr)_minmax(330px,420px)] items-start gap-[clamp(20px,4vw,48px)] px-[clamp(16px,5vw,72px)] pb-[clamp(40px,8vw,80px)] max-[1080px]:grid-cols-[minmax(0,1fr)]">
        {on("steps") && <HowToPlaySteps />}
        {on("panel") && (
          <CreateJoinPanel
            ref={nameRef}
            tab={tab}
            busy={false}
            error={mocked("panel") ? null : "room not found"}
            initialJoinCode={mocked("panel") ? "R7XK42" : null}
            onTabChange={setTab}
            onCreate={(input) => onAction(`createGame(${JSON.stringify(input)})`)}
            onJoin={(input) => onAction(`joinGame(${JSON.stringify(input)})`)}
            onClearError={() => onAction("clearError()")}
          />
        )}
      </section>
    </div>
  );
}
