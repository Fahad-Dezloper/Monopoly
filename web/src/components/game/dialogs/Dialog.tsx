"use client";

import { useEffect, type ReactNode } from "react";
import { cx } from "@/lib/ui";

const TONE: Record<string, string> = {
  neutral: "bg-surface-2",
  accent: "bg-accent text-white",
  alert: "bg-bad/18",
  positive: "bg-good/15",
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
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5"
      onClick={() => onClose?.()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className={cx(
          "flex max-h-[86vh] flex-col overflow-hidden rounded-sm border border-line bg-surface shadow-panel",
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
              <div className="mb-0.5 text-[10px] font-bold tracking-[0.14em] uppercase opacity-70">
                {eyebrow}
              </div>
            )}
            <h2 className="text-[19px] leading-tight font-extrabold">
              {title}
            </h2>
            {subtitle && (
              <div className="mt-1 text-[12.5px] leading-normal opacity-75">
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
              className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-sm text-[15px] opacity-60 transition-opacity hover:opacity-100"
            >
              ✕
            </button>
          )}
        </header>

        <div className="scrollless min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-line bg-shell-2/60 p-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export const dialogPrimary =
  "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-sm bg-accent px-4 text-[13px] font-bold text-white transition-colors hover:not-disabled:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40";

export const dialogGhost =
  "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-sm border border-line bg-surface-2 px-4 text-[13px] font-semibold text-body transition-colors hover:not-disabled:border-[#3e3e48] hover:not-disabled:bg-[#2a2a32] disabled:cursor-not-allowed disabled:opacity-40";

export const dialogDanger =
  "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-sm border border-bad/40 px-4 text-[13px] font-semibold text-[#f07a8a] transition-colors hover:bg-bad/10";
