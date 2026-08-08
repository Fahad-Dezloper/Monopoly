"use client";

import { useEffect, useRef, useState } from "react";
import { ActionBar } from "@/components/game/ActionBar";
import { GameBoard } from "@/components/game/board/GameBoard";
import { GameTopBar } from "@/components/game/GameTopBar";
import { AuctionDialog } from "@/components/game/dialogs/AuctionDialog";
import { CardDialog } from "@/components/game/dialogs/CardDialog";
import { RulesDialog } from "@/components/game/dialogs/RulesDialog";
import { StatsDialog } from "@/components/game/dialogs/StatsDialog";
import { TradeDialog } from "@/components/game/dialogs/TradeDialog";
import { PropertyPanel } from "@/components/game/property/PropertyPanel";
import { LeftRail } from "@/components/game/rail/LeftRail";
import { LiveLog } from "@/components/game/rail/LiveLog";
import { RightRail } from "@/components/game/rail/RightRail";
import { useDiceRoll } from "@/hooks/useDiceRoll";
import { useGameFx } from "@/hooks/useGameFx";
import { useTurnClock } from "@/hooks/useTurnClock";
import type { ChatMessage } from "@/lib/api/types";
import type { GameAction } from "@/lib/monopoly/engine";
import { isMuted, setMuted, unlockAudio } from "@/lib/monopoly/sounds";
import { loadBoardSpec } from "@/lib/monopoly/boardGeometry";
import { turnNumber } from "@/lib/monopoly/stats";
import type { GameState } from "@/lib/monopoly/types";
import { errorBox } from "@/lib/ui";

interface GameScreenProps {
  state: GameState;
  roomCode: string;
  playerId: string;
  mySeat: number | null;
  isMyTurn: boolean;
  error: string | null;
  messages: ChatMessage[];
  awaitingChain?: boolean;
  act: (action: GameAction) => void;
  onSendChat: (text: string) => void;
  onLeave: () => void;
}

export function GameScreen({
  state,
  roomCode,
  playerId,
  mySeat,
  isMyTurn,
  error,
  messages,
  awaitingChain = false,
  act,
  onSendChat,
  onLeave,
}: GameScreenProps) {
  const { rolling: localRolling, startRoll } = useDiceRoll();
  const diceRolling = localRolling || awaitingChain;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [focusSeat, setFocusSeat] = useState<number | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [tradeDismissed, setTradeDismissed] = useState(false);
  const [soundOff, setSoundOff] = useState(isMuted);
  const [boardSpec] = useState(loadBoardSpec);
  const lastDiceKey = useRef("");
  const localRollPending = useRef(false);

  const { displayPositions, hopping } = useGameFx(state);
  const remaining = useTurnClock(state.turnDeadlineAt);

  useEffect(() => {
    if (!state.diceRolled) return;
    const position = state.players[state.turn]?.position ?? -1;
    const key = `${state.turn}-${state.die1}-${state.die2}-${position}`;
    if (key === lastDiceKey.current) return;
    lastDiceKey.current = key;
    if (localRollPending.current) {
      localRollPending.current = false;
      return;
    }
    startRoll();
  }, [
    state.die1,
    state.die2,
    state.diceRolled,
    state.turn,
    state.players,
    startRoll,
  ]);

  const showTrade = !!state.trade && !tradeDismissed;
  const current = state.players[state.turn];
  const landedSquare = state.squares[current?.position ?? 0];
  const canBuy =
    isMyTurn &&
    !!current &&
    state.diceRolled &&
    landedSquare?.price > 0 &&
    landedSquare?.owner === 0 &&
    current.money >= landedSquare.price;

  const seatedState: GameState = {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      human: player.index === mySeat,
    })),
  };

  const openTrade = (recipient?: number) => {
    if (recipient != null) {
      act({ type: "OPEN_TRADE", recipient });
      setTradeDismissed(false);
      return;
    }
    const other = state.players.find(
      (player) =>
        player.index > 0 &&
        player.index !== mySeat &&
        player.position >= 0 &&
        Number.isFinite(player.money),
    );
    if (!other) return;
    act({ type: "OPEN_TRADE", recipient: other.index });
    setTradeDismissed(false);
  };

  const toggleSound = () => {
    unlockAudio();
    const next = !soundOff;
    setMuted(next);
    setSoundOff(next);
  };

  // When a tile is selected, still show property panel overlay on right via selectedIndex
  // Right rail always visible; property detail can replace board state when selected
  const showDeed = selectedIndex != null;

  return (
    <div className="grid h-dvh grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden bg-[#f5f3ff] p-2.5 font-sans text-slate-800">
      <GameTopBar
        roomCode={roomCode}
        remaining={remaining}
        turn={turnNumber(state)}
        showClock={
          state.phase !== "game_over" && (state.turnDeadlineAt ?? 0) > 0
        }
        soundOff={soundOff}
        onRules={() => setShowRules(true)}
        onToggleSound={toggleSound}
        onLeave={onLeave}
      />

      <main className="grid min-h-0 grid-cols-[220px_minmax(0,1fr)_260px] gap-2 max-[1080px]:grid-cols-[minmax(0,1fr)]">
        {/* LEFT: money + chat */}
        <div className="min-h-0 max-[1080px]:order-2 max-[1080px]:max-h-[40vh]">
          <LeftRail
            state={state}
            mySeat={mySeat}
            playerId={playerId}
            messages={messages}
            onSendChat={onSendChat}
          />
        </div>

        {/* CENTER: board + actions + live log */}
        <section className="flex min-h-0 flex-col gap-1.5 max-[1080px]:order-1">
          {error && <div className={errorBox}>{error}</div>}

          <div className="min-h-0 flex-1">
            <GameBoard
              state={state}
              spec={boardSpec}
              selectedIndex={selectedIndex}
              diceRolling={diceRolling}
              displayPositions={displayPositions}
              hopping={hopping}
              focusOwner={focusSeat}
              onSelectSquare={(index) => {
                setSelectedIndex(index);
                if (index != null && isMyTurn) {
                  act({ type: "SELECT_PROPERTY", index });
                }
              }}
            />
          </div>

          <ActionBar
            state={state}
            isMyTurn={isMyTurn}
            canBuy={!!canBuy}
            diceRolling={diceRolling}
            act={act}
            onRollStart={() => {
              localRollPending.current = true;
              startRoll();
            }}
          />

          <LiveLog alerts={state.alerts} players={state.players} />
        </section>

        {/* RIGHT: board state / players / my stuff — or deed when selected */}
        <div className="min-h-0 max-[1080px]:order-3 max-[1080px]:max-h-[45vh]">
          {showDeed ? (
            <div className="flex h-full min-h-0 flex-col gap-2">
              <PropertyPanel
                state={state}
                mySeat={mySeat}
                isMyTurn={isMyTurn}
                selectedIndex={selectedIndex}
                act={act}
                onOpenTrade={openTrade}
                onClose={() => setSelectedIndex(null)}
              />
            </div>
          ) : (
            <RightRail
              state={state}
              mySeat={mySeat}
              focusSeat={focusSeat}
              onFocusSeat={setFocusSeat}
              onSelectSquare={(index) => {
                setSelectedIndex(index);
                if (isMyTurn) act({ type: "SELECT_PROPERTY", index });
              }}
              act={act}
            />
          )}
        </div>
      </main>

      {state.phase === "auction" ? (
        <AuctionDialog
          state={seatedState}
          act={act}
          onShowDeed={setSelectedIndex}
        />
      ) : (
        <CardDialog state={seatedState} act={act} />
      )}

      <StatsDialog state={state} act={act} onShowDeed={setSelectedIndex} />

      {showTrade && (
        <TradeDialog
          state={state}
          mySeat={mySeat}
          act={act}
          onClose={() => setTradeDismissed(true)}
        />
      )}

      <RulesDialog open={showRules} onClose={() => setShowRules(false)} />

      {state.phase === "game_over" && state.winner && (
        <div className="fixed bottom-5.5 left-1/2 z-70 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-5.5 py-3 text-[14px] font-bold text-white shadow-xl">
          🏆 {state.players[state.winner].name} wins — last player standing
        </div>
      )}
    </div>
  );
}
