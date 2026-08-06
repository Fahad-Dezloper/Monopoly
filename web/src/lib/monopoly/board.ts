import type { Square } from "./types";

export const BOARD_LAYOUT: { index: number; row: number; col: number }[] = [
  ...Array.from({ length: 11 }, (_, i) => ({ index: 20 + i, row: 1, col: i + 1 })),
  ...Array.from({ length: 9 }, (_, i) => ({ index: 31 + i, row: i + 2, col: 11 })),
  ...Array.from({ length: 11 }, (_, i) => ({ index: 10 - i, row: 11, col: i + 1 })),
  ...Array.from({ length: 9 }, (_, i) => ({ index: 19 - i, row: i + 2, col: 1 })),
];

export function cellSide(
  index: number,
): "corner" | "top" | "right" | "bottom" | "left" {
  if ([0, 10, 20, 30].includes(index)) return "corner";
  if (index > 20 && index < 30) return "top";
  if (index > 30 && index < 40) return "right";
  if (index > 0 && index < 10) return "bottom";
  return "left";
}

export function flagUrl(code: string, size = 64): string {
  return `https://flagcdn.com/w${size}/${code.toLowerCase()}.png`;
}

export const FLAG_EMOJI: Record<string, string> = {
  in: "🇮🇳",
  cn: "🇨🇳",
  br: "🇧🇷",
  ru: "🇷🇺",
  de: "🇩🇪",
  au: "🇦🇺",
  gb: "🇬🇧",
  us: "🇺🇸",
};

export const PLAYER_COLORS = [
  "aqua",
  "black",
  "blue",
  "fuchsia",
  "gray",
  "green",
  "lime",
  "maroon",
  "navy",
  "olive",
  "orange",
  "purple",
  "red",
  "silver",
  "teal",
  "yellow",
] as const;

export const DEFAULT_COLORS = [
  "yellow",
  "blue",
  "red",
  "lime",
  "green",
  "aqua",
  "orange",
  "purple",
] as const;

export type DisplaySquare = Pick<
  Square,
  "index" | "name" | "shortName" | "flagCode" | "price" | "color"
>;
