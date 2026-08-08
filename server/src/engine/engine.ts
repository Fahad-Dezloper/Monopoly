import {
  BUILDING_RULES,
  CHANCE_TEXTS,
  COMMUNITY_CHEST_TEXTS,
  createClassicBoard,
  GAME_META,
  squareIndexByName,
} from "./board";
import type {
  GameState,
  Player,
  PlayerColor,
  PlayerSetup,
  Square,
  TradeDraft,
} from "./types";

export const TURN_LIMIT_MS = 3 * 60 * 1000;

function shuffleDeck(length: number): number[] {
  const deck = Array.from({ length }, (_, i) => i);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function randomizeOrder(count: number): number[] {
  const arr = Array.from({ length: count }, (_, i) => i + 1);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function cloneState(state: GameState): GameState {
  return {
    ...state,
    squares: state.squares.map((s) => ({ ...s, group: [...s.group] })),
    players: state.players.map((p) => ({ ...p })),
    alerts: [...state.alerts],
    auctionQueue: [...state.auctionQueue],
    auction: state.auction ? { ...state.auction } : null,
    trade: state.trade
      ? { ...state.trade, properties: [...state.trade.properties] }
      : null,
    popup: state.popup ? { ...state.popup } : null,
    card: state.card ? { ...state.card } : null,
    chanceDeck: [...state.chanceDeck],
    communityDeck: [...state.communityDeck],
  };
}

function addAlert(state: GameState, text: string): void {
  state.alerts = [...state.alerts, text].slice(-80);
}

function currentPlayer(state: GameState): Player {
  return state.players[state.turn];
}

function pay(
  state: GameState,
  playerIndex: number,
  amount: number,
  creditor: number,
): boolean {
  const p = state.players[playerIndex];
  p.money -= amount;
  if (p.money < 0) {
    p.creditor = creditor;
    return false;
  }
  return true;
}

function ownsFullGroup(state: GameState, square: Square): boolean {
  if (!square.group?.length || square.groupNumber < 3) return false;
  return square.group.every((i) => state.squares[i].owner === square.owner);
}

function groupHasMortgage(state: GameState, square: Square): boolean {
  return square.group.some((i) => state.squares[i].mortgage);
}

function canBuildHouseOn(
  state: GameState,
  playerIndex: number,
  sq: Square,
): boolean {
  const p = state.players[playerIndex];
  if (!p || sq.owner !== playerIndex || sq.groupNumber < 3) return false;
  if (sq.mortgage || sq.hotel === 1 || sq.house >= 4) return false;
  if (!ownsFullGroup(state, sq) || groupHasMortgage(state, sq)) return false;
  const minHouses = Math.min(...sq.group.map((i) => state.squares[i].house));
  if (sq.house > minHouses) return false;
  if (p.money < sq.houseprice || state.housesAvailable <= 0) return false;
  return true;
}

function canBuildHotelOn(
  state: GameState,
  playerIndex: number,
  sq: Square,
): boolean {
  const p = state.players[playerIndex];
  if (!p || sq.owner !== playerIndex || sq.groupNumber < 3) return false;
  if (sq.mortgage || sq.hotel === 1 || sq.house !== 4) return false;
  if (!ownsFullGroup(state, sq) || groupHasMortgage(state, sq)) return false;
  if (
    !sq.group.every((i) => {
      const s = state.squares[i];
      return s.hotel === 1 || s.house === 4;
    })
  ) {
    return false;
  }
  if (p.money < (sq.hotelprice || sq.houseprice) || state.hotelsAvailable <= 0)
    return false;
  return true;
}

function rentForHouse(sq: Square): number {
  if (sq.house === 1) return sq.rent1;
  if (sq.house === 2) return sq.rent2;
  if (sq.house === 3) return sq.rent3;
  if (sq.house === 4) return sq.rent4;
  if (sq.house === 5) return sq.rent5;
  return sq.baserent;
}

function calculateRent(
  state: GameState,
  position: number,
  die1: number,
  die2: number,
  increasedRent: boolean,
): number {
  const s = state.squares[position];
  if (s.owner === 0 || s.mortgage) return 0;

  if (s.groupNumber === 1) {
    let owned = 0;
    for (const rr of s.group) {
      if (state.squares[rr].owner === s.owner) owned += 1;
    }
    const mult = increasedRent ? 2 : 1;
    if (owned <= 1) return (s.rent1 || 25) * mult;
    if (owned === 2) return (s.rent2 || 50) * mult;
    if (owned === 3) return (s.rent3 || 100) * mult;
    return (s.rent4 || 200) * mult;
  }

  if (s.groupNumber === 2) {
    const other = s.group.find((i) => i !== position) ?? -1;
    const both = other >= 0 && state.squares[other].owner === s.owner;
    const factor = increasedRent || both ? s.rent2 || 10 : s.rent1 || 4;
    return (die1 + die2) * factor;
  }

  if (s.groupNumber >= 3) {
    if (!ownsFullGroup(state, s)) return s.baserent;
    if (s.house === 0) return s.monopolyrent || s.baserent * 2;
    return rentForHouse(s);
  }

  return 0;
}

export function createInitialState(): GameState {
  return {
    phase: "setup",
    squares: createClassicBoard(),
    players: [],
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
    chanceDeck: shuffleDeck(16),
    chanceIndex: 0,
    communityDeck: shuffleDeck(16),
    communityIndex: 0,
    showStats: false,
    winner: null,
    housesAvailable: BUILDING_RULES.total_houses_available,
    hotelsAvailable: BUILDING_RULES.total_hotels_available,
    turnDeadlineAt: 0,
  };
}

export function startGame(
  setups: PlayerSetup[],
  options?: { shuffle?: boolean },
): GameState {
  const state = createInitialState();
  const count = setups.length;
  state.playerCount = count;
  state.phase = "turn_start";

  const order =
    options?.shuffle === false
      ? Array.from({ length: count }, (_, i) => i + 1)
      : randomizeOrder(count);
  const players: Player[] = Array.from({ length: count + 1 }, (_, i) => ({
    index: i,
    name: "",
    color: "black" as PlayerColor,
    position: 0,
    money: GAME_META.starting_cash_per_player,
    creditor: -1,
    jail: false,
    jailroll: 0,
    communityChestJailCard: false,
    chanceJailCard: false,
    bidding: true,
  }));

  for (let i = 1; i <= count; i++) {
    const setup = setups[order[i - 1] - 1];
    const p = players[i];
    p.color = setup.color;
    p.name = setup.name || `Player ${i}`;
  }

  state.players = players;
  state.turn = 0;
  beginTurn(state);
  return state;
}

function beginTurn(state: GameState): void {
  let guard = 0;
  do {
    state.turn += 1;
    if (state.turn > state.playerCount) state.turn -= state.playerCount;
    guard += 1;
  } while (
    guard < state.playerCount + 1 &&
    (state.players[state.turn].position < 0 ||
      !Number.isFinite(state.players[state.turn].money))
  );

  const p = currentPlayer(state);
  state.diceRolled = false;
  state.doubleCount = 0;
  state.phase = "turn_start";
  state.controlTab = "buy";
  state.landedMessage = "";
  state.nextButtonLabel = "Roll Dice";
  state.nextButtonTitle = "Roll the dice and move your token accordingly.";
  state.selectedProperty = -1;
  state.popup = null;
  state.card = null;
  state.turnDeadlineAt = Date.now() + TURN_LIMIT_MS;

  addAlert(state, `It is ${p.name}'s turn.`);

  if (p.money < 0) {
  }

  if (p.jail) {
    state.landedMessage = "You are in jail.";
    state.nextButtonTitle =
      "Roll the dice. If you throw doubles, you will get out of jail.";
    if (p.jailroll === 0)
      addAlert(state, `This is ${p.name}'s first turn in jail.`);
    else if (p.jailroll === 1)
      addAlert(state, `This is ${p.name}'s second turn in jail.`);
    else if (p.jailroll === 2) {
      state.landedMessage +=
        " NOTE: If you do not throw doubles after this roll, you must pay the $50 fine.";
      addAlert(state, `This is ${p.name}'s third turn in jail.`);
    }
  }
}

function goToJail(state: GameState): void {
  const p = currentPlayer(state);
  addAlert(state, `${p.name} was sent directly to jail.`);
  p.jail = true;
  p.position = 10;
  state.doubleCount = 0;
  state.landedMessage = "You are in jail.";
  state.nextButtonLabel = "End turn";
  state.nextButtonTitle = "End turn and advance to the next player.";
  state.diceRolled = true;
  state.phase = "rolled";
}

function land(state: GameState, increasedRent = false): void {
  const p = currentPlayer(state);
  const s = state.squares[p.position];
  s.landcount += 1;
  state.landedMessage = `You landed on ${s.name}.`;
  addAlert(state, `${p.name} landed on ${s.name}.`);

  if (s.price !== 0 && s.owner === 0) {
    state.landedMessage = `You landed on ${s.name}.`;
    if (!state.auctionQueue.includes(p.position)) {
      state.auctionQueue.push(p.position);
    }
  }

  if (s.owner !== 0 && s.owner !== state.turn && !s.mortgage) {
    const rent = calculateRent(
      state,
      p.position,
      state.die1,
      state.die2,
      increasedRent,
    );
    addAlert(
      state,
      `${p.name} paid $${rent} rent to ${state.players[s.owner].name}.`,
    );
    pay(state, state.turn, rent, s.owner);
    state.players[s.owner].money += rent;
    state.landedMessage = `You landed on ${s.name}. ${state.players[s.owner].name} collected $${rent} rent.`;
  } else if (s.owner > 0 && s.owner !== state.turn && s.mortgage) {
    state.landedMessage = `You landed on ${s.name}. Property is mortgaged; no rent was collected.`;
  }

  if (s.taxAmount > 0) {
    pay(state, state.turn, s.taxAmount, 0);
    addAlert(state, `${p.name} paid $${s.taxAmount} for landing on ${s.name}.`);
    state.landedMessage = `You landed on ${s.name}. Pay $${s.taxAmount}.`;
  }

  if (p.position === 30 || s.tileType === "go_to_jail") {
    state.popup = {
      open: true,
      message:
        "Go to jail. Go directly to Jail. Do not pass GO. Do not collect $200.",
      mode: "ok",
      resolveId: "gotojail",
    };
    return;
  }

  if (s.tileType === "treasury" || [2, 17, 33].includes(p.position)) {
    drawCommunityChest(state);
    return;
  }
  if (s.tileType === "fortune" || [7, 22, 36].includes(p.position)) {
    drawChance(state);
    return;
  }

  state.phase = "rolled";
}

function drawFromDeck(
  deck: number[],
  index: number,
  removeIf?: (cardIndex: number) => boolean,
): { cardIndex: number; deck: number[]; nextIndex: number } {
  const cardIndex = deck[index % deck.length];
  let nextDeck = deck;
  let nextIndex = index + 1;

  if (removeIf?.(cardIndex)) {
    nextDeck = deck.filter((_, i) => i !== index % deck.length);
    nextIndex = index % Math.max(nextDeck.length, 1);
  }

  if (nextDeck.length > 0 && nextIndex >= nextDeck.length) nextIndex = 0;

  return { cardIndex, deck: nextDeck, nextIndex };
}

function isJailFreeText(text: string): boolean {
  return /get out of jail free/i.test(text);
}

function drawCommunityChest(state: GameState): void {
  const drawn = drawFromDeck(state.communityDeck, state.communityIndex, (i) =>
    isJailFreeText(COMMUNITY_CHEST_TEXTS[i] ?? ""),
  );
  state.communityDeck = drawn.deck;
  state.communityIndex = drawn.nextIndex;
  const idx = drawn.cardIndex;

  state.card = {
    type: "community",
    index: idx,
    text: COMMUNITY_CHEST_TEXTS[idx],
  };
  state.phase = "card";
  state.popup = {
    open: true,
    title: "Treasury",
    message: COMMUNITY_CHEST_TEXTS[idx],
    mode: "ok",
    resolveId: `community:${idx}`,
  };
}

function drawChance(state: GameState): void {
  const drawn = drawFromDeck(state.chanceDeck, state.chanceIndex, (i) =>
    isJailFreeText(CHANCE_TEXTS[i] ?? ""),
  );
  state.chanceDeck = drawn.deck;
  state.chanceIndex = drawn.nextIndex;
  const idx = drawn.cardIndex;

  state.card = {
    type: "chance",
    index: idx,
    text: CHANCE_TEXTS[idx],
  };
  state.phase = "card";
  state.popup = {
    open: true,
    title: "Fortune",
    message: CHANCE_TEXTS[idx],
    mode: "ok",
    resolveId: `chance:${idx}`,
  };
}

function streetRepairs(
  state: GameState,
  housePrice: number,
  hotelPrice: number,
): void {
  const p = currentPlayer(state);
  let cost = 0;
  for (const s of state.squares) {
    if (s.owner === state.turn) {
      if (s.hotel === 1) cost += hotelPrice;
      else cost += s.house * housePrice;
    }
  }
  pay(state, state.turn, cost, 0);
  addAlert(state, `${p.name} paid $${cost} for street repairs.`);
}

function advance(state: GameState, destination: number): void {
  const p = currentPlayer(state);
  if (destination >= 0 && p.position > destination) {
    p.money += GAME_META.go_salary;
    addAlert(
      state,
      `${p.name} collected a $${GAME_META.go_salary} salary for passing GO.`,
    );
  }
  p.position = destination;
  land(state);
}

function advanceToNearestUtility(state: GameState): void {
  const p = currentPlayer(state);
  const utils = state.squares
    .filter((s) => s.groupNumber === 2)
    .map((s) => s.index)
    .sort((a, b) => a - b);
  if (utils.length === 0) return;
  let dest = utils.find((i) => i > p.position);
  if (dest == null) {
    p.money += GAME_META.go_salary;
    addAlert(
      state,
      `${p.name} collected a $${GAME_META.go_salary} salary for passing GO.`,
    );
    dest = utils[0];
  }
  p.position = dest;
  land(state, true);
}

function advanceToNearestRailroad(state: GameState): void {
  const p = currentPlayer(state);
  const hubs = state.squares
    .filter((s) => s.groupNumber === 1)
    .map((s) => s.index)
    .sort((a, b) => a - b);
  if (hubs.length === 0) return;
  let dest = hubs.find((i) => i > p.position);
  if (dest == null) {
    p.money += GAME_META.go_salary;
    addAlert(
      state,
      `${p.name} collected a $${GAME_META.go_salary} salary for passing GO.`,
    );
    dest = hubs[0];
  }
  p.position = dest;
  land(state, true);
}

function applyCommunityCard(state: GameState, index: number): void {
  const p = currentPlayer(state);
  switch (index) {
    case 0:
      advance(state, 0);
      return;
    case 1:
      p.money += 200;
      addAlert(state, `${p.name} received $200 from Treasury.`);
      break;
    case 2:
      pay(state, state.turn, 50, 0);
      addAlert(state, `${p.name} paid $50 from Treasury.`);
      break;
    case 3:
      p.money += 50;
      addAlert(state, `${p.name} received $50 from Treasury.`);
      break;
    case 4:
      p.communityChestJailCard = true;
      break;
    case 5:
      goToJail(state);
      return;
    case 6:
    case 9:
    case 15:
      p.money += 100;
      addAlert(state, `${p.name} received $100 from Treasury.`);
      break;
    case 7:
      p.money += 20;
      addAlert(state, `${p.name} received $20 from Treasury.`);
      break;
    case 8: {
      let total = 0;
      for (let i = 1; i <= state.playerCount; i++) {
        if (i === state.turn) continue;
        const other = state.players[i];
        const give = Math.min(10, Math.max(0, other.money));
        other.money -= give;
        p.money += give;
        total += give;
      }
      addAlert(state, `${p.name} received $${total} from Treasury.`);
      break;
    }
    case 10:
      pay(state, state.turn, 100, 0);
      addAlert(state, `${p.name} paid $100 from Treasury.`);
      break;
    case 11:
      pay(state, state.turn, 150, 0);
      addAlert(state, `${p.name} paid $150 from Treasury.`);
      break;
    case 12:
      p.money += 25;
      addAlert(state, `${p.name} received $25 from Treasury.`);
      break;
    case 13:
      streetRepairs(state, 40, 115);
      break;
    case 14:
      p.money += 10;
      addAlert(state, `${p.name} received $10 from Treasury.`);
      break;
  }
  state.card = null;
  state.phase = "rolled";
}

function applyChanceCard(state: GameState, index: number): void {
  const p = currentPlayer(state);
  switch (index) {
    case 0:
      advance(state, 0);
      return;
    case 1:
    case 12: {
      const dest = squareIndexByName("Grand Promenade");
      if (dest >= 0) {
        advance(state, dest);
        return;
      }
      break;
    }
    case 2: {
      const dest = squareIndexByName("Pacifica");
      if (dest >= 0) {
        advance(state, dest);
        return;
      }
      break;
    }
    case 3:
      advanceToNearestRailroad(state);
      return;
    case 4:
      advanceToNearestUtility(state);
      return;
    case 5:
      p.money += 50;
      addAlert(state, `${p.name} received $50 from Fortune.`);
      break;
    case 6:
      p.chanceJailCard = true;
      break;
    case 7:
      p.position = Math.max(0, p.position - 3);
      land(state);
      return;
    case 8:
      goToJail(state);
      return;
    case 9:
      streetRepairs(state, 25, 100);
      break;
    case 10:
      pay(state, state.turn, 15, 0);
      addAlert(state, `${p.name} paid $15 from Fortune.`);
      break;
    case 11: {
      const dest = squareIndexByName("Central Station");
      if (dest >= 0) {
        advance(state, dest);
        return;
      }
      break;
    }
    case 13: {
      let total = 0;
      for (let i = 1; i <= state.playerCount; i++) {
        if (i === state.turn) continue;
        state.players[i].money += 50;
        total += 50;
        pay(state, state.turn, 50, i);
      }
      addAlert(state, `${p.name} paid $${total} from Fortune.`);
      break;
    }
    case 14:
      p.money += 150;
      addAlert(state, `${p.name} received $150 from Fortune.`);
      break;
    case 15:
      p.money += 100;
      addAlert(state, `${p.name} received $100 from Fortune.`);
      break;
  }
  state.card = null;
  state.phase = "rolled";
}

function rollDice(state: GameState): void {
  const p = currentPlayer(state);
  state.controlTab = "buy";
  state.die1 = Math.floor(Math.random() * 6) + 1;
  state.die2 = Math.floor(Math.random() * 6) + 1;
  state.diceRolled = true;
  state.phase = "rolled";

  const die1 = state.die1;
  const die2 = state.die2;
  const isDoubles = die1 === die2;

  state.doubleCount += 1;

  if (isDoubles) addAlert(state, `${p.name} rolled ${die1 + die2} - doubles.`);
  else addAlert(state, `${p.name} rolled ${die1 + die2}.`);

  if (isDoubles && !p.jail) {
    if (state.doubleCount < 3) {
      state.nextButtonLabel = "Roll again";
      state.nextButtonTitle = "You threw doubles. Roll again.";
    } else {
      addAlert(state, `${p.name} rolled doubles three times in a row.`);
      state.popup = {
        open: true,
        message: "You rolled doubles three times in a row. Go to jail.",
        mode: "ok",
        resolveId: "gotojail",
      };
      state.doubleCount = 0;
      return;
    }
  } else {
    state.nextButtonLabel = "End turn";
    state.nextButtonTitle = "End turn and advance to the next player.";
    if (!isDoubles) state.doubleCount = 0;
  }

  if (p.jail) {
    p.jailroll += 1;
    if (isDoubles) {
      p.jail = false;
      p.jailroll = 0;
      p.position = 10 + die1 + die2;
      state.doubleCount = 0;
      state.nextButtonLabel = "End turn";
      addAlert(state, `${p.name} rolled doubles to get out of jail.`);
      land(state);
    } else if (p.jailroll === 3) {
      state.popup = {
        open: true,
        message: "You must pay the $50 fine.",
        mode: "ok",
        resolveId: "jailfine_leave",
      };
    } else {
      state.landedMessage = "You are in jail.";
    }
    return;
  }

  p.position += die1 + die2;
  if (p.position >= 40) {
    p.position -= 40;
    p.money += GAME_META.go_salary;
    addAlert(
      state,
      `${p.name} collected a $${GAME_META.go_salary} salary for passing GO.`,
    );
  }
  land(state);
}

function endTurnOrAuction(state: GameState): void {
  while (state.auctionQueue.length > 0) {
    const idx = state.auctionQueue.shift()!;
    const s = state.squares[idx];
    if (s.price === 0 || s.owner !== 0) continue;

    let bidder = state.turn + 1;
    if (bidder > state.playerCount) bidder -= state.playerCount;

    state.auction = {
      propertyIndex: idx,
      highestBid: 0,
      highestBidder: 0,
      currentBidder: bidder,
    };
    state.phase = "auction";
    for (let i = 1; i <= state.playerCount; i++) {
      state.players[i].bidding = true;
    }
    state.turnDeadlineAt = Date.now() + TURN_LIMIT_MS;
    return;
  }

  beginTurn(state);
}

function applyPopupOk(state: GameState): void {
  const p = currentPlayer(state);
  const id = state.popup?.resolveId;
  state.popup = null;
  if (id === "gotojail") {
    goToJail(state);
  } else if (id === "jailfine_leave") {
    pay(state, state.turn, GAME_META.jail_fine, 0);
    p.jail = false;
    p.jailroll = 0;
    p.position = 10 + state.die1 + state.die2;
    addAlert(
      state,
      `${p.name} paid the $${GAME_META.jail_fine} fine to get out of jail.`,
    );
    land(state);
  } else if (id?.startsWith("community:")) {
    applyCommunityCard(state, Number(id.split(":")[1]));
  } else if (id?.startsWith("chance:")) {
    applyChanceCard(state, Number(id.split(":")[1]));
  }
}

function skipTimedOutTurn(state: GameState): void {
  if (state.phase === "game_over" || state.winner != null) return;
  const p = currentPlayer(state);
  if (!p || p.position < 0 || !Number.isFinite(p.money)) return;

  state.popup = null;
  state.card = null;
  state.trade = null;
  state.auction = null;
  state.controlTab = "buy";
  if (
    state.phase === "auction" ||
    state.phase === "card" ||
    state.phase === "trade"
  ) {
    state.phase = state.diceRolled ? "rolled" : "turn_start";
  }

  p.creditor = 0;
  eliminateCurrentPlayer(state, "timeout");
}

export function isTurnExpired(state: GameState, now = Date.now()): boolean {
  if (
    state.phase === "game_over" ||
    state.phase === "setup" ||
    state.phase === "auction"
  ) {
    return false;
  }
  const deadline = state.turnDeadlineAt ?? 0;
  return deadline > 0 && now >= deadline;
}

function finalizeAuction(state: GameState): void {
  const a = state.auction!;
  if (a.highestBid > 0 && a.highestBidder > 0) {
    const p = state.players[a.highestBidder];
    const sq = state.squares[a.propertyIndex];
    pay(state, a.highestBidder, a.highestBid, 0);
    sq.owner = a.highestBidder;
    addAlert(state, `${p.name} bought ${sq.name} for $${a.highestBid}.`);
  }
  state.auction = null;
  for (let i = 1; i <= state.playerCount; i++) {
    state.players[i].bidding = true;
  }
  endTurnOrAuction(state);
}

function advanceAuctionBidder(state: GameState): void {
  const a = state.auction!;
  if (a.highestBidder === 0) a.highestBidder = a.currentBidder;

  while (true) {
    a.currentBidder += 1;
    if (a.currentBidder > state.playerCount)
      a.currentBidder -= state.playerCount;

    if (a.currentBidder === a.highestBidder) {
      finalizeAuction(state);
      return;
    }
    if (state.players[a.currentBidder].bidding) {
      return;
    }
  }
}

function transferAssets(state: GameState, from: number, to: number): void {
  for (const s of state.squares) {
    if (s.owner === from) {
      s.owner = to === 0 ? 0 : to;
      if (to === 0) {
        s.mortgage = false;
        s.house = 0;
        s.hotel = 0;
      }
    }
  }
  const loser = state.players[from];
  if (to > 0) {
    const winner = state.players[to];
    winner.money += Math.max(0, loser.money);
    if (loser.communityChestJailCard) {
      winner.communityChestJailCard = true;
      loser.communityChestJailCard = false;
    }
    if (loser.chanceJailCard) {
      winner.chanceJailCard = true;
      loser.chanceJailCard = false;
    }
  }
  loser.money = 0;
}

function eliminateCurrentPlayer(
  state: GameState,
  reason: "resign" | "timeout",
): void {
  const p = currentPlayer(state);
  if (!p || p.position < 0 || !Number.isFinite(p.money)) return;

  const creditor = p.creditor > 0 ? p.creditor : 0;
  if (reason === "timeout") {
    addAlert(
      state,
      `${p.name} ran out of time and was eliminated from the game.`,
    );
  } else {
    addAlert(
      state,
      creditor > 0
        ? `${p.name} resigned. Assets go to ${state.players[creditor].name}.`
        : `${p.name} resigned.`,
    );
  }

  transferAssets(state, state.turn, creditor);

  p.money = -Infinity as unknown as number;
  p.position = -1;

  const alive: number[] = [];
  for (let i = 1; i <= state.playerCount; i++) {
    if (
      state.players[i].position >= 0 &&
      Number.isFinite(state.players[i].money)
    ) {
      alive.push(i);
    }
  }

  if (alive.length === 1) {
    state.winner = alive[0];
    state.phase = "game_over";
    state.popup = {
      open: true,
      title: "Game Over",
      message: `${state.players[alive[0]].name} wins!`,
      mode: "ok",
      resolveId: "gameover",
    };
    addAlert(state, `${state.players[alive[0]].name} wins!`);
    return;
  }

  if (alive.length === 0) {
    state.phase = "game_over";
    state.winner = null;
    return;
  }

  state.diceRolled = true;
  state.doubleCount = 0;
  endTurnOrAuction(state);
  let guard = 0;
  while (
    guard < state.playerCount + 1 &&
    (state.players[state.turn].position < 0 ||
      !Number.isFinite(state.players[state.turn].money))
  ) {
    beginTurn(state);
    guard += 1;
  }
}

function resignPlayer(state: GameState): void {
  eliminateCurrentPlayer(state, "resign");
}

function applyTrade(state: GameState, trade: TradeDraft): void {
  const init = state.players[trade.initiator];
  const recip = state.players[trade.recipient];
  const money = trade.leftMoney - trade.rightMoney;

  if (money > 0) {
    if (init.money < money) return;
    init.money -= money;
    recip.money += money;
  } else if (money < 0) {
    if (recip.money < -money) return;
    recip.money += money;
    init.money -= money;
  }

  for (let i = 0; i < 40; i++) {
    if (trade.properties[i] === 1) state.squares[i].owner = trade.recipient;
    if (trade.properties[i] === -1) state.squares[i].owner = trade.initiator;
  }

  if (trade.communityChestJailCard === 1) {
    init.communityChestJailCard = false;
    recip.communityChestJailCard = true;
  } else if (trade.communityChestJailCard === -1) {
    recip.communityChestJailCard = false;
    init.communityChestJailCard = true;
  }

  if (trade.chanceJailCard === 1) {
    init.chanceJailCard = false;
    recip.chanceJailCard = true;
  } else if (trade.chanceJailCard === -1) {
    recip.chanceJailCard = false;
    init.chanceJailCard = true;
  }

  addAlert(state, `${init.name} traded with ${recip.name}.`);
  state.trade = null;
  state.controlTab = "buy";
  state.phase = state.diceRolled ? "rolled" : "turn_start";
}

export type GameAction =
  | { type: "START"; setups: PlayerSetup[] }
  | { type: "NEXT" }
  | { type: "BUY" }
  | { type: "DECLINE_BUY" }
  | { type: "PAY_JAIL_FINE" }
  | { type: "USE_JAIL_CARD" }
  | { type: "SET_TAB"; tab: GameState["controlTab"] }
  | { type: "SELECT_PROPERTY"; index: number }
  | { type: "BUY_HOUSE"; index?: number }
  | { type: "SELL_HOUSE"; index?: number }
  | { type: "MORTGAGE" }
  | { type: "UNMORTGAGE" }
  | { type: "POPUP_OK" }
  | { type: "POPUP_YES" }
  | { type: "POPUP_NO" }
  | { type: "AUCTION_BID"; amount: number }
  | { type: "AUCTION_PASS" }
  | { type: "AUCTION_EXIT" }
  | { type: "OPEN_TRADE"; recipient: number }
  | { type: "UPDATE_TRADE"; trade: TradeDraft }
  | { type: "PROPOSE_TRADE" }
  | { type: "ACCEPT_TRADE" }
  | { type: "CANCEL_TRADE" }
  | { type: "TOGGLE_STATS" }
  | { type: "RESIGN" }
  | { type: "SKIP_TURN" };

export function gameReducer(prev: GameState, action: GameAction): GameState {
  if (action.type === "START") {
    return startGame(action.setups);
  }

  const state = cloneState(prev);
  const p = state.players[state.turn];

  switch (action.type) {
    case "NEXT": {
      if (state.phase === "auction" || state.phase === "card") break;
      if (state.popup?.open) break;

      if (state.diceRolled && state.doubleCount === 0) {
        endTurnOrAuction(state);
      } else {
        rollDice(state);
      }
      break;
    }

    case "BUY": {
      const sq = state.squares[p.position];
      if (sq.price > 0 && sq.owner === 0 && p.money >= sq.price) {
        pay(state, state.turn, sq.price, 0);
        sq.owner = state.turn;
        addAlert(state, `${p.name} bought ${sq.name} for ${sq.pricetext}.`);
        state.auctionQueue = state.auctionQueue.filter((i) => i !== p.position);
        state.landedMessage = `You bought ${sq.name}.`;
      }
      break;
    }

    case "DECLINE_BUY": {
      const sq = state.squares[p.position];
      if (sq.price > 0 && sq.owner === 0) {
        if (!state.auctionQueue.includes(p.position)) {
          state.auctionQueue.push(p.position);
        }
        addAlert(state, `${p.name} declined to buy ${sq.name}.`);
        state.landedMessage = `You declined ${sq.name}.`;
        // Extra roll pending → keep turn; otherwise open auction / next turn.
        if (state.doubleCount === 0) {
          endTurnOrAuction(state);
        }
      }
      break;
    }

    case "PAY_JAIL_FINE": {
      pay(state, state.turn, GAME_META.jail_fine, 0);
      p.jail = false;
      p.jailroll = 0;
      addAlert(
        state,
        `${p.name} paid the $${GAME_META.jail_fine} fine to get out of jail.`,
      );
      state.landedMessage = "";
      if (!state.diceRolled) {
        state.nextButtonLabel = "Roll Dice";
      }
      break;
    }

    case "USE_JAIL_CARD": {
      if (p.communityChestJailCard) {
        p.communityChestJailCard = false;
        const jailIdx = COMMUNITY_CHEST_TEXTS.findIndex(isJailFreeText);
        if (jailIdx >= 0) state.communityDeck.push(jailIdx);
      } else if (p.chanceJailCard) {
        p.chanceJailCard = false;
        const jailIdx = CHANCE_TEXTS.findIndex(isJailFreeText);
        if (jailIdx >= 0) state.chanceDeck.push(jailIdx);
      } else break;
      p.jail = false;
      p.jailroll = 0;
      addAlert(state, `${p.name} used a "Get Out of Jail Free" card.`);
      state.landedMessage = "";
      break;
    }

    case "SET_TAB":
      state.controlTab = action.tab;
      if (action.tab === "trade" && !state.trade) {
        const recipient = state.turn === 1 ? 2 : 1;
        state.trade = {
          initiator: state.turn,
          recipient,
          leftMoney: 0,
          rightMoney: 0,
          properties: Array(40).fill(0),
          communityChestJailCard: 0,
          chanceJailCard: 0,
          awaitingResponse: false,
        };
        state.phase = "trade";
      } else if (action.tab !== "trade") {
        state.trade = null;
        state.phase = state.diceRolled ? "rolled" : "turn_start";
      }
      break;

    case "SELECT_PROPERTY":
      state.selectedProperty = action.index;
      break;

    case "BUY_HOUSE": {
      const idx =
        typeof action.index === "number"
          ? action.index
          : state.selectedProperty;
      if (idx < 0) break;
      state.selectedProperty = idx;
      const sq = state.squares[idx];

      if (canBuildHouseOn(state, state.turn, sq)) {
        sq.house += 1;
        state.housesAvailable -= 1;
        pay(state, state.turn, sq.houseprice, 0);
        addAlert(state, `${p.name} placed a house on ${sq.name}.`);
      } else if (canBuildHotelOn(state, state.turn, sq)) {
        const cost = sq.hotelprice || sq.houseprice;
        sq.house = 5;
        sq.hotel = 1;
        state.housesAvailable += 4;
        state.hotelsAvailable -= 1;
        pay(state, state.turn, cost, 0);
        addAlert(state, `${p.name} placed a hotel on ${sq.name}.`);
      }
      break;
    }

    case "SELL_HOUSE": {
      const idx =
        typeof action.index === "number"
          ? action.index
          : state.selectedProperty;
      if (idx < 0) break;
      state.selectedProperty = idx;
      const sq = state.squares[idx];
      if (sq.owner !== state.turn || sq.house === 0) break;
      const maxHouses = Math.max(
        ...sq.group.map((i) => state.squares[i].house),
      );
      if (sq.house < maxHouses) break;

      if (sq.hotel === 1) {
        if (state.housesAvailable < 4) break;
        sq.hotel = 0;
        sq.house = 4;
        state.hotelsAvailable += 1;
        state.housesAvailable -= 4;
        addAlert(state, `${p.name} sold the hotel on ${sq.name}.`);
        p.money += (sq.hotelprice || sq.houseprice) * 0.5;
      } else {
        sq.house -= 1;
        state.housesAvailable += 1;
        addAlert(state, `${p.name} sold a house on ${sq.name}.`);
        p.money += sq.houseprice * 0.5;
      }
      break;
    }

    case "MORTGAGE": {
      const idx = state.selectedProperty;
      if (idx < 0) break;
      const sq = state.squares[idx];
      if (sq.owner !== state.turn || sq.mortgage || sq.house > 0) break;
      const cash = sq.mortgageValue || Math.floor(sq.price / 2);
      sq.mortgage = true;
      p.money += cash;
      addAlert(state, `${p.name} mortgaged ${sq.name} for $${cash}.`);
      break;
    }

    case "UNMORTGAGE": {
      const idx = state.selectedProperty;
      if (idx < 0) break;
      const sq = state.squares[idx];
      const base = sq.mortgageValue || Math.floor(sq.price / 2);
      const cost = Math.round(base * 1.1);
      if (sq.owner !== state.turn || !sq.mortgage || p.money < cost) break;
      sq.mortgage = false;
      pay(state, state.turn, cost, 0);
      addAlert(state, `${p.name} unmortgaged ${sq.name} for $${cost}.`);
      break;
    }

    case "POPUP_OK": {
      applyPopupOk(state);
      break;
    }

    case "POPUP_YES":
    case "POPUP_NO":
      state.popup = null;
      break;

    case "SKIP_TURN": {
      skipTimedOutTurn(state);
      break;
    }

    case "AUCTION_BID": {
      if (!state.auction) break;
      const a = state.auction;
      const bidder = state.players[a.currentBidder];
      if (action.amount <= a.highestBid) {
        a.message = `Your bid must be greater than highest bid. ($${a.highestBid})`;
        break;
      }
      if (action.amount > bidder.money) {
        a.message = `You don't have enough money to bid $${action.amount}.`;
        break;
      }
      a.highestBid = action.amount;
      a.highestBidder = a.currentBidder;
      a.message = undefined;
      advanceAuctionBidder(state);
      break;
    }

    case "AUCTION_PASS": {
      if (!state.auction) break;
      advanceAuctionBidder(state);
      break;
    }

    case "AUCTION_EXIT": {
      if (!state.auction) break;
      state.players[state.auction.currentBidder].bidding = false;
      advanceAuctionBidder(state);
      break;
    }

    case "OPEN_TRADE": {
      state.controlTab = "trade";
      state.phase = "trade";
      state.trade = {
        initiator: state.turn,
        recipient: action.recipient,
        leftMoney: 0,
        rightMoney: 0,
        properties: Array(40).fill(0),
        communityChestJailCard: 0,
        chanceJailCard: 0,
        awaitingResponse: false,
      };
      break;
    }

    case "UPDATE_TRADE":
      state.trade = action.trade;
      break;

    case "PROPOSE_TRADE": {
      if (!state.trade) break;
      state.trade.awaitingResponse = true;
      break;
    }

    case "ACCEPT_TRADE": {
      if (state.trade?.awaitingResponse) applyTrade(state, state.trade);
      break;
    }

    case "CANCEL_TRADE":
      state.trade = null;
      state.controlTab = "buy";
      state.phase = state.diceRolled ? "rolled" : "turn_start";
      break;

    case "TOGGLE_STATS":
      state.showStats = !state.showStats;
      break;

    case "RESIGN":
      resignPlayer(state);
      break;
  }

  return state;
}

export function canBuyProperty(state: GameState): boolean {
  const p = state.players[state.turn];
  if (!p || state.phase === "setup") return false;
  const sq = state.squares[p.position];
  return (
    sq.price > 0 && sq.owner === 0 && p.money >= sq.price && state.diceRolled
  );
}

export function ownedByCurrent(state: GameState): Square[] {
  return state.squares.filter((s) => s.owner === state.turn);
}
