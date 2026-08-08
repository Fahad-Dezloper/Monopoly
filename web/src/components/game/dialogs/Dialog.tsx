"use client";

import { useEffect, type ReactNode } from "react";
import { cx } from "@/lib/ui";

const TONE: Record<string, string> = {
  neutral: "bg-[#f8f6ff]",
  accent: "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white",
  alert: "bg-rose-50",
  positive: "bg-emerald-50",
};

const SIZE: Record<string, string> = {
  sm: "w-[min(400px,100%)]",
  md: "w-[min(520px,100%)]",
  lg: "w-[min(760px,100%)]",
};

interface DialogProps {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  tone?: keyof typeof TONE;
  size?: keyof typeof SIZE;
  accent?: string;
  onClose?: () => void;
  closeLabel?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export function Dialog({
  eyebrow,
  title,
  subtitle,
  tone = "neutral",
  size = "sm",
  accent,
  onClose,
  closeLabel = "Close",
  footer,
  children,
}: DialogProps) {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/35 p-5 backdrop-blur-[2px]"
      onClick={() => onClose?.()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className={cx(
          "flex max-h-[86vh] flex-col overflow-hidden rounded-3xl border border-[#e9e2ff] bg-white text-slate-800 shadow-2xl",
          SIZE[size],
        )}
      >
        {accent && (
          <span
            className="h-1.5 w-full shrink-0"
            style={{ background: accent }}
          />
        )}

        <header
          className={cx(
            "flex shrink-0 items-start justify-between gap-4 px-5 py-4",
            TONE[tone],
          )}
        >
          <div className="min-w-0">
            {eyebrow && (
              <div
                className={cx(
                  "mb-1 text-[10px] font-extrabold tracking-[0.14em] uppercase",
                  tone === "accent" ? "text-white/80" : "text-[#7c3aed]",
                )}
              >
                {eyebrow}
              </div>
            )}
            <h2
              className={cx(
                "text-[19px] leading-tight font-extrabold",
                tone === "accent" ? "text-white" : "text-slate-900",
              )}
            >
              {title}
            </h2>
            {subtitle && (
              <div
                className={cx(
                  "mt-1 text-[12.5px] leading-normal",
                  tone === "accent" ? "text-white/75" : "text-slate-500",
                )}
              >
                {subtitle}
              </div>
            )}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              title={`${closeLabel} (Esc)`}
              className={cx(
                "-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-xl text-[15px] transition-colors",
                tone === "accent"
                  ? "text-white/70 hover:bg-white/15 hover:text-white"
                  : "text-slate-400 hover:bg-[#f0ebff] hover:text-slate-700",
              )}
            >
              ✕
            </button>
          )}
        </header>

        <div className="scrollless min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-[#e9e2ff] bg-[#fdfcff] p-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export const dialogPrimary =
  "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-4 text-[13px] font-bold text-white shadow-[0_6px_16px_rgba(124,58,237,0.3)] transition-all hover:not-disabled:opacity-95 disabled:cursor-not-allowed disabled:opacity-40";

export const dialogGhost =
  "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[#e9e2ff] bg-white px-4 text-[13px] font-semibold text-slate-700 shadow-sm transition-colors hover:not-disabled:border-[#7c3aed]/35 hover:not-disabled:bg-[#f8f6ff] disabled:cursor-not-allowed disabled:opacity-40";

export const dialogSecondary =
  "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] px-4 text-[13px] font-bold text-white shadow-[0_6px_16px_rgba(6,182,212,0.3)] transition-all hover:not-disabled:opacity-95 disabled:cursor-not-allowed disabled:opacity-40";

export const dialogDanger =
  "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 text-[13px] font-semibold text-rose-500 transition-colors hover:bg-rose-50";
