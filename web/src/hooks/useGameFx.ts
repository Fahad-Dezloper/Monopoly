"use client";

import { useEffect, useRef, useState } from "react";
import { DICE_ROLL_MS } from "@/hooks/useDiceRoll";
import { playSfx, unlockAudio } from "@/lib/monopoly/sounds";
import type { GameState } from "@/lib/monopoly/types";

export interface MoneyFlash {
  delta: number;
  id: number;
}

const STEP_MS = 175;
const FLASH_MS = 1400;
const MAX_DICE_DISTANCE = 12;

interface FxSnapshot {
  money: Record<number, number>;
  position: Record<number, number>;
  owners: number[];
  turn: number;
  diceKey: string;
}

function pathForward(from: number, to: number): number[] {
  if (from === to || from < 0 || to < 0) return [];
  const distance = (to - from + 40) % 40;
  if (distance === 0) return [];
  if (distance > MAX_DICE_DISTANCE) return [to];

  const steps: number[] = [];
  let current = from;
  for (let step = 0; step < distance; step += 1) {
    current = (current + 1) % 40;
    steps.push(current);
  }
  return steps;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function snapshot(state: GameState): FxSnapshot {
  const money: Record<number, number> = {};
  const position: Record<number, number> = {};

  for (const player of state.players) {
    if (player.index <= 0) continue;
    money[player.index] = Number.isFinite(player.money) ? player.money : NaN;
    position[player.index] = player.position;
  }

  return {
    money,
    position,
    owners: state.squares.map((square) => square.owner),
    turn: state.turn,
    diceKey: state.diceRolled
      ? `${state.turn}-${state.die1}-${state.die2}-${state.players[state.turn]?.position ?? -1}`
      : "",
  };
}

export function useGameFx(state: GameState | null | undefined) {
  const prevRef = useRef<FxSnapshot | null>(null);
  const moveLock = useRef(new Set<number>());
  const flashId = useRef(0);

  const [moneyFlashes, setMoneyFlashes] = useState<Record<number, MoneyFlash>>({});
  const [displayPositions, setDisplayPositions] = useState<Record<number, number>>({});
  const [hopping, setHopping] = useState<Record<number, number>>({});

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    if (!state) return;

    const next = snapshot(state);
    const prev = prevRef.current;
    if (!prev) {
      prevRef.current = next;
      return;
    }

    const diceJustRolled =
      !!next.diceKey && next.diceKey !== prev.diceKey && state.diceRolled;

    if (diceJustRolled) playSfx("roll");
    if (state.turn !== prev.turn && state.phase !== "game_over") playSfx("turn");

    for (const player of state.players) {
      if (player.index <= 0) continue;
      const before = prev.money[player.index];
      const after = next.money[player.index];

      if (before == null || !Number.isFinite(before) || !Number.isFinite(after)) {
        if (Number.isFinite(before) && !Number.isFinite(after)) {
          playSfx("eliminate");
        }
        continue;
      }

      const delta = Math.round(after - before);
      if (delta === 0) continue;

      flashId.current += 1;
      const id = flashId.current;
      setMoneyFlashes((flashes) => ({ ...flashes, [player.index]: { delta, id } }));
      window.setTimeout(() => {
        setMoneyFlashes((flashes) => {
          if (flashes[player.index]?.id !== id) return flashes;
          const updated = { ...flashes };
          delete updated[player.index];
          return updated;
        });
      }, FLASH_MS);

      playSfx(delta > 0 ? "cashIn" : "cashOut");
    }

    for (let index = 0; index < next.owners.length; index += 1) {
      if (next.owners[index] > 0 && prev.owners[index] === 0) {
        playSfx("buy");
        break;
      }
    }

    for (const player of state.players) {
      if (player.index <= 0) continue;
      const from = prev.position[player.index];
      const to = next.position[player.index];
      if (from == null || to == null || from === to) continue;
      if (from < 0 || to < 0) continue;
      if (moveLock.current.has(player.index)) continue;

      const steps = pathForward(from, to);
      if (steps.length === 0) continue;

      const waitForDice = diceJustRolled && player.index === state.turn;
      moveLock.current.add(player.index);

      void (async () => {
        setDisplayPositions((positions) => ({ ...positions, [player.index]: from }));
        await sleep(waitForDice ? DICE_ROLL_MS + 80 : 60);

        for (const step of steps) {
          setDisplayPositions((positions) => ({ ...positions, [player.index]: step }));
          setHopping((hops) => ({
            ...hops,
            [player.index]: (hops[player.index] ?? 0) + 1,
          }));
          playSfx("move");
          await sleep(STEP_MS);
        }

        setDisplayPositions((positions) => {
          const updated = { ...positions };
          delete updated[player.index];
          return updated;
        });
        moveLock.current.delete(player.index);
      })();
    }

    prevRef.current = next;
  }, [state]);

  return { moneyFlashes, displayPositions, hopping };
}
