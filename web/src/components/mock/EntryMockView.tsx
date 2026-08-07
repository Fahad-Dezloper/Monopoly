"use client";

import { CreateRoomDialog } from "@/components/entry/CreateRoomDialog";
import { EntryBackdrop } from "@/components/entry/EntryBackdrop";
import { JoinRoomDialog } from "@/components/entry/JoinRoomDialog";
import { LobbyDialog } from "@/components/entry/LobbyDialog";
import { WelcomeDialog } from "@/components/entry/WelcomeDialog";
import type { MockFlag } from "@/components/mock/mockRegistry";
import {
  createEmptyRoom,
  createMockRoom,
  MOCK_MESSAGES,
  MOCK_PLAYER_ID,
} from "@/lib/mock/room";

interface EntryMockViewProps {
  flags: Record<string, MockFlag>;
  onAction: (label: string) => void;
}

export function EntryMockView({ flags, onAction }: EntryMockViewProps) {
  const on = (key: string) => flags[key]?.visible ?? false;
  const mocked = (key: string) => flags[key]?.mock ?? false;

  return (
    <div className="min-h-dvh font-sans text-body">
      {on("backdrop") && <EntryBackdrop />}

      {on("welcome") && (
        <WelcomeDialog
          onCreate={() => onAction("welcome: create a lobby")}
          onJoin={() => onAction("welcome: join with a code")}
        />
      )}

      {on("create") && (
        <CreateRoomDialog
          busy={false}
          error={
            mocked("create") ? null : "room limit reached — try again later"
          }
          onCreate={(payload) =>
            onAction(`createGame(${JSON.stringify(payload)})`)
          }
          onBack={() => onAction("create: back")}
        />
      )}

      {on("join") && (
        <JoinRoomDialog
          busy={false}
          error={mocked("join") ? null : "no room with that code"}
          initialCode={mocked("join") ? "R7XK42" : null}
          onJoin={(payload) => onAction(`joinGame(${JSON.stringify(payload)})`)}
          onBack={() => onAction("join: back")}
        />
      )}

      {on("lobby") && (
        <LobbyDialog
          room={mocked("lobby") ? createMockRoom() : createEmptyRoom()}
          playerId={MOCK_PLAYER_ID}
          isHost={mocked("lobby")}
          busy={false}
          error={null}
          messages={mocked("lobby") ? MOCK_MESSAGES : []}
          onSendChat={(text) => onAction(`sendChat("${text}")`)}
          onStart={() => onAction("startGame()")}
          onLeave={() => onAction("leaveGame()")}
        />
      )}
    </div>
  );
}
