# RobinVerse on chain

The full Monopoly rule set as a Solana program, running on a MagicBlock
ephemeral rollup. Ported from `server/src/engine/engine.ts`.

## Why an ephemeral rollup

A turn is a burst of small writes — roll, move, buy, pay rent, build, bid —
followed by one settlement. Base-layer Solana at ~400ms per action would feel
worse than the existing polling server. An ER runs at 10–50ms.

It also closes three holes the off-chain build had:

| Problem before                             | Fixed by                                      |
| ------------------------------------------ | --------------------------------------------- |
| Dice were `Math.random()` on the server    | VRF, request → authenticated callback         |
| `playerId` was client-supplied and trusted | Every action is a signed transaction          |
| Turn clock was a browser timer             | `Clock` checked on chain in `force_skip_turn` |

## Layout

```
programs/robinverse/src/
  board.rs    generated board constants — do not edit
  state.rs    the Game account
  engine.rs   the rules, free of syscalls so they unit-test on the host
  errors.rs   43 typed errors
  lib.rs      instructions, VRF wiring, delegation, events
  tests.rs    70 rule tests
scripts/gen-board.mjs   regenerates board.rs from the shared JSON dataset
```

Static board data — names, prices, rent tables, group membership, mortgage
values — is a compile-time `const`, not per-game account bytes. Only the five
mutable fields per square are stored. That is what keeps the whole game in a
**single 1038-byte account**, which in turn means one delegation and no ER
endpoint co-location problem.

Seat 0 is a bank sentinel and real seats are 1..=8, mirroring the TypeScript
engine so the port stays close to the original rather than re-deriving it.

## Build and test

Requires **platform-tools v1.54 or newer**. Earlier versions ship cargo 1.84,
which cannot parse the edition-2024 manifests several Solana crates now use.

```bash
cargo test --lib                       # 70 rule tests, no validator needed
cargo build-sbf --tools-version v1.54  # BPF artifact
anchor idl build > idl/robinverse.json # client IDL
node scripts/gen-board.mjs             # after editing the board dataset
```

After regenerating the IDL, sync and re-check the client:

```bash
cd ../web
pnpm sync:idl        # copy the IDL into the web bundle
pnpm verify:chain    # build every instruction and round-trip the account
```

## Transaction routing

| Flow                                        | Where                                                     |
| ------------------------------------------- | --------------------------------------------------------- |
| `create_game`, `join_game`, `delegate_game` | Base layer                                                |
| Everything else                             | Ephemeral rollup (FQDN from router `getDelegationStatus`) |
| `checkpoint`, `settle_game`                 | Ephemeral rollup, effects land on base                    |

Randomness is requested from `DEFAULT_EPHEMERAL_QUEUE` because the requests run
inside the ER. Do not hardcode a regional ER endpoint.

## Randomness is asynchronous

`start_game` and `roll_dice` only _request_ randomness. The result exists after
`callback_start` / `callback_roll` lands as a separate transaction. Each request
bumps `vrf_nonce`, and the callback checks nonce and purpose before applying, so
a stale or duplicate callback cannot advance the game twice.

Clients must show a real pending state, not a spinner that assumes success, and
need a timeout path for a callback that never arrives.

## Settlement

Every delegated account gets a small number of sponsored base-layer commits, and
a Monopoly game runs long. So `checkpoint` is deliberately not called per turn —
commit at bankruptcies and at game over via `settle_game`, which commits and
undelegates together.

Between commits the authoritative state lives in the ER. For a play-money game
that is the accepted trade; with real stakes it would need re-delegation or a
fee-vault sponsor to raise the quota.

## Known deviations from the off-chain engine

- **Jail has explicit instructions.** `pay_jail_fine` and `use_jail_card` exist
  because the UI has always offered both; without them a held Get Out of Jail
  Free card would be dead state. Spent cards are not pushed back onto a deck —
  decks here are a fixed permutation walked with a wrapping cursor, so the card
  comes round again by construction.
- **Fortune cards 1, 2 and 12** referenced "Grand Promenade" and "Pacifica",
  which do not exist in the Meridia dataset, so they silently did nothing. They
  now resolve to the equivalent classic-board positions: square 39 and 24.
- **AI players are gone.** Bot logic does not belong on chain.
- **Alerts are events, not state.** The client rebuilds the feed from the 16
  emitted events instead of storing 80 strings per game.
- **UI-only fields dropped:** `controlTab`, `nextButtonLabel`, `landedMessage`,
  `selectedProperty`, `showStats`. All derivable client-side.
- **Eliminated players** carry an `active: bool` rather than the sentinel
  `money = -Infinity` the TypeScript used.

## The web client

`web/src/lib/chain/` is the adapter. `useOnchainGame` exposes exactly the
surface `useMultiplayer` does, so `RobinverseApp` picks one at build time and
no screen below it knows the difference.

```
client.ts    connections, routing, signing, account reads
decode.ts    the Game account projected onto the UI's GameState
dispatch.ts  a UI action mapped to one program instruction
events.ts    the activity feed, rebuilt from emitted events
burner.ts    the browser's hot keypair
```

Turn it on with `NEXT_PUBLIC_CHAIN=1`:

| Variable                    | Default                                 |
| --------------------------- | --------------------------------------- |
| `NEXT_PUBLIC_CHAIN`         | unset (the REST server stays in charge) |
| `NEXT_PUBLIC_PROGRAM_ID`    | the ID declared in the IDL              |
| `NEXT_PUBLIC_SOLANA_RPC`    | `https://rpc.magicblock.app/devnet`     |
| `NEXT_PUBLIC_MAGIC_ROUTER`  | `https://devnet-router.magicblock.app/` |
| `NEXT_PUBLIC_EPHEMERAL_RPC` | `https://devnet-as.magicblock.app/`     |

### Why a burner keypair

Play money, so nothing of value is at risk, and no wallet popup on any turn.
That also makes session keys redundant here — a session key exists to avoid the
popup a burner never shows. If real stakes ever land, the burner becomes a
session key delegated from a real wallet, and only `burner.ts` changes.

### What stays off chain

Chat, the selected tile, and an unsent trade draft. None of them are shared
truth, and all of them would cost account space and a transaction per keystroke.

## Deployment

Live on devnet.

|                   |                                                |
| ----------------- | ---------------------------------------------- |
| Program           | `AyHcc7ySuwU5qfinS94CPaZKpiWCXWfFdxLtww8bupAs` |
| Upgrade authority | `5zSYW6Ux5YXnMbDo1GujspHzVR3jAdvfib59WiC69BZQ` |
| Allocated         | 500,000 bytes (~37KB of upgrade headroom)      |

```bash
solana program deploy target/deploy/robinverse.so \
  --program-id target/deploy/robinverse-keypair.json \
  --max-len 500000 --url https://api.devnet.solana.com
```

`--max-len` is deliberate. The default allocates twice the binary and costs
~6.4 SOL of rent; the explicit length costs ~3.5. Growing past it later needs
`solana program extend`, which is cheap. An _upgrade_ needs ~3.2 SOL free for a
temporary buffer, refunded when it completes.

Verify end to end against devnet and a live rollup — this covers what no offline
check can, namely that delegation lands, the router names a validator, and the
VRF oracle answers:

```bash
node scripts/smoke-devnet.mjs           # create → join → delegate → VRF → settle
node scripts/join-room.mjs <CODE>       # seat an extra player in a browser table
```

## Upgrades do not reach a rollup that already cloned the program

A validator clones the program the first time it runs it and caches that copy.
Deploying a new build on the base layer does **not** push it out: a validator
holding the previous one keeps executing it, and since a delegated account can
only be written on the rollup that holds it, games routed there quietly run the
old code. Transactions succeed. They just do the wrong thing.

This is not hypothetical — it is exactly how the VRF nonce fix appeared not to
work, for two deploys running, until the executables were hashed side by side.

```bash
node scripts/check-er-freshness.mjs
```

That compares each validator's executable against the local build and, if any
are stale, prints the `NEXT_PUBLIC_ER_VALIDATOR` line to pin new games to a
current one. `delegate_game` takes that identity, because delegation time is the
only moment the choice can be made. Unset it once every validator is current, so
games go to the nearest rollup rather than the furthest correct one.

| Region        | Identity                                      |
| ------------- | --------------------------------------------- |
| devnet asia   | `MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57` |
| devnet europe | `MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e` |
| devnet usa    | `MUS3hc9TCw4cGC12vHNoYcCGzJG1txjgQLZWVoeNHNd` |

## Funding a player

Rollup transactions are free, but creating, joining and delegating happen on the
base layer. A browser's burner needs roughly 0.05 SOL of devnet SOL; it tries an
airdrop first and, when the faucet refuses, shows its own address so somebody
can top it up.
