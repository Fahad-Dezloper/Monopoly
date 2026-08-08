"use client";

import { useEffect, useRef, useState } from "react";
import { GameBoard } from "@/components/game/board/GameBoard";
import type { LogLink } from "@/components/game/rail/LiveLog";
import { GameTopBar } from "@/components/game/GameTopBar";
import { AuctionDialog } from "@/components/game/dialogs/AuctionDialog";
import { CardDialog } from "@/components/game/dialogs/CardDialog";
import { RulesDialog } from "@/components/game/dialogs/RulesDialog";
import { StatsDialog } from "@/components/game/dialogs/StatsDialog";
import { TradeDialog } from "@/components/game/dialogs/TradeDialog";
import { PropertyPanel } from "@/components/game/property/PropertyPanel";
import { LeftRail } from "@/components/game/rail/LeftRail";
import { RightRail } from "@/components/game/rail/RightRail";
import { useDiceRoll } from "@/hooks/useDiceRoll";
import { useGameFx } from "@/hooks/useGameFx";
import { useTurnClock } from "@/hooks/useTurnClock";
import type { ChatMessage } from "@/lib/api/types";
import type { GameAction } from "@/lib/monopoly/engine";
import { isMuted, setMuted, unlockAudio } from "@/lib/monopoly/sounds";
import { loadBoardSpec } from "@/lib/monopoly/boardGeometry";
import { resolvePanelView } from "@/lib/monopoly/panelView";
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
  /** On-chain feed lines; each links to the transaction that produced it. */
  logLinks?: LogLink[];
  explorerFor?: (signature: string) => string;
  /** Explorer link for the game account itself. */
  chainUrl?: string;
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
  logLinks,
  explorerFor,
  chainUrl,
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
  // Which landing the player has passed on. Keyed by the landing itself so it
  // clears the moment the dice move them somewhere new.
  const [declinedAt, setDeclinedAt] = useState<string | null>(null);
  const [soundOff, setSoundOff] = useState(isMuted);
  const [boardSpec] = useState(loadBoardSpec);
  const lastDiceKey = useRef("");
  const localRollPending = useRef(false);

  const { displayPositions, hopping, tokenMoving } = useGameFx(state);
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
  const landingKey = `${state.turn}-${current?.position ?? -1}-${state.die1}-${state.die2}`;
  const declined =
    declinedAt === landingKey ||
    (typeof state.landedMessage === "string" &&
      state.landedMessage.toLowerCase().includes("declined"));

  // The server engine reports a decline through `landedMessage`; the on-chain
  // engine has no such field, so the click is remembered here as well.
  const handleAct = (action: GameAction) => {
    if (action.type === "DECLINE_BUY") setDeclinedAt(landingKey);
    act(action);
  };
  const canBuy =
    isMyTurn &&
    !!current &&
    state.diceRolled &&
    !declined &&
    landedSquare?.price > 0 &&
    landedSquare?.owner === 0 &&
    current.money >= landedSquare.price &&
    !tokenMoving;

  const canTrade =
    isMyTurn && state.phase !== "auction" && state.phase !== "game_over";

  const seatedState: GameState = {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      human: player.index === mySeat,
    })),
  };

  const openTrade = (recipient?: number) => {
    // Guard against `onClick={openTrade}`, which hands us a MouseEvent: the
    // prop is typed `() => void`, so TypeScript cannot catch that at the call
    // site, and a non-seat recipient crashes the trade dialog.
    if (typeof recipient !== "number" || !Number.isInteger(recipient)) {
      recipient = undefined;
    }
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

  // Don't flash event modals / land panels until the token finishes hopping.
  const modalReady = !tokenMoving && !diceRolling;

  const panelView = resolvePanelView({
    state,
    mySeat,
    isMyTurn: isMyTurn && modalReady,
    selectedIndex: modalReady ? selectedIndex : null,
    declined,
  });

  // Prefer game-state views (buy/rent/card/auction/special) over idle rail.
  // Also show deed when a tile is selected (after move settles).
  const showPanel =
    panelView.kind !== "idle" ||
    (selectedIndex != null && modalReady) ||
    state.phase === "auction" ||
    !!state.trade ||
    state.phase === "game_over";

  return (
    <div className="grid h-dvh grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden bg-[#f5f3ff] p-2.5 font-sans text-slate-800">
      <GameTopBar
        roomCode={roomCode}
        chainUrl={chainUrl}
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
        <div className="min-h-0 max-[1080px]:order-2 max-[1080px]:max-h-[40vh]">
          <LeftRail
            state={state}
            mySeat={mySeat}
            playerId={playerId}
            messages={messages}
            onSendChat={onSendChat}
          />
        </div>

        <section className="flex min-h-0 flex-col gap-1.5 max-[1080px]:order-1">
          {error && <div className={errorBox}>{error}</div>}

          <div className="min-h-0 flex-1">
            <GameBoard
              logLinks={logLinks}
              explorerFor={explorerFor}
              state={state}
              spec={boardSpec}
              selectedIndex={selectedIndex}
              diceRolling={diceRolling}
              displayPositions={displayPositions}
              hopping={hopping}
              focusOwner={focusSeat}
              isMyTurn={isMyTurn}
              canBuy={!!canBuy}
              canTrade={canTrade}
              act={handleAct}
              onOpenTrade={openTrade}
              onRollStart={() => {
                localRollPending.current = true;
                startRoll();
              }}
              onSelectSquare={(index) => {
                setSelectedIndex(index);
                if (index != null && isMyTurn) {
                  handleAct({ type: "SELECT_PROPERTY", index });
                }
              }}
            />
          </div>
        </section>

        <div className="min-h-0 max-[1080px]:order-3 max-[1080px]:max-h-[45vh]">
          {showPanel ? (
            <PropertyPanel
              state={state}
              mySeat={mySeat}
              isMyTurn={isMyTurn}
              selectedIndex={selectedIndex}
              act={handleAct}
              onOpenTrade={openTrade}
              onClose={() => setSelectedIndex(null)}
            />
          ) : (
            <RightRail
              state={state}
              mySeat={mySeat}
              focusSeat={focusSeat}
              onFocusSeat={setFocusSeat}
              onSelectSquare={(index) => {
                setSelectedIndex(index);
                if (isMyTurn) handleAct({ type: "SELECT_PROPERTY", index });
              }}
              act={handleAct}
            />
          )}
        </div>
      </main>

      {state.phase === "auction" ? (
        <AuctionDialog
          state={seatedState}
          act={handleAct}
          onShowDeed={setSelectedIndex}
        />
      ) : (
        <CardDialog
          state={seatedState}
          mySeat={mySeat}
          act={handleAct}
          ready={modalReady}
        />
      )}

      <StatsDialog
        state={state}
        act={handleAct}
        onShowDeed={setSelectedIndex}
      />

      {showTrade && (
        <TradeDialog
          state={state}
          mySeat={mySeat}
          act={handleAct}
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
