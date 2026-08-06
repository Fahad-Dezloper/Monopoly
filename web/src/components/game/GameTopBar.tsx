"use client";

import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { useEffect, useRef, useState } from "react";
import {
  CopiedIcon,
  CopyIcon,
  LogoutIcon,
  RulesIcon,
  SettingsIcon,
  SpeakerOffIcon,
  SpeakerOnIcon,
} from "@/components/shared/icons";
import { Logo } from "@/components/shared/Logo";
import { clockParts } from "@/hooks/useTurnClock";
import { cx } from "@/lib/ui";

const URGENT_MS = 30_000;

const ICON_BUTTON =
  "inline-flex size-10 items-center justify-center rounded-sm border border-line bg-surface-2 text-body transition-colors hover:border-[#3e3e48] hover:bg-[#2a2a32]";

const TOOLTIP =
  "pointer-events-none absolute top-full left-1/2 z-30 mt-1.5 -translate-x-1/2 rounded-sm border border-line bg-shell-2 px-2 py-1 text-[11px] font-medium whitespace-nowrap text-body opacity-0 shadow-panel transition-opacity group-hover:opacity-100";

const MENU_ITEM =
  "flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2.5 text-left text-[13px] font-semibold text-body hover:bg-surface-2";

interface GameTopBarProps {
  roomCode: string;
  remaining: number;
  turn: number;
  showClock: boolean;
  soundOff: boolean;
  onRules: () => void;
  onToggleSound: () => void;
  onLeave: () => void;
}

export function GameTopBar({
  roomCode,
  remaining,
  turn,
  showClock,
  soundOff,
  onRules,
  onToggleSound,
  onLeave,
}: GameTopBarProps) {
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const urgent = showClock && remaining > 0 && remaining <= URGENT_MS;
  const { minutes, seconds } = clockParts(remaining);

  useEffect(() => {
    if (!settingsOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!settingsRef.current?.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSettingsOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [settingsOpen]);

  const copyInvite = async () => {
    try {
      await navigator.clipboard?.writeText(
        `${window.location.origin}/?join=${roomCode}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const runAndClose = (action: () => void) => {
    action();
    setSettingsOpen(false);
  };

  return (
    <div className="flex h-full w-full items-center gap-3 px-4 max-[720px]:flex-wrap max-[720px]:justify-center">
      <div className="flex min-w-0 flex-1 basis-0 items-center gap-2">
        <Logo badge href={null} />
      </div>

      <div className="flex shrink-0 items-center justify-center gap-4.5 max-[720px]:order-3 max-[720px]:w-full">
        <div className="flex min-w-17.5 flex-col items-center gap-0.5">
          <span className="inline-flex items-center gap-1.25 text-[10px] font-semibold tracking-[0.06em] text-dim uppercase">
            Time Left
          </span>
          <span
            className={cx(
              "text-[18px] font-extrabold tabular-nums",
              urgent
                ? "animate-clock-pulse text-bad motion-reduce:animate-none"
                : "text-body",
            )}
          >
            {showClock ? (
              <NumberFlowGroup>
                <span className="inline-flex items-baseline">
                  <NumberFlow trend={-1} value={minutes} />
                  <NumberFlow
                    prefix=":"
                    trend={-1}
                    value={seconds}
                    digits={{ 1: { max: 5 } }}
                    format={{ minimumIntegerDigits: 2 }}
                  />
                </span>
              </NumberFlowGroup>
            ) : (
              "—"
            )}
          </span>
        </div>
        <span className="h-6.5 w-px bg-line" aria-hidden />
        <div className="flex min-w-17.5 flex-col items-center gap-0.5">
          <span className="text-[10px] font-semibold tracking-[0.06em] text-dim uppercase">
            Turn
          </span>
          <span className="text-[18px] font-extrabold tabular-nums text-body">
            <NumberFlow value={turn} />
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 basis-0 items-center justify-end gap-2">
        <div className="relative" ref={settingsRef}>
          <div className="group relative">
            <button
              type="button"
              className={cx(ICON_BUTTON, settingsOpen && "border-accent")}
              onClick={() => setSettingsOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={settingsOpen}
              aria-label="Settings"
            >
              <SettingsIcon className="size-5.5" />
            </button>
            {!settingsOpen && <span className={TOOLTIP}>Settings</span>}
          </div>

          {settingsOpen && (
            <div
              role="menu"
              className="absolute top-full right-0 z-40 mt-1.5 w-52 rounded-sm border border-line bg-shell-2 p-1 shadow-panel"
            >
              <button
                type="button"
                role="menuitem"
                className={MENU_ITEM}
                onClick={() => runAndClose(onToggleSound)}
              >
                <span className="inline-flex items-center gap-2.5">
                  {soundOff ? (
                    <SpeakerOffIcon className="size-5" />
                  ) : (
                    <SpeakerOnIcon className="size-5" />
                  )}
                  Music
                </span>
                <span
                  className={cx(
                    "rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase",
                    soundOff ? "bg-surface-2 text-dim" : "bg-accent text-white",
                  )}
                >
                  {soundOff ? "Off" : "On"}
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                className={MENU_ITEM}
                onClick={() => runAndClose(onRules)}
              >
                <span className="inline-flex items-center gap-2.5">
                  <RulesIcon className="size-5" />
                  Rules
                </span>
              </button>
            </div>
          )}
        </div>

        <div className="group relative">
          <button
            type="button"
            className={cx(
              ICON_BUTTON,
              "border-bad/45 bg-transparent text-[#f07a8a] hover:border-bad hover:bg-bad/10 hover:text-[#ff8f9d]",
            )}
            onClick={onLeave}
            aria-label="Leave game"
          >
            <LogoutIcon className="size-5.5" />
          </button>
          <span className={TOOLTIP}>Leave game</span>
        </div>

        <div className="group relative">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-sm border border-line bg-surface-2 px-3 py-2 text-[12px] font-semibold text-body hover:border-[#3e3e48]"
            onClick={copyInvite}
            aria-label="Copy invite link"
          >
            <span className="font-medium text-dim">Room</span>
            <span className="font-bold tracking-[0.12em]">{roomCode}</span>
            {copied ? (
              <CopiedIcon className="size-4.5 text-good" />
            ) : (
              <CopyIcon className="size-4.5 text-dim" />
            )}
          </button>
          <span className={TOOLTIP}>
            {copied ? "Link copied" : "Copy invite link"}
          </span>
        </div>
      </div>
    </div>
  );
}
