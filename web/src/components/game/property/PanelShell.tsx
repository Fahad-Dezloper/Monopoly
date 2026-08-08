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
  neutral: "bg-[#f8f6ff]",
  alert: "bg-rose-50",
  positive: "bg-emerald-50",
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#e9e2ff] bg-white shadow-sm">
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
            <div className="text-[10px] font-extrabold tracking-[0.08em] text-[#7c3aed] uppercase">
              {eyebrow}
            </div>
          )}
          <div className="truncate text-[15px] font-extrabold text-slate-900">
            {title}
          </div>
          {subtitle && (
            <div className="mt-0.5 text-[11.5px] text-slate-500">{subtitle}</div>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            className={cx(panelClose, "text-slate-400 hover:text-slate-700")}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </header>

      <div className="scrollless min-h-0 flex-1 overflow-y-auto px-3.5 py-2 text-slate-800">
        {children}
      </div>

      {footer && (
        <div className="shrink-0 border-t border-[#e9e2ff] bg-[#fdfcff] p-2.5">
          {footer}
        </div>
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
      <div className="mb-1.5 text-[10px] font-extrabold tracking-[0.08em] text-[#7c3aed] uppercase">
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
      <span className="font-semibold text-slate-500">{label}</span>
      <span
        className={cx(
          "font-bold tabular-nums",
          tone === "good" && "text-emerald-600",
          tone === "bad" && "text-rose-500",
          tone === "body" && "text-slate-800",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function PanelNote({ children }: { children: ReactNode }) {
  return (
    <p className="py-1 text-[12px] leading-normal text-slate-500">{children}</p>
  );
}
