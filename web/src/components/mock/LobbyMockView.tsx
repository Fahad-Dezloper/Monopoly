"use client";

import { LobbyScreen } from "@/components/lobby/LobbyScreen";
import type { MockFlag } from "@/components/mock/mockRegistry";
import {
  createEmptyRoom,
  createMockRoom,
  MOCK_MESSAGES,
  MOCK_PLAYER_ID,
} from "@/lib/mock/room";

interface LobbyMockViewProps {
  flags: Record<string, MockFlag>;
  onAction: (label: string) => void;
}

export function LobbyMockView({ flags, onAction }: LobbyMockViewProps) {
  const flag = flags.lobby;
  if (!flag?.visible) return <div className="grid min-h-dvh place-items-center text-[13px] text-dim">LobbyScreen hidden</div>;

  const mocked = flag.mock;

  return (
    <LobbyScreen
      room={mocked ? createMockRoom() : createEmptyRoom()}
      playerId={MOCK_PLAYER_ID}
      isHost={mocked}
      busy={false}
      error={null}
      messages={mocked ? MOCK_MESSAGES : []}
      onSendChat={(text) => onAction(`sendChat("${text}")`)}
      onStart={() => onAction("startGame()")}
      onLeave={() => onAction("leaveGame()")}
    />
  );
}
