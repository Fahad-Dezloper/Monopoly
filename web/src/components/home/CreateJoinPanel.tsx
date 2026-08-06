"use client";

import { forwardRef, useState } from "react";
import { DEFAULT_COLORS, PLAYER_COLORS } from "@/lib/monopoly/board";
import type { PlayerColor } from "@/lib/monopoly/types";
import { buyButton, cx, errorBox, field, fieldLabel, input, panel } from "@/lib/ui";

export type PanelTab = "create" | "join";

interface CreateJoinPanelProps {
  tab: PanelTab;
  busy: boolean;
  error: string | null;
  initialJoinCode?: string | null;
  onTabChange: (tab: PanelTab) => void;
  onCreate: (input: {
    name: string;
    color: PlayerColor;
    maxPlayers: number;
  }) => void;
  onJoin: (input: { code: string; name: string; color: PlayerColor }) => void;
  onClearError: () => void;
}

export const CreateJoinPanel = forwardRef<
  HTMLInputElement,
  CreateJoinPanelProps
>(function CreateJoinPanel(
  {
    tab,
    busy,
    error,
    initialJoinCode,
    onTabChange,
    onCreate,
    onJoin,
    onClearError,
  },
  nameRef,
) {
  const [name, setName] = useState("player_1");
  const [color, setColor] = useState<PlayerColor>("blue");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [code, setCode] = useState(initialJoinCode ?? "");

  return (
    <div className={cx(panel, "gap-3 p-4")}>
      <div className="flex gap-1 rounded-[11px] border border-line bg-shell-2 p-1">
        {(["create", "join"] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={cx(
              "flex-1 rounded-chip border-none p-2.25 text-[13px] font-semibold",
              tab === value ? "bg-accent text-white" : "bg-transparent text-dim",
            )}
            onClick={() => {
              onTabChange(value);
              onClearError();
            }}
          >
            {value === "create" ? "Create game" : "Join game"}
          </button>
        ))}
      </div>

      <label className={field}>
        <span className={fieldLabel}>Display name</span>
        <input
          ref={nameRef}
          className={input}
          value={name}
          maxLength={16}
          onChange={(event) => setName(event.target.value)}
          placeholder="player_1"
        />
      </label>

      <div className={field}>
        <span className={fieldLabel}>Token colour</span>
        <div className="grid grid-cols-8 gap-1.5">
          {PLAYER_COLORS.map((value) => (
            <button
              key={value}
              type="button"
              className={cx(
                "aspect-square rounded-chip border-2 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35)]",
                color === value
                  ? "scale-106 border-white"
                  : "border-transparent",
              )}
              style={{ background: value }}
              title={value}
              aria-label={value}
              onClick={() => setColor(value as PlayerColor)}
            />
          ))}
        </div>
      </div>

      {tab === "create" ? (
        <>
          <label className={field}>
            <span className={fieldLabel}>Max players</span>
            <select
              className={input}
              value={maxPlayers}
              onChange={(event) => setMaxPlayers(Number(event.target.value))}
            >
              {[2, 3, 4, 5, 6, 7, 8].map((count) => (
                <option key={count} value={count}>
                  {count} players
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={cx(buyButton, "bg-hot hover:not-disabled:bg-[#c41222]")}
            disabled={busy || !name.trim()}
            onClick={() => onCreate({ name: name.trim(), color, maxPlayers })}
          >
            {busy ? "Creating…" : "Create room"}
          </button>
        </>
      ) : (
        <>
          <label className={field}>
            <span className={fieldLabel}>Room code</span>
            <input
              className={cx(
                input,
                "text-center text-[20px] font-bold tracking-[0.28em]",
              )}
              value={code}
              maxLength={6}
              placeholder="ABC123"
              onChange={(event) => setCode(event.target.value.toUpperCase())}
            />
          </label>
          <button
            type="button"
            className={cx(buyButton, "bg-hot hover:not-disabled:bg-[#c41222]")}
            disabled={busy || !name.trim() || code.trim().length < 4}
            onClick={() =>
              onJoin({
                code: code.trim(),
                name: name.trim(),
                color: color || (DEFAULT_COLORS[0] as PlayerColor),
              })
            }
          >
            {busy ? "Joining…" : "Join room"}
          </button>
        </>
      )}

      {error && <div className={errorBox}>{error}</div>}
    </div>
  );
});
