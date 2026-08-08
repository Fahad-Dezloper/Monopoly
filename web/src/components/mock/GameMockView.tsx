"use client";

import { useEffect, useRef, useState } from "react";
import { GameBoard } from "@/components/game/board/GameBoard";
import { AuctionDialog } from "@/components/game/dialogs/AuctionDialog";
import { CardDialog } from "@/components/game/dialogs/CardDialog";
import { RulesDialog } from "@/components/game/dialogs/RulesDialog";
import { StatsDialog } from "@/components/game/dialogs/StatsDialog";
import { TradeDialog } from "@/components/game/dialogs/TradeDialog";
import { GameTopBar } from "@/components/game/GameTopBar";
import { PropertyPanel } from "@/components/game/property/PropertyPanel";
import { LeftRail } from "@/components/game/rail/LeftRail";
import { RightRail } from "@/components/game/rail/RightRail";
import type { MockFlag } from "@/components/mock/mockRegistry";
import {
  createAuctionGameState,
  createCardGameState,
  createEmptyGameState,
  createGameOverState,
  createMockGameState,
  createTradeGameState,
  MOCK_SEAT,
} from "@/lib/mock/gameState";
import { BoardCalibrator } from "@/components/mock/BoardCalibrator";
import { PANEL_SCENARIOS } from "@/lib/mock/panelScenarios";
import {
  loadBoardSpec,
  saveBoardSpec,
  shiftBoardSpec,
  type BoardSpec,
} from "@/lib/monopoly/boardGeometry";
import { MOCK_MESSAGES, MOCK_PLAYER_ID, MOCK_ROOM_CODE } from "@/lib/mock/room";
import type { GameAction } from "@/lib/monopoly/engine";

interface GameMockViewProps {
  flags: Record<string, MockFlag>;
  onAction: (action: GameAction) => void;
}

export function GameMockView({ flags, onAction }: GameMockViewProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [focusSeat, setFocusSeat] = useState<number | null>(null);
  const [scenarioKey] = useState(PANEL_SCENARIOS[0].key);
  const [spec, setSpec] = useState<BoardSpec>(loadBoardSpec);
  const [calibrating, setCalibrating] = useState(false);
  const dragRef = useRef<{ x: number; y: number; spec: BoardSpec } | null>(
    null,
  );
  const scenario =
    PANEL_SCENARIOS.find((entry) => entry.key === scenarioKey) ??
    PANEL_SCENARIOS[0];
  const scenarioState = scenario.state();

  const filled = createMockGameState();
  const empty = createEmptyGameState();

  const on = (key: string) => flags[key]?.visible ?? false;
  const mocked = (key: string) => flags[key]?.mock ?? false;
  const stateFor = (key: string) => (mocked(key) ? filled : empty);

  const boardState = stateFor("board");
  const railState = stateFor("rail");
  const actionState = mocked("board") ? filled : empty;
  const isMyTurn = mocked("board") && actionState.turn === MOCK_SEAT;

  useEffect(() => {
    if (!calibrating) return;
    const move = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const board = document.querySelector('[role="grid"]');
      const size = board?.getBoundingClientRect().width ?? 600;
      setSpec(
        shiftBoardSpec(
          drag.spec,
          ((event.clientX - drag.x) / size) * 100,
          ((event.clientY - drag.y) / size) * 100,
        ),
      );
    };
    const up = () => {
      if (dragRef.current) saveBoardSpec(spec);
      dragRef.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [calibrating, spec]);

  const showDeed = selectedIndex != null && on("panel");

  return (
    <div className="grid h-screen grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden bg-[#f5f3ff] p-2.5 font-sans text-slate-800">
      {on("topbar") && (
        <GameTopBar
          roomCode={mocked("topbar") ? MOCK_ROOM_CODE : "------"}
          remaining={mocked("topbar") ? 114_000 : 0}
          turn={mocked("topbar") ? 1 : 0}
          showClock={mocked("topbar")}
          soundOff={false}
          onRules={() => onAction({ type: "TOGGLE_STATS" })}
          onToggleSound={() => onAction({ type: "TOGGLE_STATS" })}
          onLeave={() => onAction({ type: "RESIGN" })}
        />
      )}

      <main className="grid min-h-0 grid-cols-[220px_minmax(0,1fr)_260px] gap-2 overflow-hidden max-[1080px]:grid-cols-[minmax(0,1fr)]">
        <div className="min-h-0 max-[1080px]:order-2">
          {on("rail") && (
            <LeftRail
              state={railState}
              mySeat={mocked("rail") ? MOCK_SEAT : null}
              playerId={MOCK_PLAYER_ID}
              messages={mocked("rail") ? MOCK_MESSAGES : []}
              onSendChat={() => onAction({ type: "TOGGLE_STATS" })}
            />
          )}
        </div>

        <section className="flex min-h-0 flex-col gap-1.5 max-[1080px]:order-1">
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setCalibrating((value) => !value)}
              className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${
                calibrating
                  ? "border-transparent bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white"
                  : "border-[#e9e2ff] bg-white text-slate-500 hover:bg-[#f8f6ff]"
              }`}
            >
              {calibrating ? "Calibrating board" : "Calibrate board"}
            </button>
          </div>

          <div
            className="min-h-0 flex-1"
            onPointerDown={(event) => {
              if (!calibrating) return;
              dragRef.current = { x: event.clientX, y: event.clientY, spec };
            }}
          >
            {on("board") && (
              <GameBoard
                spec={spec}
                showGrid={calibrating}
                state={boardState}
                selectedIndex={mocked("board") ? selectedIndex : null}
                diceRolling={false}
                displayPositions={{}}
                hopping={{}}
                focusOwner={focusSeat}
                isMyTurn={isMyTurn}
                canBuy={false}
                act={onAction}
                onRollStart={() => undefined}
                onSelectSquare={(index) => {
                  setSelectedIndex(index);
                  if (index != null)
                    onAction({ type: "SELECT_PROPERTY", index });
                }}
              />
            )}
          </div>
          {calibrating && <BoardCalibrator spec={spec} onChange={setSpec} />}
        </section>

        <div className="min-h-0 max-[1080px]:order-3">
          {showDeed ? (
            <PropertyPanel
              state={mocked("panel") ? scenarioState : empty}
              mySeat={mocked("panel") ? MOCK_SEAT : null}
              isMyTurn={mocked("panel") ? scenario.isMyTurn : false}
              selectedIndex={selectedIndex}
              act={onAction}
              onOpenTrade={(recipient = 1) =>
                onAction({ type: "OPEN_TRADE", recipient })
              }
              onClose={() => setSelectedIndex(null)}
            />
          ) : (
            on("panel") && (
              <RightRail
                state={mocked("panel") ? filled : empty}
                mySeat={mocked("panel") ? MOCK_SEAT : null}
                focusSeat={focusSeat}
                onFocusSeat={setFocusSeat}
                onSelectSquare={(index) => {
                  setSelectedIndex(index);
                  onAction({ type: "SELECT_PROPERTY", index });
                }}
                act={onAction}
              />
            )
          )}
        </div>
      </main>

      {on("auction") && (
        <AuctionDialog
          state={createAuctionGameState()}
          act={onAction}
          onShowDeed={setSelectedIndex}
        />
      )}

      {on("card") && (
        <CardDialog
          state={createCardGameState()}
          mySeat={MOCK_SEAT}
          act={onAction}
        />
      )}

      {on("trade") && (
        <TradeDialog
          state={createTradeGameState()}
          mySeat={MOCK_SEAT}
          act={onAction}
          onClose={() => onAction({ type: "CANCEL_TRADE" })}
        />
      )}

      {on("stats") && (
        <StatsDialog
          state={{ ...createMockGameState(), showStats: true }}
          act={onAction}
          onShowDeed={setSelectedIndex}
        />
      )}

      {on("rules") && (
        <RulesDialog open onClose={() => onAction({ type: "TOGGLE_STATS" })} />
      )}

      {on("gameover") &&
        (() => {
          const over = createGameOverState();
          const winner = over.players[over.winner ?? 1];
          return (
            <div className="fixed bottom-5.5 left-1/2 z-70 -translate-x-1/2 rounded-full bg-accent px-5.5 py-3 text-[14px] font-bold text-white shadow-panel">
              🏆 {winner?.name} wins — last player standing
            </div>
          );
        })()}
    </div>
  );
}
