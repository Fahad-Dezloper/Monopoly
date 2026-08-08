"use client";

import { GameScreen } from "@/components/game/GameScreen";
import { createMockGameState, MOCK_SEAT } from "@/lib/mock/gameState";
import { MOCK_MESSAGES, MOCK_PLAYER_ID, MOCK_ROOM_CODE } from "@/lib/mock/room";

const BACKDROP_STATE = { ...createMockGameState(), turnDeadlineAt: 0 };

const noop = () => undefined;

export function EntryBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden bg-[#f5f3ff] select-none"
      aria-hidden
    >
      <div className="size-full scale-[1.02] blur-[8px] brightness-[1.05] saturate-[1.05]">
        <GameScreen
          state={BACKDROP_STATE}
          roomCode={MOCK_ROOM_CODE}
          playerId={MOCK_PLAYER_ID}
          mySeat={MOCK_SEAT}
          isMyTurn={false}
          error={null}
          messages={MOCK_MESSAGES}
          act={noop}
          onSendChat={noop}
          onLeave={noop}
        />
      </div>
      <div className="absolute inset-0 bg-[#f5f3ff]/55" />
    </div>
  );
}
