"use client";

import { useEffect, useRef, useState } from "react";
import { ActionBar } from "@/components/game/ActionBar";
import { GameBoard } from "@/components/game/board/GameBoard";
import { AuctionDialog } from "@/components/game/dialogs/AuctionDialog";
import { CardDialog } from "@/components/game/dialogs/CardDialog";
import { RulesDialog } from "@/components/game/dialogs/RulesDialog";
import { StatsDialog } from "@/components/game/dialogs/StatsDialog";
import { TradeDialog } from "@/components/game/dialogs/TradeDialog";
import { GameDock } from "@/components/game/dock/GameDock";
import { GameTopBar } from "@/components/game/GameTopBar";
import { PropertyPanel } from "@/components/game/property/PropertyPanel";
import { TurnBanner } from "@/components/game/TurnBanner";
import type { MockFlag } from "@/components/mock/mockRegistry";
import type { MoneyFlash } from "@/hooks/useGameFx";
import {
  createAuctionGameState,
  createCardGameState,
  createEmptyGameState,
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
import { PlayerStandings } from "../game/rail/PlayerStandings";
import { RailChatPanel } from "../game/rail/RailChatPanel";

const MOCK_FLASHES: Record<number, MoneyFlash> = {
  1: { delta: 220, id: 1 },
  2: { delta: -220, id: 2 },
};

interface GameMockViewProps {
  flags: Record<string, MockFlag>;
  onAction: (action: GameAction) => void;
}

export function GameMockView({ flags, onAction }: GameMockViewProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(6);
  const [scenarioKey, setScenarioKey] = useState(PANEL_SCENARIOS[0].key);
  const [spec, setSpec] = useState<BoardSpec>(loadBoardSpec);
  const [calibrating, setCalibrating] = useState(false);
  const dragRef = useRef<{ x: number; y: number; spec: BoardSpec } | null>(null);
  const scenario =
    PANEL_SCENARIOS.find((entry) => entry.key === scenarioKey) ??
    PANEL_SCENARIOS[0];
  const scenarioState = scenario.state();

  const filled = createMockGameState();
  const empty = createEmptyGameState();
  const statsState = { ...createMockGameState(), showStats: true };

  const on = (key: string) => flags[key]?.visible ?? false;
  const mocked = (key: string) => flags[key]?.mock ?? false;
  const stateFor = (key: string) => (mocked(key) ? filled : empty);

  const railState = stateFor("rail");
  const boardState = stateFor("board");
  const panelState = stateFor("panel");
  const dockState = stateFor("dock");
  const actionState = stateFor("actionbar");

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

  const panelSquare =
    mocked("panel") && selectedIndex != null
      ? panelState.squares[selectedIndex]
      : null;

  return (
    <div className="grid h-screen grid-rows-[auto_minmax(0,1fr)_auto] gap-1.5 overflow-hidden bg-shell p-2.5 font-sans text-body">
      <div className="w-full h-20 bg-black">
        {on("topbar") && (
          <GameTopBar
            roomCode={mocked("topbar") ? MOCK_ROOM_CODE : "------"}
            remaining={mocked("topbar") ? 114_000 : 0}
            turn={mocked("topbar") ? 7 : 0}
            showClock={mocked("topbar")}
            soundOff={false}
            onRules={() => onAction({ type: "TOGGLE_STATS" })}
            onToggleSound={() => onAction({ type: "TOGGLE_STATS" })}
            onLeave={() => onAction({ type: "RESIGN" })}
          />
        )}
      </div>

      <div className="grid min-h-0 grid-cols-[260px_minmax(0,1fr)_300px] gap-1.5 overflow-hidden bg-black">
        <div className="flex min-h-0 w-full flex-col gap-1">
          <div className="min-h-0 max-h-[32vh] shrink-0 basis-auto overflow-y-auto">
            {on("rail") && (
              <PlayerStandings
                state={railState}
                mySeat={mocked("rail") ? MOCK_SEAT : null}
                moneyFlashes={mocked("rail") ? MOCK_FLASHES : {}}
              />
            )}
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <RailChatPanel
              state={railState}
              mySeat={mocked("rail") ? MOCK_SEAT : null}
              messages={mocked("rail") ? MOCK_MESSAGES : []}
              playerId={MOCK_PLAYER_ID}
              canTrade={mocked("rail")}
              onSendChat={() => onAction({ type: "TOGGLE_STATS" })}
              onOpenTrade={(recipient = 1) =>
                onAction({ type: "OPEN_TRADE", recipient })
              }
            />
          </div>
        </div>
        <div className="flex min-h-0 w-full flex-col gap-1.5">
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setCalibrating((value) => !value)}
              className={`rounded-xs border px-2 py-1 text-[10px] font-bold uppercase ${
                calibrating
                  ? "border-accent bg-accent text-white"
                  : "border-line bg-surface text-dim"
              }`}
            >
              {calibrating ? "Calibrating board" : "Calibrate board"}
            </button>
            {calibrating && (
              <span className="text-[10px] text-dim">
                drag the board to move the grid
              </span>
            )}
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
              onSelectSquare={(index) => {
                setSelectedIndex(index);
                if (index != null) onAction({ type: "SELECT_PROPERTY", index });
              }}
            />
          )}
          </div>
          {calibrating && <BoardCalibrator spec={spec} onChange={setSpec} />}
        </div>
        <div className="flex min-h-0 w-full flex-col gap-1.5">
          {on("panel") && (
            <>
              {/* <label className="flex shrink-0 flex-col gap-1 rounded-panel border border-line bg-surface p-2">
                <span className="text-[9px] font-bold tracking-[0.08em] text-dim uppercase">
                  Panel screen · {scenario.hint}
                </span>
                <select
                  className="w-full rounded-chip border border-line bg-surface-2 px-2 py-1.5 text-[12px] text-body"
                  value={scenarioKey}
                  onChange={(event) => setScenarioKey(event.target.value)}
                >
                  {PANEL_SCENARIOS.map((entry) => (
                    <option key={entry.key} value={entry.key}>
                      {entry.label}
                    </option>
                  ))}
                </select>
              </label> */}
              <div className="min-h-0 flex-1">
                <PropertyPanel
                  state={mocked("panel") ? scenarioState : empty}
                  mySeat={mocked("panel") ? MOCK_SEAT : null}
                  isMyTurn={mocked("panel") ? scenario.isMyTurn : false}
                  selectedIndex={
                    mocked("panel")
                      ? scenario.selectedIndex(scenarioState)
                      : null
                  }
                  act={onAction}
                  onOpenTrade={(recipient = 1) =>
                    onAction({ type: "OPEN_TRADE", recipient })
                  }
                  onClose={() => setSelectedIndex(null)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="h-full ">
        {on("dock") && (
          <GameDock
            state={dockState}
            mySeat={mocked("dock") ? MOCK_SEAT : null}
            onSelectSquare={setSelectedIndex}
            act={onAction}
          />
        )}
      </div>
      {/*

      <main className="grid min-h-0 grid-cols-[260px_minmax(0,1fr)_300px] gap-2.5 max-[1080px]:grid-cols-[minmax(0,1fr)]">
        {on("rail") && (
          <PlayerRail
            state={railState}
            mySeat={mocked("rail") ? MOCK_SEAT : null}
            moneyFlashes={mocked("rail") ? MOCK_FLASHES : {}}
            messages={mocked("rail") ? MOCK_MESSAGES : []}
            playerId={MOCK_PLAYER_ID}
            canTrade={mocked("rail")}
            onSendChat={() => onAction({ type: "TOGGLE_STATS" })}
            onOpenTrade={() => onAction({ type: "OPEN_TRADE", recipient: 1 })}
          />
        )}

        <section className="flex min-h-0 flex-col gap-2 max-[1080px]:order-1">
          {on("banner") && (
            <TurnBanner
              current={mocked("banner") ? filled.players[MOCK_SEAT] : undefined}
              isMyTurn={mocked("banner")}
              error={null}
            />
          )}

          {on("board") && (
            <GameBoard
              state={boardState}
              selectedIndex={mocked("board") ? selectedIndex : null}
              diceRolling={false}
              displayPositions={{}}
              hopping={{}}
              onSelectSquare={(index) => {
                setSelectedIndex(index);
                if (index != null) onAction({ type: "SELECT_PROPERTY", index });
              }}
            />
          )}

          {on("actionbar") && (
            <ActionBar
              state={actionState}
              isMyTurn={mocked("actionbar")}
              canBuy={mocked("actionbar")}
              diceRolling={false}
              canTrade={mocked("actionbar")}
              act={onAction}
              onRollStart={() => onAction({ type: "NEXT" })}
              onOpenTrade={(recipient = 1) =>
                onAction({ type: "OPEN_TRADE", recipient })
              }
            />
          )}
        </section>

        {on("panel") && (
          <PropertyPanel
            state={panelState}
            square={panelSquare}
            mySeat={mocked("panel") ? MOCK_SEAT : null}
            isMyTurn={mocked("panel")}
            act={onAction}
            onClose={() => setSelectedIndex(null)}
          />
        )}
      </main>

      {on("dock") && (
        <GameDock
          state={dockState}
          mySeat={mocked("dock") ? MOCK_SEAT : null}
          onSelectSquare={setSelectedIndex}
        />
      )}

      {on("auction") && (
        <AuctionDialog
          state={mocked("auction") ? createAuctionGameState() : empty}
          act={onAction}
          onShowDeed={setSelectedIndex}
        />
      )}

      {on("card") && (
        <CardDialog
          state={mocked("card") ? createCardGameState() : empty}
          act={onAction}
        />
      )}

      {on("trade") && (
        <TradeDialog
          state={mocked("trade") ? createTradeGameState() : empty}
          mySeat={MOCK_SEAT}
          act={onAction}
          onClose={() => onAction({ type: "CANCEL_TRADE" })}
        />
      )}

      {on("stats") && (
        <StatsDialog
          state={mocked("stats") ? statsState : { ...empty, showStats: true }}
          act={onAction}
          onShowDeed={setSelectedIndex}
        />
      )}

      {on("rules") && (
        <RulesDialog open onClose={() => onAction({ type: "TOGGLE_STATS" })} />
      )}

      {on("gameover") && (
        <div className="fixed bottom-5.5 left-1/2 z-70 -translate-x-1/2 rounded-full bg-accent px-5.5 py-3 text-[14px] font-bold text-white shadow-panel">
          {mocked("gameover")
            ? "🏆 Olivia wins — last player standing"
            : "🏆 — "}
        </div>
      )} */}
    </div>
  );
}
