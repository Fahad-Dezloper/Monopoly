"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const DICE_ROLL_MS = 1100;

export function useDiceRoll() {
  const [rolling, setRolling] = useState(false);
  const timer = useRef<number | null>(null);
  const rollingRef = useRef(false);

  const startRoll = useCallback(() => {
    if (rollingRef.current) return;
    rollingRef.current = true;
    if (timer.current) window.clearTimeout(timer.current);
    setRolling(true);
    timer.current = window.setTimeout(() => {
      setRolling(false);
      rollingRef.current = false;
      timer.current = null;
    }, DICE_ROLL_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return { rolling, startRoll };
}
