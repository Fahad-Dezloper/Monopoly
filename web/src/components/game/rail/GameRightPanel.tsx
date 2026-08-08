"use client";

/**
 * Right-rail board summary for idle property panel.
 * Prefer IdleView via PropertyPanel in the live game shell.
 */
import { IdleView } from "@/components/game/property/views/IdleView";
import type { GameState } from "@/lib/monopoly/types";

interface GameRightPanelProps {
  state: GameState;
  mySeat?: number | null;
}

export function GameRightPanel({ state, mySeat = null }: GameRightPanelProps) {
  return <IdleView state={state} mySeat={mySeat} />;
}
