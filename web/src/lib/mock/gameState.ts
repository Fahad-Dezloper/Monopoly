import { BOARD_META, createMockBoard } from "@/lib/mock/board";
import type { GameState, Player, PlayerColor } from "@/lib/monopoly/types";

const TURN_LIMIT_MS = 3 * 60 * 1000;

function bankSeat(): Player {
  return {
    index: 0,
    name: "",
    color: "black",
    position: 0,
    money: 0,
    creditor: -1,
    jail: false,
    jailroll: 0,
    communityChestJailCard: false,
    chanceJailCard: false,
    bidding: true,
    human: false,
  };
}

function seat(
  index: number,
  name: string,
  color: PlayerColor,
  overrides: Partial<Player> = {},
): Player {
  return {
    index,
    name,
    color,
    position: 0,
    money: BOARD_META.starting_cash_per_player,
    creditor: -1,
    jail: false,
    jailroll: 0,
    communityChestJailCard: false,
    chanceJailCard: false,
    bidding: true,
    human: true,
    ...overrides,
  };
}

function baseState(): GameState {
  return {
    phase: "turn_start",
    squares: createMockBoard(),
    players: [bankSeat()],
    playerCount: 0,
    turn: 0,
    doubleCount: 0,
    die1: 1,
    die2: 1,
    diceRolled: false,
    alerts: [],
    landedMessage: "",
    controlTab: "buy",
    nextButtonLabel: "Roll Dice",
    nextButtonTitle: "Roll the dice and move your token accordingly.",
    selectedProperty: -1,
    auctionQueue: [],
    auction: null,
    trade: null,
    popup: null,
    card: null,
    chanceDeck: [],
    chanceIndex: 0,
    communityDeck: [],
    communityIndex: 0,
    showStats: false,
    winner: null,
    housesAvailable: 32,
    hotelsAvailable: 12,
    turnDeadlineAt: 0,
  };
}

export const MOCK_SEAT = 3;

export function createEmptyGameState(): GameState {
  return baseState();
}

export function createMockGameState(): GameState {
  const state = baseState();

  state.players = [
    bankSeat(),
    seat(1, "Emma", "red", { position: 12, money: 1840 }),
    seat(2, "Liam", "lime", { position: 25, money: 980 }),
    seat(3, "Olivia", "blue", {
      position: 6,
      money: 1420,
      communityChestJailCard: true,
      chanceJailCard: true,
    }),
    seat(4, "Noah", "orange", { position: 10, money: 610, jail: true, jailroll: 1 }),
  ];
  state.playerCount = 4;
  state.turn = MOCK_SEAT;
  state.phase = "rolled";
  state.diceRolled = true;
  state.die1 = 4;
  state.die2 = 2;
  state.nextButtonLabel = "End turn";
  state.selectedProperty = 6;
  state.turnDeadlineAt = Date.now() + TURN_LIMIT_MS - 66_000;
  state.landedMessage = "You landed on Shanghai.";

  const own = (index: number, owner: number, house = 0, hotel = 0, mortgage = false) => {
    const square = state.squares[index];
    square.owner = owner;
    square.house = hotel === 1 ? 5 : house;
    square.hotel = hotel;
    square.mortgage = mortgage;
  };

  own(1, 3);
  own(3, 3);
  own(6, 3, 3);
  own(8, 3, 2);
  own(9, 3, 2);
  own(5, 3);
  own(12, 3);
  own(11, 1, 0, 1);
  own(13, 1, 0, 1);
  own(14, 1, 4);
  own(15, 1);
  own(24, 2);
  own(26, 2, 1);
  own(27, 2, 1);
  own(29, 2, 0, 0, true);
  own(31, 4);
  own(32, 4);
  own(34, 4);

  state.housesAvailable = 32 - 13;
  state.hotelsAvailable = 12 - 2;

  state.alerts = [
    "It is Emma's turn.",
    "Emma rolled 8.",
    "Emma landed on Shanghai.",
    "Emma bought Shanghai for $100.",
    "It is Liam's turn.",
    "Liam rolled 5 - doubles.",
    "Liam landed on Berlin.",
    "Liam paid $220 rent to Emma.",
    "It is Noah's turn.",
    "Noah was sent directly to jail.",
    "It is Olivia's turn.",
    "Olivia rolled 6.",
    "Olivia landed on Shanghai.",
    "Olivia placed a house on Shanghai.",
  ];

  return state;
}

export function createAuctionGameState(): GameState {
  const state = createMockGameState();
  state.phase = "auction";
  state.auction = {
    propertyIndex: 16,
    highestBid: 120,
    highestBidder: 1,
    currentBidder: MOCK_SEAT,
  };
  return state;
}

export function createCardGameState(): GameState {
  const state = createMockGameState();
  state.phase = "card";
  state.popup = {
    open: true,
    title: "Fortune",
    message: "Advance to GO. Collect $200.",
    mode: "ok",
    resolveId: "chance:0",
  };
  return state;
}

export function createTradeGameState(): GameState {
  const state = createMockGameState();
  state.phase = "trade";
  state.trade = {
    initiator: MOCK_SEAT,
    recipient: 1,
    leftMoney: 150,
    rightMoney: 0,
    properties: Array(40).fill(0),
    communityChestJailCard: 0,
    chanceJailCard: 0,
    awaitingResponse: false,
  };
  state.trade.properties[5] = 1;
  state.trade.properties[15] = -1;
  return state;
}

export function createGameOverState(): GameState {
  const state = createMockGameState();
  state.phase = "game_over";
  state.winner = MOCK_SEAT;
  return state;
}
