import { currentRent } from "@/lib/monopoly/stats";
import type { GameState, Square } from "@/lib/monopoly/types";

export type PanelView =
  | { kind: "idle" }
  | { kind: "gameOver"; winner: number }
  | {
      kind: "auction";
      square: Square;
      highestBid: number;
      highestBidder: number;
    }
  | { kind: "dealPending" }
  | { kind: "landedBuy"; square: Square; price: number; cashAfter: number }
  | { kind: "landedShort"; square: Square; price: number; shortBy: number }
  | { kind: "rentDue"; square: Square; rent: number; owner: number }
  | { kind: "specialTile"; square: Square }
  | { kind: "deed"; square: Square; relation: "unowned" | "mine" | "theirs" };

interface ResolveInput {
  state: GameState;
  mySeat: number | null;
  isMyTurn: boolean;
  selectedIndex: number | null;
}

export function isBuyable(square: Square): boolean {
  return square.price > 0;
}

export function resolvePanelView({
  state,
  mySeat,
  isMyTurn,
  selectedIndex,
}: ResolveInput): PanelView {
  if (state.phase === "game_over" && state.winner) {
    return { kind: "gameOver", winner: state.winner };
  }

  if (state.auction) {
    return {
      kind: "auction",
      square: state.squares[state.auction.propertyIndex],
      highestBid: state.auction.highestBid,
      highestBidder: state.auction.highestBidder,
    };
  }

  if (state.trade) return { kind: "dealPending" };

  const me = mySeat != null ? state.players[mySeat] : null;
  const standingOn = me && me.position >= 0 ? state.squares[me.position] : null;
  const inspecting =
    selectedIndex != null && selectedIndex >= 0
      ? state.squares[selectedIndex]
      : null;

  const lookingAtMyTile =
    !!standingOn && (!inspecting || inspecting.index === standingOn.index);

  const declined =
    typeof state.landedMessage === "string" &&
    state.landedMessage.toLowerCase().includes("declined");

  if (isMyTurn && state.diceRolled && standingOn && lookingAtMyTile && me) {
    if (isBuyable(standingOn) && standingOn.owner === 0 && !declined) {
      const price = standingOn.price;
      return me.money >= price
        ? {
            kind: "landedBuy",
            square: standingOn,
            price,
            cashAfter: Math.floor(me.money - price),
          }
        : {
            kind: "landedShort",
            square: standingOn,
            price,
            shortBy: Math.ceil(price - me.money),
          };
    }

    if (
      standingOn.owner > 0 &&
      standingOn.owner !== mySeat &&
      !standingOn.mortgage
    ) {
      return {
        kind: "rentDue",
        square: standingOn,
        rent: currentRent(state, standingOn),
        owner: standingOn.owner,
      };
    }

    if (!isBuyable(standingOn)) {
      return { kind: "specialTile", square: standingOn };
    }
  }

  const square = inspecting;
  if (!square) return { kind: "idle" };

  if (!isBuyable(square)) return { kind: "specialTile", square };

  return {
    kind: "deed",
    square,
    relation:
      square.owner === 0
        ? "unowned"
        : square.owner === mySeat
          ? "mine"
          : "theirs",
  };
}

export function money(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}
