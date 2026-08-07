"use client";

import { useState } from "react";
import { CreateRoomDialog } from "@/components/entry/CreateRoomDialog";
import { EntryBackdrop } from "@/components/entry/EntryBackdrop";
import { JoinRoomDialog } from "@/components/entry/JoinRoomDialog";
import { LobbyDialog } from "@/components/entry/LobbyDialog";
import { WelcomeDialog } from "@/components/entry/WelcomeDialog";
import type { ChatMessage, PublicRoom } from "@/lib/api/types";
import type { PlayerColor } from "@/lib/monopoly/types";

type EntryStep = "welcome" | "create" | "join";

interface EntryFlowProps {
  room: PublicRoom | null;
  playerId: string;
  isHost: boolean;
  busy: boolean;
  error: string | null;
  messages: ChatMessage[];
  initialJoinCode?: string | null;
  preferJoin?: boolean;
  onCreate: (input: {
    name: string;
    color: PlayerColor;
    maxPlayers: number;
  }) => void;
  onJoin: (input: { code: string; name: string; color: PlayerColor }) => void;
  onStart: () => void;
  onLeave: () => void;
  onSendChat: (text: string) => void;
  onClearError: () => void;
}

export function EntryFlow({
  room,
  playerId,
  isHost,
  busy,
  error,
  messages,
  initialJoinCode,
  preferJoin,
  onCreate,
  onJoin,
  onStart,
  onLeave,
  onSendChat,
  onClearError,
}: EntryFlowProps) {
  const [step, setStep] = useState<EntryStep>(
    preferJoin || initialJoinCode ? "join" : "welcome",
  );

  const go = (next: EntryStep) => {
    onClearError();
    setStep(next);
  };

  return (
    <div className="font-sans text-body">
      <EntryBackdrop />

      {room ? (
        <LobbyDialog
          room={room}
          playerId={playerId}
          isHost={isHost}
          busy={busy}
          error={error}
          messages={messages}
          onSendChat={onSendChat}
          onStart={onStart}
          onLeave={onLeave}
        />
      ) : step === "create" ? (
        <CreateRoomDialog
          busy={busy}
          error={error}
          onCreate={onCreate}
          onBack={() => go("welcome")}
        />
      ) : step === "join" ? (
        <JoinRoomDialog
          busy={busy}
          error={error}
          initialCode={initialJoinCode}
          onJoin={onJoin}
          onBack={() => go("welcome")}
        />
      ) : (
        <WelcomeDialog
          onCreate={() => go("create")}
          onJoin={() => go("join")}
        />
      )}
    </div>
  );
}
