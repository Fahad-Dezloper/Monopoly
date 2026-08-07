"use client";

import { useState } from "react";
import {
  Dialog,
  dialogGhost,
  dialogPrimary,
} from "@/components/game/dialogs/Dialog";
import { PlayerIdentityFields } from "@/components/entry/PlayerIdentityFields";
import type { PlayerColor } from "@/lib/monopoly/types";
import { errorBox, field, fieldLabel, input } from "@/lib/ui";

interface CreateRoomDialogProps {
  busy: boolean;
  error: string | null;
  onCreate: (input: {
    name: string;
    color: PlayerColor;
    maxPlayers: number;
  }) => void;
  onBack: () => void;
}

export function CreateRoomDialog({
  busy,
  error,
  onCreate,
  onBack,
}: CreateRoomDialogProps) {
  const [name, setName] = useState("player_1");
  const [color, setColor] = useState<PlayerColor>("blue");
  const [maxPlayers, setMaxPlayers] = useState(4);

  const submit = () => {
    if (busy || !name.trim()) return;
    onCreate({ name: name.trim(), color, maxPlayers });
  };

  return (
    <Dialog
      eyebrow="Step 1 of 2"
      title="Create a lobby"
      subtitle="You host the table — invite the others with the code you get next."
      size="md"
      onClose={onBack}
      closeLabel="Back"
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            className={dialogPrimary}
            disabled={busy || !name.trim()}
            onClick={submit}
          >
            {busy ? "Creating…" : "Create lobby"}
          </button>
          <button type="button" className={dialogGhost} onClick={onBack}>
            Back
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3.5">
        <PlayerIdentityFields
          name={name}
          color={color}
          onNameChange={setName}
          onColorChange={setColor}
        />

        <label className={field}>
          <span className={fieldLabel}>Table size</span>
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
          <span className="text-[11.5px] text-dim">
            You can start as soon as two people have joined.
          </span>
        </label>

        {error && <div className={errorBox}>{error}</div>}
      </div>
    </Dialog>
  );
}
