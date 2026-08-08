import { BRAND } from "@/lib/brand";

export interface EntryPoint {
  title: string;
  body: string;
}

const ON_CHAIN = process.env.NEXT_PUBLIC_CHAIN === "1";

export const GAME_NAME = BRAND.name;

export const GAME_TAGLINE =
  "Buy streets, build houses, collect rent — and bankrupt everyone else at the table.";

export const GAME_ABOUT =
  "Solana City is a multiplayer property-trading board game set on real cities around the world. Invite friends with a room code, roll dice, claim streets, build houses and hotels, trade deals, and be the last player standing.";

const CHAIN_POINTS: EntryPoint[] = [
  {
    title: "Fully onchain rules",
    body: "Every roll, buy and trade is a signed Solana transaction on a MagicBlock rollup — fast, free to play on devnet, and hard to fake.",
  },
  {
    title: "Dice nobody can cheat",
    body: "Rolls come from a verifiable randomness oracle, not from a browser or a trusted server.",
  },
  {
    title: "2–8 players, no sign-up",
    body: "Share a six-character code. Your browser keeps a throwaway wallet — a little devnet SOL opens the table.",
  },
];

const SERVER_POINTS: EntryPoint[] = [
  {
    title: "2–8 players",
    body: "Private rooms behind a six-character code. Only people you invite get a seat.",
  },
  {
    title: "One shared rule set",
    body: "Dice, rent and auctions are resolved in one place, so nobody can fake a roll.",
  },
  {
    title: "No sign-up",
    body: "Pick a display name and a token colour. That is the whole setup.",
  },
];

export const GAME_POINTS = ON_CHAIN ? CHAIN_POINTS : SERVER_POINTS;

export const TURN_CLOCK_NOTE =
  "Turns are capped at three minutes. Run the clock down and you forfeit the game.";
