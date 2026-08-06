"use client";

import { useEffect, useRef, useState } from "react";

const FACE_ROTATION: Record<number, string> = {
  1: "rotateX(0deg) rotateY(0deg)",
  2: "rotateX(0deg) rotateY(-90deg)",
  3: "rotateX(-90deg) rotateY(0deg)",
  4: "rotateX(90deg) rotateY(0deg)",
  5: "rotateX(0deg) rotateY(90deg)",
  6: "rotateX(0deg) rotateY(180deg)",
};

const PIP_LAYOUT: Record<number, number[]> = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};

function Pips({ value }: { value: number }) {
  const spots = PIP_LAYOUT[value] ?? [5];
  return (
    <span className="die3d-pips">
      {Array.from({ length: 9 }, (_, index) => (
        <span
          key={index}
          className={`die3d-pip ${spots.includes(index + 1) ? "on" : ""}`}
        />
      ))}
    </span>
  );
}

interface DieCubeProps {
  value: number;
  rolling: boolean;
  delayMs?: number;
}

function DieCube({ value, rolling, delayMs = 0 }: DieCubeProps) {
  const safe = Math.min(6, Math.max(1, value || 1));
  const [transform, setTransform] = useState(FACE_ROTATION[safe]);
  const wasRolling = useRef(false);

  useEffect(() => {
    if (rolling && !wasRolling.current) {
      wasRolling.current = true;
      const x = 720 + Math.floor(Math.random() * 3) * 360;
      const y = 540 + Math.floor(Math.random() * 3) * 360;
      setTransform(`rotateX(${x}deg) rotateY(${y}deg)`);
      return;
    }

    if (!rolling) {
      wasRolling.current = false;
      const timer = window.setTimeout(() => {
        setTransform(FACE_ROTATION[safe]);
      }, delayMs);
      return () => window.clearTimeout(timer);
    }
  }, [rolling, safe, delayMs]);

  return (
    <div
      className={`die3d ${rolling ? "die3d-rolling" : "die3d-settled"}`}
      style={{ ["--delay" as string]: `${delayMs}ms` }}
      aria-label={`die ${safe}`}
    >
      <div className="die3d-cube" style={{ transform }}>
        {[1, 2, 3, 4, 5, 6].map((face) => (
          <div key={face} className={`die3d-face die3d-f${face}`}>
            <Pips value={face} />
          </div>
        ))}
      </div>
    </div>
  );
}

interface DiceCubesProps {
  die1: number;
  die2: number;
  rolling: boolean;
  ghost?: boolean;
}

export function DiceCubes({ die1, die2, rolling, ghost }: DiceCubesProps) {
  return (
    <div className={`dice3d-pair flex gap-4 ${ghost ? "dice3d-ghost" : ""}`}>
      <DieCube value={die1 || 1} rolling={rolling} delayMs={0} />
      <DieCube value={die2 || 1} rolling={rolling} delayMs={70} />
    </div>
  );
}
