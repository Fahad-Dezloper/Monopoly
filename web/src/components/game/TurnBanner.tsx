"use client";

import type { Player } from "@/lib/monopoly/types";

interface TurnBannerProps {
  current?: Player;
  isMyTurn: boolean;
  error: string | null;
}

export function TurnBanner({ current, isMyTurn, error }: TurnBannerProps) {
  if (!error) return null;

  return (
    <div className="flex items-center gap-2 rounded-[10px] border border-line bg-surface px-3 py-1.75 text-[12px] text-dim">
      <span
        className="size-2.5 rounded-full"
        style={{ background: current?.color }}
        aria-hidden
      />
      {isMyTurn ? (
        <strong className="text-body">Your turn</strong>
      ) : (
        <span>
          Waiting for{" "}
          <strong className="text-body">{current?.name ?? "…"}</strong>
        </span>
      )}
      <span className="ml-auto text-bad">{error}</span>
    </div>
  );
}
