import type { GameState, Square } from "@/lib/monopoly/types";

export function ownsFullGroup(state: GameState, square: Square): boolean {
  if (!square.group?.length || square.groupNumber < 3) return false;
  return square.group.every((index) => state.squares[index].owner === square.owner);
}

export function groupHasMortgage(state: GameState, square: Square): boolean {
  return square.group.some((index) => state.squares[index].mortgage);
}

export function upgradeCost(square: Square): number {
  if (square.house >= 4) return square.hotelprice || square.houseprice;
  return square.houseprice;
}

export function downgradeRefund(square: Square): number {
  const cost =
    square.hotel === 1
      ? square.hotelprice || square.houseprice
      : square.houseprice;
  return Math.floor(cost * 0.5);
}

export function unmortgageCost(square: Square): number {
  return Math.round(mortgageValue(square) * 1.1);
}

export function mortgageValue(square: Square): number {
  return square.mortgageValue || Math.floor(square.price / 2);
}

export function canUpgrade(
  state: GameState,
  seat: number,
  square: Square,
): boolean {
  const player = state.players[seat];
  if (!player || square.owner !== seat || square.groupNumber < 3) return false;
  if (
    square.mortgage ||
    !ownsFullGroup(state, square) ||
    groupHasMortgage(state, square)
  ) {
    return false;
  }
  if (square.hotel === 1 || square.house >= 5) return false;

  if (square.house < 4) {
    const min = Math.min(
      ...square.group.map((index) => state.squares[index].house),
    );
    if (square.house > min) return false;
    return player.money >= square.houseprice && state.housesAvailable > 0;
  }

  const groupReady = square.group.every((index) => {
    const other = state.squares[index];
    return other.hotel === 1 || other.house === 4;
  });
  if (!groupReady) return false;

  return player.money >= upgradeCost(square) && state.hotelsAvailable > 0;
}

export function canDowngrade(
  state: GameState,
  seat: number,
  square: Square,
): boolean {
  if (square.owner !== seat || square.house === 0) return false;
  const max = Math.max(
    ...square.group.map((index) => state.squares[index].house),
  );
  if (square.house < max) return false;
  if (square.hotel === 1 && state.housesAvailable < 4) return false;
  return true;
}

export function buildHint(
  state: GameState,
  seat: number,
  isMyTurn: boolean,
  square: Square,
): string | null {
  if (square.groupNumber < 3 || square.owner !== seat) return null;
  if (!isMyTurn) return "Build on your turn.";
  if (square.mortgage) return "Unmortgage before building.";
  if (!ownsFullGroup(state, square)) return "Own the full colour set to build.";
  if (groupHasMortgage(state, square)) return "Unmortgage every deed in the set.";
  if (square.hotel === 1) return "Hotel complete.";
  if (canUpgrade(state, seat, square)) return null;

  const min = Math.min(
    ...square.group.map((index) => state.squares[index].house),
  );
  if (square.house > min) return "Build evenly across the set.";
  if (square.house < 4 && state.housesAvailable <= 0) return "Bank is out of houses.";
  if (square.house === 4 && state.hotelsAvailable <= 0) return "Bank is out of hotels.";
  if (state.players[seat].money < upgradeCost(square)) {
    return `Need $${upgradeCost(square)} to upgrade.`;
  }
  return null;
}
