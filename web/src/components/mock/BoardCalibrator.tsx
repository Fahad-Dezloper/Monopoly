"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_BOARD_SPEC,
  saveBoardSpec,
  SIDE_KEYS,
  type BoardSpec,
  type SideSpec,
} from "@/lib/monopoly/boardGeometry";
import { cx } from "@/lib/ui";

const CONTROLS: { key: keyof SideSpec; label: string; hint: string }[] = [
  { key: "start", label: "Start", hint: "Where the 9-tile run begins" },
  { key: "tile", label: "Pitch", hint: "Width/height of one tile" },
  { key: "depth", label: "Depth", hint: "How far the band reaches inward" },
];

function Scrubber({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const drag = useRef<{ x: number; start: number } | null>(null);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!drag.current) return;
      const delta = (event.clientX - drag.current.x) * 0.02;
      onChange(Number((drag.current.start + delta).toFixed(3)));
    };
    const up = () => (drag.current = null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [onChange]);

  const step = (delta: number) => onChange(Number((value + delta).toFixed(3)));

  return (
    <div className="flex items-center gap-1" title={hint}>
      <span
        className="w-10 shrink-0 cursor-ew-resize text-[9px] font-bold tracking-wider text-dim uppercase select-none"
        onPointerDown={(event) => {
          drag.current = { x: event.clientX, start: value };
        }}
      >
        {label}
      </span>
      <button
        type="button"
        className="size-4.5 rounded-xs border border-line bg-surface text-[10px] text-dim hover:text-body"
        onClick={() => step(-0.05)}
      >
        −
      </button>
      <input
        type="number"
        step={0.05}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") step(0.05);
          if (event.key === "ArrowDown") step(-0.05);
        }}
        className="w-14 rounded-xs border border-line bg-surface-2 px-1 py-0.5 text-center text-[10.5px] tabular-nums text-body"
      />
      <button
        type="button"
        className="size-4.5 rounded-xs border border-line bg-surface text-[10px] text-dim hover:text-body"
        onClick={() => step(0.05)}
      >
        +
      </button>
    </div>
  );
}

interface BoardCalibratorProps {
  spec: BoardSpec;
  onChange: (spec: BoardSpec) => void;
}

export function BoardCalibrator({ spec, onChange }: BoardCalibratorProps) {
  const [side, setSide] = useState<keyof BoardSpec>("top");
  const [copied, setCopied] = useState(false);

  const set = (key: keyof SideSpec, value: number) => {
    const next = { ...spec, [side]: { ...spec[side], [key]: value } };
    onChange(next);
    saveBoardSpec(next);
  };

  const copy = async () => {
    const body = SIDE_KEYS.map(
      (key) =>
        `  ${key}: { start: ${spec[key].start}, tile: ${spec[key].tile}, depth: ${spec[key].depth} },`,
    ).join("\n");
    await navigator.clipboard?.writeText(
      `export const DEFAULT_BOARD_SPEC: BoardSpec = {\n${body}\n};`,
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="flex shrink-0 flex-col gap-1.5 rounded-sm border border-accent bg-shell-2 p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-wider text-accent uppercase">
          Board calibration · per side
        </span>
        <button
          type="button"
          className="text-[10px] font-bold text-dim hover:text-body"
          onClick={() => {
            onChange(DEFAULT_BOARD_SPEC);
            saveBoardSpec(DEFAULT_BOARD_SPEC);
          }}
        >
          Reset
        </button>
      </div>

      <div className="flex gap-1">
        {SIDE_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSide(key)}
            className={cx(
              "flex-1 rounded-xs border py-1 text-[10px] font-bold capitalize",
              side === key
                ? "border-accent bg-accent text-white"
                : "border-line bg-surface text-dim hover:text-body",
            )}
          >
            {key}
          </button>
        ))}
      </div>

      {CONTROLS.map((control) => (
        <Scrubber
          key={control.key}
          label={control.label}
          hint={control.hint}
          value={spec[side][control.key]}
          onChange={(value) => set(control.key, value)}
        />
      ))}

      <p className="text-[9.5px] leading-tight text-dim">
        Drag the board to move all four runs at once. Each side keeps its own
        start, pitch and depth.
      </p>

      <button
        type="button"
        className={cx(
          "rounded-xs px-2 py-1.5 text-[11px] font-bold",
          copied ? "bg-good text-ink" : "bg-accent text-white",
        )}
        onClick={copy}
      >
        {copied ? "Copied to clipboard" : "Copy BOARD_SPEC"}
      </button>
    </div>
  );
}
