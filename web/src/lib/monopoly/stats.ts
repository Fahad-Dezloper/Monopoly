import type { GameState, Square } from "@/lib/monopoly/types";

export function netWorth(state: GameState, playerIndex: number): number {
  const p = state.players[playerIndex];
  if (!p || !Number.isFinite(p.money)) return 0;

  let total = Math.floor(p.money);
  for (const s of state.squares) {
    if (s.owner !== playerIndex) continue;
    total += s.mortgage ? s.mortgageValue || Math.floor(s.price / 2) : s.price;
    if (s.hotel === 1) total += s.hotelprice || s.houseprice;
    else total += s.house * s.houseprice;
  }
  return total;
}

export function ownedBy(state: GameState, playerIndex: number): Square[] {
  return state.squares.filter((s) => s.owner === playerIndex);
}

export function turnNumber(state: GameState): number {
  return state.alerts.filter((a) => /'s turn\.$/.test(a.trim())).length || 1;
}

export function groupProgress(
  state: GameState,
  square: Square,
): { owned: number; total: number } {
  const total = square.group.length;
  if (!total || square.owner <= 0) return { owned: 0, total };
  const owned = square.group.filter(
    (i) => state.squares[i].owner === square.owner,
  ).length;
  return { owned, total };
}

export function groupLabel(square: Square): string {
  if (square.groupNumber === 1) return "transport";
  if (square.groupNumber === 2) return "utility";
  return square.flagCode ? `${square.flagCode.toUpperCase()} set` : "property";
}

export interface PlayerHoldings {
  cash: number;
  invested: number;
  deeds: number;
  houses: number;
  hotels: number;
  mortgaged: number;
  rentPerLanding: number;
  sets: number;
}

const AVERAGE_ROLL = 7;

function ownsWholeGroup(state: GameState, square: Square): boolean {
  if (!square.group?.length) return false;
  return square.group.every((i) => state.squares[i].owner === square.owner);
}

function houseRent(square: Square): number {
  if (square.hotel === 1 || square.house >= 5) return square.rent5;
  if (square.house === 4) return square.rent4;
  if (square.house === 3) return square.rent3;
  if (square.house === 2) return square.rent2;
  if (square.house === 1) return square.rent1;
  return square.baserent;
}

export function currentRent(state: GameState, square: Square): number {
  if (square.owner <= 0 || square.mortgage) return 0;

  if (square.groupNumber === 1) {
    const owned = square.group.filter(
      (i) => state.squares[i].owner === square.owner,
    ).length;
    if (owned <= 1) return square.rent1;
    if (owned === 2) return square.rent2;
    if (owned === 3) return square.rent3;
    return square.rent4;
  }

  if (square.groupNumber === 2) {
    const multiplier = ownsWholeGroup(state, square)
      ? square.rent2
      : square.rent1;
    return multiplier * AVERAGE_ROLL;
  }

  if (square.groupNumber >= 3) {
    if (!ownsWholeGroup(state, square)) return square.baserent;
    if (square.house === 0) return square.monopolyrent || square.baserent * 2;
    return houseRent(square);
  }

  return 0;
}

export function playerHoldings(
  state: GameState,
  playerIndex: number,
): PlayerHoldings {
  const player = state.players[playerIndex];
  const deeds = ownedBy(state, playerIndex);

  let invested = 0;
  let houses = 0;
  let hotels = 0;
  let mortgaged = 0;
  let rentPerLanding = 0;
  const completeGroups = new Set<number>();

  for (const square of deeds) {
    invested += square.mortgage
      ? square.mortgageValue || Math.floor(square.price / 2)
      : square.price;

    if (square.hotel === 1) {
      hotels += 1;
      invested += square.hotelprice || square.houseprice;
    } else {
      houses += square.house;
      invested += square.house * square.houseprice;
    }

    if (square.mortgage) mortgaged += 1;
    rentPerLanding += currentRent(state, square);
    if (ownsWholeGroup(state, square)) completeGroups.add(square.groupNumber);
  }

  return {
    cash:
      player && Number.isFinite(player.money) ? Math.floor(player.money) : 0,
    invested,
    deeds: deeds.length,
    houses,
    hotels,
    mortgaged,
    rentPerLanding,
    sets: completeGroups.size,
  };
}
