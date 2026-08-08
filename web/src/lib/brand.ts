/** Solana City — product brand (display name, SEO, assets). */

export const BRAND = {
  name: "Solana City",
  shortName: "Solana City",
  tagline: "Onchain property game",
  description:
    "Solana City is a multiplayer onchain property-trading game. Create a private lobby, roll verifiable dice, buy real-world cities, build houses, collect rent, and bankrupt your friends — powered by Solana and MagicBlock.",
  shortDescription:
    "Multiplayer onchain property wars. Roll dice, buy cities, build houses, collect rent.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://solanacity.game",
  logo: "/logo/solanacity.png",
  logoMark: "/logo/sologo.png",
  ogImage: "/landing/landing3.png",
  keywords: [
    "Solana City",
    "Solana game",
    "onchain monopoly",
    "property trading game",
    "MagicBlock",
    "multiplayer board game",
    "web3 game",
    "devnet",
  ],
} as const;
