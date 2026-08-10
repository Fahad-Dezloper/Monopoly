# Deploying RobinVerse

Two pieces, deployed independently:

| Piece     | Host   | Directory | What it does                                                               |
| --------- | ------ | --------- | -------------------------------------------------------------------------- |
| `web/`    | Vercel | `web`     | Next.js front end. Talks to Solana + MagicBlock straight from the browser. |
| `server/` | Render | `server`  | NestJS API. In on-chain mode it serves table chat and nothing else.        |

The game itself is a Solana account, so the front end works even when the API is
asleep — you just lose chat. Deploy the server first so you have its URL.

---

## 1. Server on Render

The repo ships a blueprint, so this is one step.

1. Render dashboard → **New** → **Blueprint** → select this repo.
2. It reads `render.yaml` and proposes two resources:
   - `robinverse-server` — the web service (free, Singapore, root dir `server`)
   - `robinverse-cache` — a Key Value instance (free, 25 MB)
3. It prompts for **`CORS_ORIGIN`**. You don't have the Vercel URL yet — put
   `https://localhost` for now and correct it in step 3 below.
4. Apply. First build takes a few minutes.

When it's up, check:

```
curl https://<your-service>.onrender.com/api/health
# {"ok":true,"service":"robinverse-server","redis":"redis","postgres":"down","engine":"src/engine"}
```

`"postgres":"down"` is expected and correct — see _Postgres_ below.

**Free tier spins down after 15 minutes idle**, and the next request pays a
~50 s cold start. For a live demo, hit `/api/health` a minute beforehand.

### Doing it by hand instead

If you'd rather not use the blueprint: New → Web Service, root directory
`server`, build `pnpm install --frozen-lockfile && pnpm exec prisma generate && pnpm build`,
start `node dist/main`, health check path `/api/health`. Add a Key Value
instance and set `REDIS_MODE=redis` plus `REDIS_URL` to its internal
connection string.

---

## 2. Web on Vercel

1. Vercel → **Add New** → **Project** → import this repo.
2. Set **Root Directory** to `web`. This is the one setting that matters — the
   repo root has no `package.json` and the build fails without it.
3. Framework preset should read _Next.js_. `web/vercel.json` already pins the
   install and build commands, so leave the command overrides alone.
4. Add the environment variables below, then deploy.

```
NEXT_PUBLIC_CHAIN=1
NEXT_PUBLIC_PROGRAM_ID=AyHcc7ySuwU5qfinS94CPaZKpiWCXWfFdxLtww8bupAs
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_MAGIC_ROUTER=https://devnet-router.magicblock.app/
NEXT_PUBLIC_ER_VALIDATOR=MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57
API_PROXY_TARGET=https://<your-service>.onrender.com
```

`web/.env.example` documents each one. Two things are easy to get wrong:

- **Every `NEXT_PUBLIC_*` value is inlined at build time.** Editing one in the
  dashboard does nothing until you redeploy.
- **`API_PROXY_TARGET` has no `/api` suffix and no trailing slash.** The rewrite
  in `next.config.ts` appends `/api/:path*` itself. Get it wrong and chat 404s
  while everything else keeps working, which is a confusing way to find out.

### 3. Point the server back at Vercel

Copy the Vercel domain into Render → `robinverse-server` → Environment →
`CORS_ORIGIN` (comma-separated, no trailing slash), then redeploy.

Strictly this is belt-and-braces: the browser only ever calls `/api/*` on the
Vercel origin and Vercel proxies server-to-server, so no CORS check happens. It
matters if you ever switch to `NEXT_PUBLIC_API_URL` and call Render directly.

---

## Verifying the deploy

```bash
# API is awake
curl https://<render>.onrender.com/api/health

# Chat round-trips through the Vercel proxy — this is the one call that
# crosses both hosts, so it is the one worth testing
curl -X POST https://<vercel>/api/chat/TEST123 \
  -H 'content-type: application/json' \
  -d '{"playerId":"probe","username":"probe","text":"hello"}'
curl https://<vercel>/api/chat/TEST123
```

Then open the site, create a room, and confirm the **On chain ↗** badge in the
top bar resolves to the game account on Solana Explorer.

The full suites still run against a deployed URL:

```bash
cd web && UI_URL=https://<vercel> pnpm test:ui
cd server && API_URL=https://<render> node scripts/e2e-rest.mjs
```

---

## Notes on the shape of this

**Postgres is optional and intentionally absent.** Rooms, games and chat all
live in Redis. The only thing Postgres ever held was a guest profile row, and
`PlayersService` already falls back to Redis when it isn't there. The catch was
that `new PrismaClient()` throws outright when `DATABASE_URL` is unset, which
would have killed the boot before that fallback could run — `PrismaService` now
passes a placeholder URL and skips `$connect` entirely when the variable is
missing. Add a Render Postgres and set `DATABASE_URL` if you want profiles to
survive a restart; nothing else changes.

**Why the install command is pinned in `vercel.json`.** `web/` has both a
`pnpm-lock.yaml` and an older `package-lock.json`, and Vercel picks a package
manager by sniffing for lockfiles. Pinning `pnpm install --frozen-lockfile`
removes the coin flip. Deleting the stale `package-lock.json` would fix it
properly.

**`web/.env` is not a web env file.** It is a copy of the server's `.env`, and
Next loads it during every build. It is gitignored so it won't reach Vercel, but
it holds a live-looking private key and should be deleted; `web/.env.local` is
the file the front end actually wants.

**MagicBlock validators cache the program.** They clone it on first use and keep
that copy, so a program upgrade does not propagate — transactions keep
succeeding against the old build. `NEXT_PUBLIC_ER_VALIDATOR` pins games to a
validator known to be current. After any upgrade run
`node onchain/scripts/check-er-freshness.mjs`, and once it reports every
validator current you can drop the pin and let the router choose.
