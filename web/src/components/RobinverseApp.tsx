"use client";

import { useSearchParams } from "next/navigation";
import { GameScreen } from "@/components/game/GameScreen";
import { HomeScreen } from "@/components/home/HomeScreen";
import { LobbyScreen } from "@/components/lobby/LobbyScreen";
import { useMultiplayer } from "@/hooks/useMultiplayer";

export function RobinverseApp() {
  const multiplayer = useMultiplayer();
  const params = useSearchParams();
  const joinPrefill = params.get("join")?.toUpperCase() ?? null;
  const preferJoin = params.get("tab") === "join";

  if (multiplayer.view === "home" || !multiplayer.room) {
    return (
      <HomeScreen
        busy={multiplayer.busy}
        error={multiplayer.error}
        initialJoinCode={joinPrefill}
        preferJoin={preferJoin}
        onCreate={multiplayer.createGame}
        onJoin={multiplayer.joinGame}
        onClearError={multiplayer.clearError}
      />
    );
  }

  if (multiplayer.view === "lobby") {
    return (
      <LobbyScreen
        room={multiplayer.room}
        playerId={multiplayer.playerId}
        isHost={multiplayer.isHost}
        busy={multiplayer.busy}
        error={multiplayer.error}
        messages={multiplayer.room.messages ?? []}
        onSendChat={multiplayer.sendChat}
        onStart={multiplayer.startGame}
        onLeave={multiplayer.leaveGame}
      />
    );
  }

  if (!multiplayer.room.game) return null;

  return (
    <GameScreen
      state={multiplayer.room.game}
      roomCode={multiplayer.room.code}
      playerId={multiplayer.playerId}
      mySeat={multiplayer.mySeat}
      isMyTurn={multiplayer.isMyTurn}
      error={multiplayer.error}
      messages={multiplayer.room.messages ?? []}
      act={(action) => void multiplayer.act(action)}
      onSendChat={multiplayer.sendChat}
      onLeave={multiplayer.leaveGame}
    />
  );
}
