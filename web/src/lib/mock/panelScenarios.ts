import {
  createAuctionGameState,
  createGameOverState,
  createMockGameState,
  createTradeGameState,
  MOCK_SEAT,
} from "@/lib/mock/gameState";
import type { GameState } from "@/lib/monopoly/types";

export interface PanelScenario {
  key: string;
  label: string;
  hint: string;
  state: () => GameState;
  selectedIndex: (state: GameState) => number | null;
  isMyTurn: boolean;
}

const unclaimed = (state: GameState) =>
  state.squares.find((square) => square.price > 0 && square.owner === 0)
    ?.index ?? null;

const mineDeveloped = (state: GameState) =>
  state.squares.find(
    (square) => square.owner === MOCK_SEAT && square.house > 0,
  )?.index ??
  state.squares.find((square) => square.owner === MOCK_SEAT)?.index ??
  null;

const rivalDeveloped = (state: GameState) =>
  state.squares.find(
    (square) =>
      square.owner > 0 &&
      square.owner !== MOCK_SEAT &&
      !square.mortgage &&
      (square.hotel === 1 || square.house > 0),
  )?.index ??
  state.squares.find(
    (square) => square.owner > 0 && square.owner !== MOCK_SEAT,
  )?.index ??
  null;

const taxTile = (state: GameState) =>
  state.squares.find((square) => (square.taxAmount ?? 0) > 0)?.index ?? null;

const transportTile = (state: GameState) =>
  state.squares.find((square) => square.groupNumber === 1)?.index ?? null;

function standOn(pick: (state: GameState) => number | null, cash?: number) {
  return () => {
    const state = createMockGameState();
    const index = pick(state);
    const me = state.players[MOCK_SEAT];
    if (index != null) me.position = index;
    if (cash != null) me.money = cash;
    state.turn = MOCK_SEAT;
    state.diceRolled = true;
    state.phase = "rolled";
    return state;
  };
}

export const PANEL_SCENARIOS: PanelScenario[] = [
  {
    key: "idle",
    label: "Idle — table status",
    hint: "Default screen, nothing selected",
    state: () => {
      const state = createMockGameState();
      state.turn = 1;
      state.diceRolled = false;
      state.phase = "turn_start";
      return state;
    },
    selectedIndex: () => null,
    isMyTurn: false,
  },
  {
    key: "deed-unowned",
    label: "Inspect — unclaimed deed",
    hint: "Tapped a property nobody owns",
    state: createMockGameState,
    selectedIndex: unclaimed,
    isMyTurn: false,
  },
  {
    key: "deed-theirs",
    label: "Inspect — rival's deed",
    hint: "Tapped a property another player owns",
    state: createMockGameState,
    selectedIndex: rivalDeveloped,
    isMyTurn: true,
  },
  {
    key: "deed-mine",
    label: "Inspect — your deed",
    hint: "Build, sell and mortgage controls",
    state: createMockGameState,
    selectedIndex: mineDeveloped,
    isMyTurn: true,
  },
  {
    key: "landed-buy",
    label: "Landed — can buy",
    hint: "On an unclaimed tile with cash to spare",
    state: standOn(unclaimed),
    selectedIndex: () => null,
    isMyTurn: true,
  },
  {
    key: "landed-short",
    label: "Landed — not enough cash",
    hint: "Mortgage, sell or trade to cover the gap",
    state: standOn(unclaimed, 40),
    selectedIndex: () => null,
    isMyTurn: true,
  },
  {
    key: "rent-due",
    label: "Landed — rent due",
    hint: "Standing on a rival's developed property",
    state: standOn(rivalDeveloped),
    selectedIndex: () => null,
    isMyTurn: true,
  },
  {
    key: "rent-broke",
    label: "Landed — rent, in the red",
    hint: "Rent pushed your balance negative",
    state: standOn(rivalDeveloped, -120),
    selectedIndex: () => null,
    isMyTurn: true,
  },
  {
    key: "special-tax",
    label: "Landed — tax tile",
    hint: "Non-ownable tile with a cost",
    state: standOn(taxTile),
    selectedIndex: () => null,
    isMyTurn: true,
  },
  {
    key: "special-transport",
    label: "Inspect — transport hub",
    hint: "Hub rent scales with hubs owned",
    state: createMockGameState,
    selectedIndex: transportTile,
    isMyTurn: false,
  },
  {
    key: "auction",
    label: "Auction running",
    hint: "A property went unbought",
    state: createAuctionGameState,
    selectedIndex: () => null,
    isMyTurn: true,
  },
  {
    key: "deal",
    label: "Deal on the table",
    hint: "Trade in progress",
    state: createTradeGameState,
    selectedIndex: () => null,
    isMyTurn: true,
  },
  {
    key: "game-over",
    label: "Game over",
    hint: "Final standing for the winner",
    state: createGameOverState,
    selectedIndex: () => null,
    isMyTurn: false,
  },
];
