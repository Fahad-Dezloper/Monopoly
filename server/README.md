# Robinverse Server

NestJS backend for Robinverse. **All Monopoly rules live in `src/engine/`.**

The full backend architecture (modules, request flow, Redis, AFK elimination, REST vs Socket.IO) is documented in the [root README — Backend architecture](../README.md#backend-architecture).

## Stack

- NestJS + Socket.IO (`/game`)
- Redis or in-memory rooms (`REDIS_MODE=memory|redis`)
- PostgreSQL + Prisma (guest players; optional for core play)
- Board data: `src/data/monopoly_board_game.json`

## Run

```bash
cp .env.example .env
pnpm install
pnpm start:dev
```

| URL | Purpose |
|-----|---------|
| http://localhost:4000/api/health | Health |
| http://localhost:4000/api/docs | Swagger |

Optional infra from repo root:

```bash
docker compose up -d
```

## How it works (short)

1. **`RoomsService`** owns lobby + playing state (`RoomState` in Redis/memory).
2. **`startGame` / `gameReducer`** in `src/engine/` apply every rule change.
3. Web clients **poll** `GET /api/rooms/:code` and **post** `POST /api/rooms/:code/action`.
4. Socket.IO gateway mirrors the same services but is not used by the current web client.
5. **3-minute** turn deadline → `SKIP_TURN` → player **eliminated**; last remaining player wins.

## Layout

| Path | Role |
|------|------|
| `src/engine/` | Game reducer, board, AI helpers, turn limit |
| `src/rooms/` | Create/join/start, actions, AFK elimination |
| `src/gateway/` | Socket.IO events |
| `src/game/` | Thin wrappers over rooms |
| `src/redis/` | Redis + memory fallback |
| `src/players/` | Guest profiles |

## Turn timeout

`TURN_LIMIT_MS` = **3 minutes**. Expired turns eliminate the current player (bankrupt). Last remaining player wins; otherwise the game continues.
