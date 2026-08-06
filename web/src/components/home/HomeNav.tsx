"use client";

import { Logo } from "@/components/shared/Logo";

interface HomeNavProps {
  onPlay: () => void;
  onRules: () => void;
}

const LINK =
  "relative py-1 text-[12px] font-semibold tracking-[0.08em] text-dim no-underline hover:text-body";

export function HomeNav({ onPlay, onRules }: HomeNavProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line-soft bg-shell/92 px-[clamp(16px,5vw,72px)] py-3.5">
      <Logo size="sm" href={null} />
      <nav className="flex items-center gap-[clamp(14px,2.4vw,32px)] max-[720px]:hidden">
        <a
          href="#top"
          className={`${LINK} text-body after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-accent after:content-['']`}
        >
          Home
        </a>
        <a href="#how" className={LINK}>
          How to play
        </a>
        <a href="#features" className={LINK}>
          Features
        </a>
        <button type="button" className={LINK} onClick={onRules}>
          Rules
        </button>
      </nav>
      <button
        type="button"
        className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-hot bg-hot px-5 py-[11px] text-[13px] font-bold tracking-[0.04em] text-white transition-colors hover:border-[#c41222] hover:bg-[#c41222]"
        onClick={onPlay}
      >
        Play now
      </button>
    </header>
  );
}
