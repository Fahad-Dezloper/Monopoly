"use client";

import { useRef, useState } from "react";
import { CreateJoinPanel, type PanelTab } from "@/components/home/CreateJoinPanel";
import { FeatureStrip } from "@/components/home/FeatureStrip";
import { HeroSection } from "@/components/home/HeroSection";
import { HomeNav } from "@/components/home/HomeNav";
import { HowToPlaySteps } from "@/components/home/HowToPlaySteps";
import { RulesDialog } from "@/components/game/dialogs/RulesDialog";
import type { PlayerColor } from "@/lib/monopoly/types";

interface HomeScreenProps {
  busy: boolean;
  error: string | null;
  initialJoinCode?: string | null;
  preferJoin?: boolean;
  onCreate: (input: {
    name: string;
    color: PlayerColor;
    maxPlayers: number;
  }) => void;
  onJoin: (input: { code: string; name: string; color: PlayerColor }) => void;
  onClearError: () => void;
}

export function HomeScreen({
  busy,
  error,
  initialJoinCode,
  preferJoin = false,
  onCreate,
  onJoin,
  onClearError,
}: HomeScreenProps) {
  const [tab, setTab] = useState<PanelTab>(
    initialJoinCode || preferJoin ? "join" : "create",
  );
  const [showRules, setShowRules] = useState(false);
  const playRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const goToPanel = (next?: PanelTab) => {
    if (next) setTab(next);
    playRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => nameRef.current?.focus(), 420);
  };

  return (
    <div className="min-h-dvh overflow-x-clip bg-shell font-sans text-body">
      <HomeNav onPlay={() => goToPanel()} onRules={() => setShowRules(true)} />

      <HeroSection
        onCreate={() => goToPanel("create")}
        onJoin={() => goToPanel("join")}
        onScrollDown={() => goToPanel()}
      />

      <FeatureStrip />

      <section
        id="how"
        ref={playRef}
        className="grid scroll-mt-20 grid-cols-[minmax(0,1fr)_minmax(330px,420px)] items-start gap-[clamp(20px,4vw,48px)] px-[clamp(16px,5vw,72px)] pb-[clamp(40px,8vw,80px)] max-[1080px]:grid-cols-[minmax(0,1fr)]"
      >
        <HowToPlaySteps />
        <CreateJoinPanel
          ref={nameRef}
          tab={tab}
          busy={busy}
          error={error}
          initialJoinCode={initialJoinCode}
          onTabChange={setTab}
          onCreate={onCreate}
          onJoin={onJoin}
          onClearError={onClearError}
        />
      </section>

      <RulesDialog open={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
