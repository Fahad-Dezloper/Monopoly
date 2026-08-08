"use client";

import { PLAYER_COLORS } from "@/lib/monopoly/board";
import type { PlayerColor } from "@/lib/monopoly/types";

export const COLOR_HEX: Record<PlayerColor, string> = {
  aqua: "#00f0ff",
  black: "#111115",
  blue: "#0052ff",
  fuchsia: "#ff00d6",
  gray: "#808898",
  green: "#00a838",
  lime: "#2bf02b",
  maroon: "#d00000",
  navy: "#001a80",
  olive: "#8a8000",
  orange: "#ff7700",
  purple: "#8a00d0",
  red: "#ff1a1a",
  silver: "#e5e7eb",
  teal: "#00a0a0",
  yellow: "#ffe600",
};

interface PlayerIdentityFieldsProps {
  name: string;
  color: PlayerColor;
  onNameChange: (name: string) => void;
  onColorChange: (color: PlayerColor) => void;
}

export function PlayerIdentityFields({
  name,
  color,
  onNameChange,
  onColorChange,
}: PlayerIdentityFieldsProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* DISPLAY NAME */}
      <div>
        <div className="flex items-center gap-1.5 text-[#7c3aed] text-[11px] font-extrabold tracking-wider uppercase mb-1">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          <span>Display Name</span>
        </div>
        <input
          type="text"
          value={name}
          maxLength={16}
          autoFocus
          placeholder="player_1"
          onChange={(event) => onNameChange(event.target.value)}
          className="w-full px-3.5 py-2 bg-[#fcfaff] border border-[#ddd6fe] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 rounded-xl text-slate-800 font-bold text-sm outline-none transition-all"
        />
      </div>

      {/* TOKEN COLOUR */}
      <div>
        <div className="flex items-center gap-1.5 text-[#7c3aed] text-[11px] font-extrabold tracking-wider uppercase mb-1.5">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61.43.53 1.03.89 1.7.89h1.83c.96 0 1.75-.79 1.75-1.75 0-.44-.17-.85-.45-1.16-.36-.39-.55-.89-.55-1.42 0-1.24 1.01-2.25 2.25-2.25h1.25c3.31 0 6-2.69 6-6 0-1.66-.67-3.16-1.76-4.24C15.16 3.67 13.66 3 12 3z" />
          </svg>
          <span>Colour</span>
        </div>
        <div className="grid grid-cols-8 gap-1.5">
          {PLAYER_COLORS.map((value) => {
            const isSelected = color === value;
            return (
              <button
                key={value}
                type="button"
                title={value}
                aria-label={value}
                aria-pressed={isSelected}
                onClick={() => onColorChange(value as PlayerColor)}
                className={`relative aspect-square rounded-lg transition-all transform active:scale-95 shadow-sm border border-black/10 overflow-hidden ${
                  isSelected
                    ? "ring-2 ring-[#0052ff] ring-offset-1 scale-105 z-10"
                    : "hover:scale-105 opacity-90 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: COLOR_HEX[value as PlayerColor] || value,
                }}
              >
                {/* 3D Glossy Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-black/25 pointer-events-none" />

                {/* Selected Checkmark Badge */}
                {isSelected && (
                  <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-md">
                    <svg
                      className="w-2.5 h-2.5 text-[#0052ff] stroke-[3]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
