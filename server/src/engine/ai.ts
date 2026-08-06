import type { GameState } from "./types";

export function aiShouldBuy(state: GameState): boolean {
  const p = state.players[state.turn];
  const s = state.squares[p.position];
  return s.price > 0 && s.owner === 0 && p.money > s.price + 50;
}

export function aiShouldPostBail(state: GameState): boolean {
  const p = state.players[state.turn];
  return (
    (p.communityChestJailCard || p.chanceJailCard) && p.jailroll === 2
  );
}

export function aiBid(state: GameState): number {
  const a = state.auction;
  if (!a) return -1;
  const p = state.players[a.currentBidder];
  const bid = a.highestBid + Math.round(Math.random() * 20 + 10);
  if (p.money < bid + 50 || bid > state.squares[a.propertyIndex].price * 1.5) {
    return -1;
  }
  return bid;
}

export function aiMortgageForDebt(state: GameState): number[] {
  const p = state.players[state.turn];
  const toMortgage: number[] = [];
  if (p.money >= 0) return toMortgage;
  for (let i = 39; i >= 0; i--) {
    const s = state.squares[i];
    if (s.owner === p.index && !s.mortgage && s.house === 0) {
      toMortgage.push(i);
    }
  }
  return toMortgage;
}

export function aiHouseTargets(state: GameState): number[] {
  const p = state.players[state.turn];
  const targets: number[] = [];
  for (let i = 0; i < 40; i++) {
    const s = state.squares[i];
    if (s.owner !== p.index || s.groupNumber < 3) continue;
    const allOwned = s.group.every((g) => state.squares[g].owner === p.index);
    if (!allOwned) continue;
    let least = 6;
    let leastIdx = -1;
    for (const g of s.group) {
      if (state.squares[g].house < least) {
        least = state.squares[g].house;
        leastIdx = g;
      }
    }
    if (leastIdx >= 0 && p.money > state.squares[leastIdx].houseprice + 100) {
      if (!targets.includes(leastIdx)) targets.push(leastIdx);
    }
  }
  return targets;
}
