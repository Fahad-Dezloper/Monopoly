export interface EntryPoint {
  title: string;
  body: string;
}

export const GAME_TAGLINE =
  "Buy streets, build houses, collect rent — and bankrupt everyone else at the table.";

export const GAME_POINTS: EntryPoint[] = [
  {
    title: "2–8 players",
    body: "Private rooms behind a six-character code. Only people you invite get a seat.",
  },
  {
    title: "3-minute turns",
    body: "A shot clock keeps the table moving. Run it down and you forfeit the game.",
  },
  {
    title: "Server-side rules",
    body: "Dice, rent and auctions are resolved on the server, so nobody can fake a roll.",
  },
  {
    title: "No sign-up",
    body: "Pick a display name and a token colour. That is the whole setup.",
  },
];

export const HOW_IT_WORKS: string[] = [
  "Roll two dice and move clockwise around the board.",
  "Land on an unowned street to buy it — decline and it goes to auction.",
  "Complete a colour set to double the rent, then build houses on it.",
  "Last player with money left standing wins the table.",
];
