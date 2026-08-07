/**
 * Round-trips a Game account through Anchor's coder and asserts the field
 * names the client actually reads.
 *
 * `src/lib/chain/types.ts` claims struct fields stay snake_case and enums
 * arrive keyed by their PascalCase Rust variant. That claim is load-bearing
 * for every mapping in `decode.ts`, so it is checked rather than assumed.
 *
 *   node scripts/verify-account-shape.mjs
 */
import { Keypair } from "@solana/web3.js";
import { createRequire } from "node:module";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { BN, BorshCoder } = require("@coral-xyz/anchor");
const idl = require("../src/lib/chain/robinverse.json");

const coder = new BorshCoder(idl);

const player = (seat) => ({
  wallet: Keypair.generate().publicKey,
  name: Array.from({ length: 16 }, (_, i) => (i === 0 ? 80 + seat : 0)),
  color: seat,
  cash: new BN(1500 - seat),
  position: seat * 3,
  creditor: 0,
  in_jail: seat === 2,
  jail_rolls: seat,
  fortune_jail_card: false,
  treasury_jail_card: seat === 1,
  bidding: true,
  active: seat <= 2,
});

const square = (index) => ({
  owner: index % 3,
  houses: index % 5,
  hotel: index === 7,
  mortgaged: index === 9,
  land_count: index,
});

const game = {
  code: Array.from(new TextEncoder().encode("ABC123")),
  host: Keypair.generate().publicKey,
  bump: 254,
  phase: { Rolled: {} },
  player_count: 2,
  turn: 1,
  double_count: 1,
  die1: 4,
  die2: 4,
  dice_rolled: true,
  winner: 0,
  houses_available: 30,
  hotels_available: 11,
  turn_deadline: new BN(1_800_000_000),
  pending: { Card: { fortune: true, index: 6 } },
  players: Array.from({ length: 9 }, (_, i) => player(i)),
  squares: Array.from({ length: 40 }, (_, i) => square(i)),
  fortune_deck: Array.from({ length: 16 }, (_, i) => 15 - i),
  fortune_index: 3,
  treasury_deck: Array.from({ length: 16 }, (_, i) => i),
  treasury_index: 2,
  auction_queue: Array.from({ length: 40 }, () => 0),
  auction_queue_len: 0,
  auction: {
    active: true,
    square: 5,
    highest_bid: 120,
    highest_bidder: 2,
    current_bidder: 1,
  },
  trade: {
    active: true,
    initiator: 1,
    recipient: 2,
    initiator_cash: 50,
    recipient_cash: 0,
    squares: Array.from({ length: 40 }, (_, i) =>
      i === 1 ? 1 : i === 3 ? 2 : 0,
    ),
    awaiting_response: true,
  },
  vrf_nonce: new BN(9),
  vrf_pending: false,
  vrf_purpose: { None: {} },
};

const { discriminator, layout } = coder.accounts.accountLayouts.get("Game");
const scratch = Buffer.alloc(8192);
const written = layout.encode(game, scratch);
const encoded = Buffer.concat([
  Buffer.from(discriminator),
  scratch.subarray(0, written),
]);

const decoded = coder.accounts.decode("Game", encoded);

// Struct fields keep the IDL's snake_case.
for (const field of [
  "player_count",
  "dice_rolled",
  "houses_available",
  "auction_queue_len",
  "vrf_pending",
]) {
  assert.ok(field in decoded, `missing snake_case field: ${field}`);
}
assert.ok(!("playerCount" in decoded), "fields were camelCased after all");

assert.deepEqual(Object.keys(decoded.phase), ["Rolled"]);
assert.deepEqual(Object.keys(decoded.pending), ["Card"]);
assert.equal(decoded.pending.Card.fortune, true);
assert.equal(decoded.pending.Card.index, 6);
assert.deepEqual(Object.keys(decoded.vrf_purpose), ["None"]);

assert.equal(decoded.player_count, 2);
assert.equal(decoded.players[1].cash.toNumber(), 1499);
assert.equal(decoded.players[1].treasury_jail_card, true);
assert.equal(decoded.players[2].in_jail, true);
assert.equal(decoded.players[3].active, false);
assert.equal(decoded.squares[7].hotel, true);
assert.equal(decoded.squares[9].mortgaged, true);
assert.equal(decoded.squares[12].land_count, 12);
assert.equal(decoded.auction.highest_bid, 120);
assert.equal(decoded.trade.squares[1], 1);
assert.equal(decoded.trade.squares[3], 2);
assert.equal(decoded.turn_deadline.toNumber(), 1_800_000_000);
assert.equal(new TextDecoder().decode(Uint8Array.from(decoded.code)), "ABC123");

assert.ok(encoded.length < 4096, `account grew to ${encoded.length} bytes`);

console.log(
  `Game account round-trips: ${encoded.length} bytes, shape as declared`,
);
