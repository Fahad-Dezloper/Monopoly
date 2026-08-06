# RobinVerse on chain

The full Monopoly rule set as a Solana program, running on a MagicBlock
ephemeral rollup. Ported from `server/src/engine/engine.ts`.

## Why an ephemeral rollup

A turn is a burst of small writes — roll, move, buy, pay rent, build, bid —
followed by one settlement. Base-layer Solana at ~400ms per action would feel
worse than the existing polling server. An ER runs at 10–50ms.

It also closes three holes the off-chain build had:

| Problem before | Fixed by |
| --- | --- |
| Dice were `Math.random()` on the server | VRF, request → authenticated callback |
| `playerId` was client-supplied and trusted | Every action is a signed transaction |
| Turn clock was a browser timer | `Clock` checked on chain in `force_skip_turn` |

## Layout

```
programs/robinverse/src/
  board.rs    generated board constants — do not edit
  state.rs    the Game account
  engine.rs   the rules, free of syscalls so they unit-test on the host
  errors.rs   41 typed errors
  lib.rs      instructions, VRF wiring, delegation, events
  tests.rs    66 rule tests
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
cargo test --lib                       # 66 rule tests, no validator needed
cargo build-sbf --tools-version v1.54  # BPF artifact
anchor idl build > idl/robinverse.json # client IDL
node scripts/gen-board.mjs             # after editing the board dataset
```

## Transaction routing

| Flow | Where |
| --- | --- |
| `create_game`, `join_game`, `delegate_game` | Base layer |
| Everything else | Ephemeral rollup (FQDN from router `getDelegationStatus`) |
| `checkpoint`, `settle_game` | Ephemeral rollup, effects land on base |

Randomness is requested from `DEFAULT_EPHEMERAL_QUEUE` because the requests run
inside the ER. Do not hardcode a regional ER endpoint.

## Randomness is asynchronous

`start_game` and `roll_dice` only *request* randomness. The result exists after
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

## Not done yet

Integration with the web client is deliberately not started. The IDL in `idl/`
is the handoff artifact.

Deploy has not been run — the program keypair in `target/deploy/` is local only,
and the declared ID must match wherever it is deployed.
