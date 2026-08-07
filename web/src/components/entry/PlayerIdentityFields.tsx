"use client";

import { PLAYER_COLORS } from "@/lib/monopoly/board";
import type { PlayerColor } from "@/lib/monopoly/types";
import { cx, field, fieldLabel, input } from "@/lib/ui";

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
    <>
      <label className={field}>
        <span className={fieldLabel}>Display name</span>
        <input
          className={input}
          value={name}
          maxLength={16}
          autoFocus
          placeholder="player_1"
          onChange={(event) => onNameChange(event.target.value)}
        />
      </label>

      <div className={field}>
        <span className={fieldLabel}>Token colour</span>
        <div className="grid grid-cols-8 gap-1.5">
          {PLAYER_COLORS.map((value) => (
            <button
              key={value}
              type="button"
              title={value}
              aria-label={value}
              aria-pressed={color === value}
              onClick={() => onColorChange(value as PlayerColor)}
              className={cx(
                "aspect-square rounded-sm border-2 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35)] transition-transform",
                color === value
                  ? "scale-110 border-white"
                  : "border-transparent hover:scale-105",
              )}
              style={{ background: value }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
