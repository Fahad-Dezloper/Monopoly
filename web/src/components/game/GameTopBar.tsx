"use client";

import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { useEffect, useRef, useState } from "react";
import {
  LogoutIcon,
  RulesIcon,
  SettingsIcon,
  SpeakerOffIcon,
  SpeakerOnIcon,
} from "@/components/shared/icons";
import { clockParts } from "@/hooks/useTurnClock";
import { cx } from "@/lib/ui";

const URGENT_MS = 30_000;

const ICON_BTN =
  "grid size-10 place-items-center rounded-2xl border border-[#e9e2ff] bg-white text-[#7c3aed] shadow-sm transition-all hover:border-[#7c3aed]/40 hover:bg-[#f8f6ff]";

interface GameTopBarProps {
  roomCode: string;
  /** Explorer link for the game account, when the game is on chain. */
  chainUrl?: string;
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
  chainUrl,
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
    <header className="flex w-full items-center gap-3 px-1 max-[720px]:flex-wrap max-[720px]:justify-center">
      <div className="flex min-w-0 flex-1 basis-0 items-center">
        <img
          src="/logo/sologo.png"
          alt="Solana City"
          className="h-24 w-auto drop-shadow-sm"
        />
      </div>

      <div className="flex shrink-0 items-center gap-5">
        <div className="flex min-w-18 flex-col items-center gap-0.5">
          <span className="text-[10px] font-extrabold tracking-[0.12em] text-slate-400 uppercase">
            Time Left
          </span>
          <span
            className={cx(
              "inline-flex items-center gap-1.5 text-[20px] font-black tabular-nums",
              urgent
                ? "animate-clock-pulse text-rose-500 motion-reduce:animate-none"
                : "text-[#7c3aed]",
            )}
          >
            <svg
              className="size-4 shrink-0 text-[#7c3aed]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden
            >
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="M12 7v5l3 2" />
            </svg>
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

        <span className="h-8 w-px bg-[#e9e2ff]" aria-hidden />

        <div className="flex min-w-12 flex-col items-center gap-0.5">
          <span className="text-[10px] font-extrabold tracking-[0.12em] text-slate-400 uppercase">
            Turn
          </span>
          <span className="text-[20px] font-black tabular-nums text-[#7c3aed]">
            <NumberFlow value={turn} />
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 basis-0 items-center justify-end gap-2">
        <div className="relative" ref={settingsRef}>
          <button
            type="button"
            className={cx(
              ICON_BTN,
              settingsOpen && "border-[#7c3aed] bg-[#f8f6ff]",
            )}
            onClick={() => setSettingsOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={settingsOpen}
            aria-label="Settings"
          >
            <SettingsIcon className="size-5" />
          </button>

          {settingsOpen && (
            <div
              role="menu"
              className="absolute top-full right-0 z-40 mt-1.5 w-52 rounded-2xl border border-[#e9e2ff] bg-white p-1.5 shadow-xl"
            >
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2.5 text-left text-[13px] font-semibold text-slate-700 hover:bg-[#f8f6ff]"
                onClick={() => runAndClose(onToggleSound)}
              >
                <span className="inline-flex items-center gap-2.5">
                  {soundOff ? (
                    <SpeakerOffIcon className="size-5 text-slate-400" />
                  ) : (
                    <SpeakerOnIcon className="size-5 text-[#7c3aed]" />
                  )}
                  Music
                </span>
                <span
                  className={cx(
                    "rounded-lg px-1.5 py-0.5 text-[10px] font-bold uppercase",
                    soundOff
                      ? "bg-[#f0ebff] text-slate-400"
                      : "bg-[#7c3aed] text-white",
                  )}
                >
                  {soundOff ? "Off" : "On"}
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-[13px] font-semibold text-slate-700 hover:bg-[#f8f6ff]"
                onClick={() => runAndClose(onRules)}
              >
                <RulesIcon className="size-5 text-[#7c3aed]" />
                Rules
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          className={ICON_BTN}
          onClick={onLeave}
          aria-label="Leave game"
          title="Leave game"
        >
          <LogoutIcon className="size-5" />
        </button>

        {chainUrl && (
          <a
            href={chainUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="View this game account on Solana Explorer"
            className="inline-flex items-center gap-1.5 rounded-2xl border border-[#c9f2e4] bg-[#eafaf4] px-3 py-2 text-[11px] font-extrabold tracking-wide text-emerald-700 uppercase shadow-sm transition-colors hover:border-emerald-400 hover:bg-[#dff6ee]"
          >
            <span
              className="size-1.5 rounded-full bg-emerald-500"
              aria-hidden
            />
            On chain
            <span aria-hidden>↗</span>
          </a>
        )}

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-2xl border border-[#e9e2ff] bg-white px-3.5 py-2 text-[12px] font-semibold text-slate-700 shadow-sm transition-colors hover:border-[#7c3aed]/40 hover:bg-[#f8f6ff]"
          onClick={copyInvite}
          aria-label="Copy invite link"
        >
          <span className="font-medium text-slate-400">Room</span>
          <span className="font-black tracking-[0.12em] text-[#7c3aed] uppercase">
            {roomCode}
          </span>
          <svg
            className="size-4 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            {copied ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
                className="text-emerald-600"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            )}
          </svg>
        </button>
      </div>
    </header>
  );
}
