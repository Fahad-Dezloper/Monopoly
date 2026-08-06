import type { Square } from "@/lib/monopoly/types";

export interface TileGlyph {
  symbol: string;
  kind: string;
}

const TRANSPORT_TILES = [5, 15, 25, 35];
const TREASURY_TILES = [2, 17, 33];
const FORTUNE_TILES = [7, 22, 36];
const TAX_TILES = [4, 38];
const CLICKABLE_SPECIALS = [0, 4, 10, 20, 30, 38, 2, 7, 17, 22, 33, 36];

export function tileGlyph(square: Square): TileGlyph | null {
  if (square.tileType === "transport" || TRANSPORT_TILES.includes(square.index)) {
    return { symbol: "✈", kind: "transport" };
  }
  if (square.tileType === "utility") {
    if (square.index === 12 || /solar|electric|power/i.test(square.name)) {
      return { symbol: "⚡", kind: "utility" };
    }
    return { symbol: "💧", kind: "utility" };
  }
  if (square.tileType === "treasury" || TREASURY_TILES.includes(square.index)) {
    return { symbol: "★", kind: "treasury" };
  }
  if (square.tileType === "fortune" || FORTUNE_TILES.includes(square.index)) {
    return { symbol: "?", kind: "fortune" };
  }
  if (square.tileType === "tax" || TAX_TILES.includes(square.index)) {
    return { symbol: "$", kind: "tax" };
  }
  return null;
}

export function isCardTile(index: number): boolean {
  return [...TREASURY_TILES, ...FORTUNE_TILES, ...TAX_TILES].includes(index);
}

export function isTileClickable(square: Square): boolean {
  return square.price > 0 || CLICKABLE_SPECIALS.includes(square.index);
}

export function ownerWash(color: string, mortgaged?: boolean): string {
  const amount = mortgaged ? "16%" : "28%";
  return `color-mix(in srgb, ${color} ${amount}, #f7f4ec)`;
}
