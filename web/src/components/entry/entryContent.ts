export interface EntryPoint {
  title: string;
  body: string;
}

const ON_CHAIN = process.env.NEXT_PUBLIC_CHAIN === "1";

export const GAME_TAGLINE =
  "Buy streets, build houses, collect rent — and bankrupt everyone else at the table.";

const CHAIN_POINTS: EntryPoint[] = [
  {
    title: "The rules are a Solana program",
    body: "Every roll, buy and trade is a signed transaction on a MagicBlock rollup — instant and free to play.",
  },
  {
    title: "Dice nobody can fake",
    body: "Rolls come from a verifiable randomness oracle, not from a player's browser or a server you have to trust.",
  },
  {
    title: "2–8 players, no sign-up",
    body: "Share a six-character code. Your browser keeps a throwaway key — it needs a little devnet SOL to open a table.",
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
