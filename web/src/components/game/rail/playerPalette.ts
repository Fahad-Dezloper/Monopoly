/** Soft pastels for Solana City player cards (match mock HUD). */
export const CARD_PALETTE = [
  "#9DF18F",
  "#C589FA",
  "#86D6F7",
  "#FFB07A",
  "#E7E99B",
  "#F9A8D4",
  "#A5B4FC",
  "#FCD34D",
] as const;

export function cardColor(seat: number): string {
  const index = Math.max(0, seat - 1) % CARD_PALETTE.length;
  return CARD_PALETTE[index];
}
