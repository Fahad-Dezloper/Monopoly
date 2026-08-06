"use client";

import { useEffect, useState } from "react";

export function formatClock(ms: number): string {
  const { minutes, seconds } = clockParts(ms);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function clockParts(ms: number): { minutes: number; seconds: number } {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return { minutes: Math.floor(total / 60), seconds: total % 60 };
}

export function useTurnClock(deadlineAt?: number): number {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, (deadlineAt ?? 0) - Date.now()));
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [deadlineAt]);

  return remaining;
}
