"use client";

import { useState } from "react";
import {
  Dialog,
  dialogGhost,
  dialogPrimary,
} from "@/components/game/dialogs/Dialog";
import { PlayerIdentityFields } from "@/components/entry/PlayerIdentityFields";
import type { PlayerColor } from "@/lib/monopoly/types";
import { cx, errorBox, field, fieldLabel, input } from "@/lib/ui";

interface JoinRoomDialogProps {
  busy: boolean;
  error: string | null;
  initialCode?: string | null;
  onJoin: (input: { code: string; name: string; color: PlayerColor }) => void;
  onBack: () => void;
}

export function JoinRoomDialog({
  busy,
  error,
  initialCode,
  onJoin,
  onBack,
}: JoinRoomDialogProps) {
  const [name, setName] = useState("player_1");
  const [color, setColor] = useState<PlayerColor>("blue");
  const [code, setCode] = useState(initialCode ?? "");

  const ready = !busy && !!name.trim() && code.trim().length >= 4;
  const submit = () => {
    if (!ready) return;
    onJoin({ code: code.trim(), name: name.trim(), color });
  };

  return (
    <Dialog
      eyebrow="Step 1 of 2"
      title="Join a lobby"
      subtitle="Ask the host for the six-character room code."
      size="md"
      onClose={onBack}
      closeLabel="Back"
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            className={dialogPrimary}
            disabled={!ready}
            onClick={submit}
          >
            {busy ? "Joining…" : "Join lobby"}
          </button>
          <button type="button" className={dialogGhost} onClick={onBack}>
            Back
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3.5">
        <label className={field}>
          <span className={fieldLabel}>Room code</span>
          <input
            className={cx(
              input,
              "h-12 text-center text-[22px] font-extrabold tracking-[0.3em] uppercase",
            )}
            value={code}
            maxLength={6}
            placeholder="ABC123"
            onKeyDown={(event) => event.key === "Enter" && submit()}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
          />
        </label>

        <PlayerIdentityFields
          name={name}
          color={color}
          onNameChange={setName}
          onColorChange={setColor}
        />

        {error && <div className={errorBox}>{error}</div>}
      </div>
    </Dialog>
  );
}
