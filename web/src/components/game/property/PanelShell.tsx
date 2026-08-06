"use client";

import type { ReactNode } from "react";
import { cx, panelClose } from "@/lib/ui";

interface PanelShellProps {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  accent?: string;
  tone?: "neutral" | "alert" | "positive";
  onClose?: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

const TONE: Record<string, string> = {
  neutral: "bg-surface-2",
  alert: "bg-bad/15",
  positive: "bg-good/15",
};

export function PanelShell({
  eyebrow,
  title,
  subtitle,
  accent,
  tone = "neutral",
  onClose,
  children,
  footer,
}: PanelShellProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-sm border border-line bg-surface">
      {accent && (
        <span
          className="h-1.5 w-full shrink-0"
          style={{ background: accent }}
        />
      )}

      <header
        className={cx(
          "flex shrink-0 items-start justify-between gap-2.5 px-3.5 py-3",
          TONE[tone],
        )}
      >
        <div className="min-w-0">
          {eyebrow && (
            <div className="text-[10px] font-bold tracking-[0.08em] text-dim uppercase">
              {eyebrow}
            </div>
          )}
          <div className="truncate text-[15px] font-extrabold text-body">
            {title}
          </div>
          {subtitle && (
            <div className="mt-0.5 text-[11.5px] text-dim">{subtitle}</div>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            className={panelClose}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </header>

      <div className="scrollless min-h-0 flex-1 overflow-y-auto px-3.5 py-2">
        {children}
      </div>

      {footer && (
        <div className="shrink-0 border-t border-line p-2.5">{footer}</div>
      )}
    </div>
  );
}

export function PanelSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="py-2">
      <div className="mb-1.5 text-[10px] font-bold tracking-[0.08em] text-dim uppercase">
        {label}
      </div>
      {children}
    </section>
  );
}

export function PanelStat({
  label,
  value,
  tone = "body",
}: {
  label: string;
  value: string;
  tone?: "body" | "good" | "bad";
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-[12px]">
      <span className="text-dim">{label}</span>
      <span
        className={cx(
          "font-bold tabular-nums",
          tone === "good" && "text-good",
          tone === "bad" && "text-bad",
          tone === "body" && "text-body",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function PanelNote({ children }: { children: ReactNode }) {
  return <p className="py-1 text-[12px] leading-normal text-dim">{children}</p>;
}
