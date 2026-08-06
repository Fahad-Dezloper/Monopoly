export interface HeroStat {
  icon: string;
  top: string;
  bottom: string;
  tint: string;
}

export interface HomeFeature {
  icon: string;
  title: string;
  body: string;
}

export interface HowToPlayStep {
  number: string;
  title: string;
  body: string;
}

export const HERO_STATS: HeroStat[] = [
  { icon: "👥", top: "2–8", bottom: "Players", tint: "#6c5ce7" },
  { icon: "🎲", top: "Classic", bottom: "Gameplay", tint: "#f0b429" },
  { icon: "🌍", top: "Play", bottom: "Online", tint: "#3ecf6e" },
  { icon: "⏱", top: "3-minute", bottom: "Turns", tint: "#6c5ce7" },
];

export const HOME_FEATURES: HomeFeature[] = [
  {
    icon: "🛡",
    title: "Fair play",
    body: "Dice and rules run on the server, not the browser",
  },
  {
    icon: "⚡",
    title: "Real time",
    body: "Live rooms with a shared board and table chat",
  },
  {
    icon: "🔒",
    title: "Private lobbies",
    body: "Six-character codes — only your friends get in",
  },
  {
    icon: "🚀",
    title: "No sign-up",
    body: "Pick a name, pick a colour, start rolling",
  },
];

export const HOW_TO_PLAY_STEPS: HowToPlayStep[] = [
  {
    number: "01",
    title: "Create a room",
    body: "Pick a name and colour, get a 6-character code.",
  },
  {
    number: "02",
    title: "Invite 1–7 friends",
    body: "They join with the code from any browser.",
  },
  {
    number: "03",
    title: "Roll, buy, build",
    body: "Classic rules: rent, jail, auctions, houses and hotels.",
  },
  {
    number: "04",
    title: "Beat the clock",
    body: "Three minutes a turn — go AFK and you're bankrupted.",
  },
];
