"use client";

import { useSearchParams } from "next/navigation";
import { EntryFlow } from "@/components/entry/EntryFlow";
import { GameScreen } from "@/components/game/GameScreen";
import {
  CHAIN_ENABLED,
  explorerAddressUrl,
  explorerTxUrl,
} from "@/lib/chain/config";
import type { LogLink } from "@/components/game/rail/LiveLog";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { useOnchainGame } from "@/hooks/useOnchainGame";
import type { PublicRoom } from "@/lib/api/types";
import type { GameAction } from "@/lib/monopoly/engine";
import type { PlayerColor } from "@/lib/monopoly/types";

interface Session {
  view: "home" | "lobby" | "playing";
  room: PublicRoom | null;
  playerId: string;
  mySeat: number | null;
  isMyTurn: boolean;
  isHost: boolean;
  error: string | null;
  busy: boolean;
  createGame: (input: {
    name: string;
    color: PlayerColor;
    maxPlayers: number;
  }) => Promise<void>;
  joinGame: (input: {
    code: string;
    name: string;
    color: PlayerColor;
  }) => Promise<void>;
  startGame: () => Promise<void>;
  leaveGame: () => Promise<void>;
  act: (action: GameAction) => Promise<void>;
  sendChat: (text: string) => Promise<void>;
  clearError: () => void;
}

export function RobinverseApp() {
  return CHAIN_ENABLED ? <OnchainApp /> : <ServerApp />;
}

function ServerApp() {
  return <SessionView session={useMultiplayer()} />;
}

function OnchainApp() {
  const session = useOnchainGame();
  return (
    <SessionView
      session={session}
      awaitingChain={session.awaitingChain}
      logLinks={session.feed}
      explorerFor={(signature) =>
        explorerTxUrl(signature, session.feedEndpoint ?? undefined)
      }
      chainUrl={
        session.gameAddress
          ? explorerAddressUrl(
              session.gameAddress,
              session.feedEndpoint ?? undefined,
            )
          : undefined
      }
    />
  );
}

function SessionView({
  session,
  awaitingChain = false,
  logLinks,
  explorerFor,
  chainUrl,
}: {
  session: Session;
  awaitingChain?: boolean;
  logLinks?: LogLink[];
  explorerFor?: (signature: string) => string;
  chainUrl?: string;
}) {
  const params = useSearchParams();
  const joinPrefill = params.get("join")?.toUpperCase() ?? null;
  const preferJoin = params.get("tab") === "join";

  if (session.view !== "playing" || !session.room?.game) {
    return (
      <EntryFlow
        room={session.view === "lobby" ? session.room : null}
        playerId={session.playerId}
        isHost={session.isHost}
        busy={session.busy}
        error={session.error}
        messages={session.room?.messages ?? []}
        initialJoinCode={joinPrefill}
        preferJoin={preferJoin}
        onCreate={session.createGame}
        onJoin={session.joinGame}
        onStart={session.startGame}
        onLeave={session.leaveGame}
        onSendChat={session.sendChat}
        onClearError={session.clearError}
      />
    );
  }

  return (
    <GameScreen
      state={session.room.game}
      roomCode={session.room.code}
      playerId={session.playerId}
      mySeat={session.mySeat}
      isMyTurn={session.isMyTurn}
      error={session.error}
      messages={session.room.messages ?? []}
      awaitingChain={awaitingChain}
      logLinks={logLinks}
      explorerFor={explorerFor}
      chainUrl={chainUrl}
      act={(action) => void session.act(action)}
      onSendChat={session.sendChat}
      onLeave={session.leaveGame}
    />
  );
}
