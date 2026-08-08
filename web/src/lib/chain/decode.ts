import { BANK } from "@/lib/chain/config";
import { decodeName } from "@/lib/chain/client";
import { variantOf, type OnchainGame } from "@/lib/chain/types";
import boardData from "@/lib/monopoly/boardData.json";
import { PLAYER_COLORS } from "@/lib/monopoly/board";
import { createStaticBoard } from "@/lib/monopoly/staticBoard";
import type {
  AuctionState,
  CardState,
  GameState,
  Phase,
  Player,
  PlayerColor,
  PopupState,
  Square,
  TradeDraft,
} from "@/lib/monopoly/types";

const FORTUNE_TEXTS = boardData.fortune_cards;
const TREASURY_TEXTS = boardData.treasury_cards;

const TEMPLATE = createStaticBoard();

const PHASES: Record<string, Phase> = {
  Lobby: "setup",
  TurnStart: "turn_start",
  AwaitingDice: "turn_start",
  Rolled: "rolled",
  Card: "card",
  Auction: "auction",
  GameOver: "game_over",
};

function colorOf(index: number): PlayerColor {
  return PLAYER_COLORS[index] ?? "black";
}

function squaresFrom(game: OnchainGame): Square[] {
  return TEMPLATE.map((square, index) => {
    const live = game.squares[index];
    if (!live) return { ...square };
    return {
      ...square,
      owner: live.owner,
      mortgage: live.mortgaged,
      house: live.houses,
      hotel: live.hotel ? 1 : 0,
      landcount: live.land_count,
      group: [...square.group],
    };
  });
}

function playersFrom(game: OnchainGame): Player[] {
  const players: Player[] = [];
  for (let seat = 0; seat <= game.player_count; seat += 1) {
    const live = game.players[seat];
    const eliminated = seat > 0 && !live.active;
    players.push({
      index: seat,
      name: seat === 0 ? "" : decodeName(live.name) || `Player ${seat}`,
      color: colorOf(live.color),
      position: live.position,
      // The UI treats a non-finite balance as "out" — the sentinel the
      // off-chain engine used. On chain the flag is `active`.
      money: eliminated ? Number.NEGATIVE_INFINITY : live.cash.toNumber(),
      creditor: live.creditor === BANK ? -1 : live.creditor,
      jail: live.in_jail,
      jailroll: live.jail_rolls,
      communityChestJailCard: live.treasury_jail_card,
      chanceJailCard: live.fortune_jail_card,
      bidding: live.bidding,
      human: false,
    });
  }
  return players;
}

interface Modal {
  popup: PopupState | null;
  card: CardState | null;
}

function modalFrom(game: OnchainGame): Modal {
  const pending = game.pending;
  const kind = variantOf(pending);

  if (kind === "GoToJail") {
    return {
      popup: {
        open: true,
        title: "Go to Jail",
        message: "Go directly to Jail. Do not pass GO. Do not collect $200.",
        mode: "ok",
        resolveId: `jail-${game.turn}-${game.vrf_nonce.toString()}`,
      },
      card: null,
    };
  }

  if (kind === "JailFine") {
    return {
      popup: {
        open: true,
        title: "Jail",
        message: `Third failed roll — pay the $${boardData.meta.jail_fine} fine and move.`,
        mode: "ok",
        resolveId: `fine-${game.turn}-${game.vrf_nonce.toString()}`,
      },
      card: null,
    };
  }

  if (kind === "Card" && "Card" in pending) {
    const { fortune, index } = pending.Card;
    const texts = fortune ? FORTUNE_TEXTS : TREASURY_TEXTS;
    const text = texts[index] ?? "";
    return {
      popup: {
        open: true,
        title: fortune ? "Fortune" : "Treasury",
        message: text,
        mode: "ok",
        resolveId: `card-${fortune ? "f" : "t"}-${index}-${game.turn}-${game.vrf_nonce.toString()}`,
      },
      card: {
        type: fortune ? "chance" : "community",
        index,
        text,
      },
    };
  }

  return { popup: null, card: null };
}

function auctionFrom(game: OnchainGame): AuctionState | null {
  if (!game.auction.active) return null;
  return {
    propertyIndex: game.auction.square,
    highestBid: game.auction.highest_bid,
    highestBidder: game.auction.highest_bidder,
    currentBidder: game.auction.current_bidder,
  };
}

function tradeFrom(game: OnchainGame): TradeDraft | null {
  const trade = game.trade;
  if (!trade.active) return null;
  return {
    initiator: trade.initiator,
    recipient: trade.recipient,
    leftMoney: trade.initiator_cash,
    rightMoney: trade.recipient_cash,
    // On chain a square is tagged 1 (offered) or 2 (requested); the UI has
    // always used 1 and -1 for the same two directions.
    properties: Array.from(trade.squares, (tag) =>
      tag === 1 ? 1 : tag === 2 ? -1 : 0,
    ),
    communityChestJailCard: 0,
    chanceJailCard: 0,
    awaitingResponse: trade.awaiting_response,
  };
}

function rollLabel(game: OnchainGame): { label: string; title: string } {
  if (game.vrf_pending) {
    return {
      label: "Rolling…",
      title: "Waiting for the randomness oracle to answer.",
    };
  }
  if (game.dice_rolled && game.double_count > 0) {
    return { label: "Roll Again", title: "Doubles — roll again." };
  }
  if (game.dice_rolled) {
    return { label: "End Turn", title: "Hand the dice to the next player." };
  }
  return {
    label: "Roll Dice",
    title: "Roll the dice and move your token accordingly.",
  };
}

export function toGameState(
  game: OnchainGame,
  extras: { alerts?: string[]; selectedProperty?: number } = {},
): GameState {
  const { popup, card } = modalFrom(game);
  const { label, title } = rollLabel(game);
  const deadline = game.turn_deadline.toNumber();

  return {
    phase: PHASES[variantOf(game.phase)] ?? "setup",
    squares: squaresFrom(game),
    players: playersFrom(game),
    playerCount: game.player_count,
    turn: game.turn,
    doubleCount: game.double_count,
    die1: game.die1 || 1,
    die2: game.die2 || 1,
    diceRolled: game.dice_rolled,
    alerts: extras.alerts ?? [],
    landedMessage: "",
    controlTab: "buy",
    nextButtonLabel: label,
    nextButtonTitle: title,
    selectedProperty: extras.selectedProperty ?? -1,
    auctionQueue: game.auction_queue.slice(0, game.auction_queue_len),
    auction: auctionFrom(game),
    trade: tradeFrom(game),
    popup,
    card,
    chanceDeck: [...game.fortune_deck],
    chanceIndex: game.fortune_index,
    communityDeck: [...game.treasury_deck],
    communityIndex: game.treasury_index,
    showStats: false,
    winner: game.winner === BANK ? null : game.winner,
    housesAvailable: game.houses_available,
    hotelsAvailable: game.hotels_available,
    turnDeadlineAt: deadline > 0 ? deadline * 1000 : 0,
  };
}

export function seatOf(game: OnchainGame, wallet: string): number | null {
  for (let seat = 1; seat <= game.player_count; seat += 1) {
    if (game.players[seat].wallet.toBase58() === wallet) return seat;
  }
  return null;
}
