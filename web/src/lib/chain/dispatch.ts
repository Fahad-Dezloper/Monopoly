import { PublicKey, type TransactionInstruction } from "@solana/web3.js";

import type { RobinverseChain } from "@/lib/chain/client";
import { EPHEMERAL_QUEUE } from "@/lib/chain/config";
import type { OnchainGame } from "@/lib/chain/types";
import { variantOf } from "@/lib/chain/types";
import type { GameAction } from "@/lib/monopoly/engine";
import type { TradeDraft } from "@/lib/monopoly/types";

export interface UiState {
  selectedProperty: number;
  trade: TradeDraft | null;
}

export const EMPTY_UI: UiState = { selectedProperty: -1, trade: null };

export type ActionPlan =
  | { kind: "ignore" }
  | { kind: "ui"; next: Partial<UiState> }
  | { kind: "call"; method: string; args: unknown[] }
  | { kind: "error"; message: string };

function canRollAgain(game: OnchainGame): boolean {
  return (
    game.dice_rolled &&
    game.die1 === game.die2 &&
    game.double_count > 0 &&
    game.double_count < 3 &&
    !game.players[game.turn]?.in_jail &&
    variantOf(game.pending) === "None"
  );
}

/** Squares are 1/-1 in the UI and 1/2 on chain — same two directions. */
function tradeSquares(trade: TradeDraft): number[] {
  const out = new Array<number>(40).fill(0);
  trade.properties.forEach((tag, index) => {
    if (index >= 40) return;
    if (tag === 1) out[index] = 1;
    else if (tag === -1) out[index] = 2;
  });
  return out;
}

export function planAction(
  action: GameAction,
  game: OnchainGame,
  ui: UiState,
): ActionPlan {
  const target = (index?: number) =>
    index != null && index >= 0 ? index : ui.selectedProperty;

  switch (action.type) {
    case "SELECT_PROPERTY":
      return { kind: "ui", next: { selectedProperty: action.index } };

    case "SET_TAB":
    case "TOGGLE_STATS":
    case "START":
      return { kind: "ignore" };

    case "NEXT": {
      if (game.vrf_pending) {
        return { kind: "error", message: "waiting on the dice oracle" };
      }
      if (!game.dice_rolled || canRollAgain(game)) {
        return { kind: "call", method: "rollDice", args: [clientSeed()] };
      }
      return { kind: "call", method: "endTurn", args: [] };
    }

    case "BUY":
      return { kind: "call", method: "buyProperty", args: [] };

    case "DECLINE_BUY":
      return { kind: "call", method: "declineProperty", args: [] };

    case "PAY_JAIL_FINE":
      return { kind: "call", method: "payJailFine", args: [] };

    case "USE_JAIL_CARD":
      return { kind: "call", method: "useJailCard", args: [] };

    case "POPUP_OK":
    case "POPUP_YES":
    case "POPUP_NO":
      return { kind: "call", method: "acknowledge", args: [] };

    case "BUY_HOUSE": {
      const square = target(action.index);
      if (square < 0)
        return { kind: "error", message: "pick a property first" };
      return { kind: "call", method: "build", args: [square] };
    }

    case "SELL_HOUSE": {
      const square = target(action.index);
      if (square < 0)
        return { kind: "error", message: "pick a property first" };
      return { kind: "call", method: "sellBuilding", args: [square] };
    }

    case "MORTGAGE": {
      const square = target();
      if (square < 0)
        return { kind: "error", message: "pick a property first" };
      return { kind: "call", method: "mortgage", args: [square] };
    }

    case "UNMORTGAGE": {
      const square = target();
      if (square < 0)
        return { kind: "error", message: "pick a property first" };
      return { kind: "call", method: "unmortgage", args: [square] };
    }

    case "AUCTION_BID":
      return { kind: "call", method: "placeBid", args: [action.amount] };

    case "AUCTION_PASS":
    case "AUCTION_EXIT":
      return { kind: "call", method: "withdrawBid", args: [] };

    case "OPEN_TRADE": {
      const seats = game.player_count;
      if (
        typeof action.recipient !== "number" ||
        !Number.isInteger(action.recipient) ||
        action.recipient < 1 ||
        action.recipient > seats
      ) {
        return { kind: "error", message: "pick who you want to trade with" };
      }
      return {
        kind: "ui",
        next: {
          trade: {
            initiator: game.turn,
            recipient: action.recipient,
            leftMoney: 0,
            rightMoney: 0,
            properties: new Array<number>(40).fill(0),
            communityChestJailCard: 0,
            chanceJailCard: 0,
            awaitingResponse: false,
          },
        },
      };
    }

    case "UPDATE_TRADE":
      return { kind: "ui", next: { trade: action.trade } };

    case "PROPOSE_TRADE": {
      const draft = ui.trade;
      if (!draft) return { kind: "error", message: "no trade to propose" };
      return {
        kind: "call",
        method: "proposeTrade",
        args: [
          draft.recipient,
          Math.max(0, Math.round(draft.leftMoney)),
          Math.max(0, Math.round(draft.rightMoney)),
          tradeSquares(draft),
        ],
      };
    }

    case "ACCEPT_TRADE":
      return { kind: "call", method: "respondToTrade", args: [true] };

    case "CANCEL_TRADE":
      if (!game.trade.active) return { kind: "ui", next: { trade: null } };
      return { kind: "call", method: "respondToTrade", args: [false] };

    case "RESIGN":
      return { kind: "call", method: "resign", args: [] };

    case "SKIP_TURN":
      return { kind: "call", method: "forceSkipTurn", args: [] };

    default:
      return { kind: "ignore" };
  }
}

function clientSeed(): number {
  return Math.floor(Math.random() * 256);
}

const VRF_METHODS = new Set(["startGame", "rollDice"]);
const PAYER_METHODS = new Set(["checkpoint", "settleGame"]);

export function accountsFor(
  method: string,
  game: PublicKey,
  wallet: PublicKey,
): Record<string, PublicKey> {
  if (VRF_METHODS.has(method)) {
    return { payer: wallet, game, oracleQueue: EPHEMERAL_QUEUE };
  }
  if (PAYER_METHODS.has(method)) return { payer: wallet, game };
  if (method === "forceSkipTurn") return { caller: wallet, game };
  if (method === "createGame") return { host: wallet };
  if (method === "joinGame") return { player: wallet, game };
  if (method === "delegateGame") return { payer: wallet };
  return { player: wallet, game };
}

export function buildInstruction(
  chain: RobinverseChain,
  method: string,
  args: unknown[],
  game: PublicKey,
): Promise<TransactionInstruction> {
  const builder = chain.methods[method];
  if (!builder) {
    throw new Error(`unknown program instruction: ${method}`);
  }
  return builder(...args)
    .accountsPartial(accountsFor(method, game, chain.wallet))
    .instruction();
}
