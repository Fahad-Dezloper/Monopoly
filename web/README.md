# Solana City (web)

Next.js client for **Solana City** — a multiplayer onchain property-trading game.

Players create or join a private lobby with a share code, roll dice, buy cities grouped by country, build houses/hotels, trade, and bankrupt rivals. Gameplay rules run on the Nest server and/or a Solana program (MagicBlock ephemeral rollups) depending on mode.

## Brand

| | |
|--|--|
| **Name** | Solana City |
| **Tagline** | Onchain property game |
| **Logo** | `public/logo/solanacity.png` |
| **Mark / favicon** | `public/logo/sologo.png` |
| **SEO** | `src/app/layout.tsx` + `src/lib/brand.ts` |

## Scripts

```bash
pnpm dev
pnpm build
pnpm gen:board
```

UI only for local server mode — rules live in `../server` or `../onchain`.
