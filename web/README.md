# Robinverse Web

Next.js frontend for Robinverse. UI only — game rules run on the Nest server.

See the [root README](../README.md) for full project setup.

## Run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

- `/` — landing  
- `/play` — create / join / game  

API calls go to `/api/*`, rewritten to the Nest server (`API_PROXY_TARGET`, default `http://localhost:4000`).

## Layout

| Path | Role |
|------|------|
| `src/app/` | Routes (`/`, `/play`) |
| `src/components/monopoly/` | Board, lobby, dice, controls, landing |
| `src/hooks/useMultiplayer.ts` | REST create/join/action + polling |
| `src/lib/monopoly/` | Shared types + action payload types |
| `src/app/globals.css` | Board / landing styles |

## Notes

- Multiplayer sync is ~800ms HTTP polling (Socket.IO exists on the server but is not wired in the client yet)
- Board center shows 3D dice, turn status, countdown, and a fading event log
