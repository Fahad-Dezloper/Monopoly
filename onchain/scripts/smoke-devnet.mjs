import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";

const require = createRequire(import.meta.url);
const { AnchorProvider, BorshCoder, Program } = require("@coral-xyz/anchor");
const idl = require("../idl/robinverse.json");

// `Program` camel-cases the IDL for its own method and account surface, so its
// coder knows the account as `game`. Decoding goes through a raw coder — the
// same one the web client uses — which keeps the account named `Game` and its
// fields in snake_case.
const coder = new BorshCoder(idl);

const BASE_RPC = process.env.SOLANA_RPC || "https://api.devnet.solana.com";
const ROUTER =
  process.env.ROUTER_ENDPOINT || "https://devnet-router.magicblock.app/";
const EPHEMERAL_QUEUE = new PublicKey(
  "5hBR571xnXppuCPveTrctfTU7tJLSN94nq7kv7FRK5Tc",
);
const KEEP = process.argv.includes("--keep");

const base = new Connection(BASE_RPC, "confirmed");

const host = Keypair.fromSecretKey(
  Uint8Array.from(
    JSON.parse(readFileSync(`${homedir()}/.config/solana/id.json`, "utf8")),
  ),
);
const guest = Keypair.generate();

const wallet = {
  publicKey: host.publicKey,
  signTransaction: async (tx) => tx,
  signAllTransactions: async (txs) => txs,
};
const program = new Program(
  idl,
  new AnchorProvider(base, wallet, { commitment: "confirmed" }),
);

const enc = (text, len) => {
  const out = new Uint8Array(len);
  out.set(new TextEncoder().encode(text).slice(0, len));
  return Array.from(out);
};

const CODE_TEXT = `T${Date.now().toString(36).slice(-5).toUpperCase()}`;
const CODE = enc(CODE_TEXT, 6);
const gamePda = PublicKey.findProgramAddressSync(
  [Buffer.from("game"), Buffer.from(CODE)],
  program.programId,
)[0];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const step = (msg) => console.log(`\n▸ ${msg}`);
const ok = (msg) => console.log(`  ✓ ${msg}`);

async function send(connection, ixs, signers) {
  const tx = new Transaction().add(...ixs);
  tx.feePayer = signers[0].publicKey;
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.sign(...signers);
  const signature = await connection.sendRawTransaction(tx.serialize());
  const { value } = await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed",
  );
  if (value.err) {
    const detail = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    const logs = detail?.meta?.logMessages ?? [];
    throw new Error(
      `transaction failed: ${JSON.stringify(value.err)}\n${logs.join("\n")}`,
    );
  }
  return signature;
}

async function showLogs(connection, signature, label) {
  const detail = await connection.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  console.log(`\n--- ${label} logs ---`);
  for (const line of detail?.meta?.logMessages ?? ["(none)"]) {
    console.log(`  ${line}`);
  }
}

async function delegationStatus(account) {
  const response = await fetch(ROUTER, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getDelegationStatus",
      params: [account.toBase58()],
    }),
  });
  const body = await response.json();
  if (body.error) throw new Error(body.error.message);
  return body.result ?? {};
}

async function readGame(connection) {
  const info = await connection.getAccountInfo(gamePda);
  if (!info) return null;
  return coder.accounts.decode("Game", info.data);
}

async function until(label, connection, check, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await readGame(connection);
    if (last && check(last)) return last;
    await sleep(1000);
  }
  throw new Error(
    `timed out waiting for ${label}` +
      (last
        ? ` (phase=${Object.keys(last.phase)[0]}, vrf_pending=${last.vrf_pending})`
        : ""),
  );
}

const ix = (method, args, accounts) =>
  program.methods[method](...args)
    .accountsPartial(accounts)
    .instruction();

console.log(`program  ${program.programId.toBase58()}`);
console.log(`host     ${host.publicKey.toBase58()}`);
console.log(`guest    ${guest.publicKey.toBase58()}`);
console.log(`room     ${CODE_TEXT}  →  ${gamePda.toBase58()}`);

step("funding the guest seat");
await send(
  base,
  [
    SystemProgram.transfer({
      fromPubkey: host.publicKey,
      toPubkey: guest.publicKey,
      lamports: 0.02 * LAMPORTS_PER_SOL,
    }),
  ],
  [host],
);
ok("guest funded");

step("create_game (base layer)");
await send(
  base,
  [
    await ix("createGame", [CODE, enc("Host", 16), 0], {
      host: host.publicKey,
    }),
  ],
  [host],
);
let game = await readGame(base);
if (game.player_count !== 1) throw new Error("host was not seated");
ok(`seated host, phase=${Object.keys(game.phase)[0]}`);

step("join_game (base layer)");
await send(
  base,
  [
    await ix("joinGame", [enc("Guest", 16), 2], {
      player: guest.publicKey,
      game: gamePda,
    }),
  ],
  [guest],
);
game = await readGame(base);
if (game.player_count !== 2) throw new Error("guest was not seated");
ok("seated guest, 2 players");

step("delegate_game (base layer)");
const pinned = process.env.VALIDATOR
  ? new PublicKey(process.env.VALIDATOR)
  : null;
await send(
  base,
  [await ix("delegateGame", [CODE, pinned], { payer: host.publicKey })],
  [host],
);
ok(
  pinned
    ? `delegated, pinned to ${pinned.toBase58()}`
    : "delegated to any validator",
);

step("router: where does the account live now?");
let status = {};
for (let i = 0; i < 30; i += 1) {
  status = await delegationStatus(gamePda);
  if (status.isDelegated) break;
  await sleep(1000);
}
if (!status.isDelegated)
  throw new Error("router never reported the delegation");
const routed = /^https?:\/\//.test(status.fqdn ?? "")
  ? status.fqdn
  : `https://${status.fqdn}`;
const endpoint = process.env.ER_ENDPOINT || routed;
ok(
  endpoint === routed
    ? `delegated to ${endpoint}`
    : `router said ${routed}, overridden to ${endpoint}`,
);

const er = new Connection(endpoint, "confirmed");
if (!(await readGame(er)))
  throw new Error("rollup cannot see the game account");
ok("rollup serves the account");

step("start_game — requests VRF, does not roll it");
const startSig = await send(
  er,
  [
    await ix("startGame", [7], {
      payer: host.publicKey,
      game: gamePda,
      oracleQueue: EPHEMERAL_QUEUE,
    }),
  ],
  [host],
);
ok("randomness requested");
if (process.env.VERBOSE) await showLogs(er, startSig, "start_game");

game = await until("the setup callback", er, (g) => !g.vrf_pending).catch(
  async (cause) => {
    await showLogs(er, startSig, "start_game");
    throw cause;
  },
);
if (Object.keys(game.phase)[0] !== "TurnStart") {
  throw new Error(`expected TurnStart, got ${Object.keys(game.phase)[0]}`);
}
const shuffled =
  game.fortune_deck.some((card, i) => card !== i) ||
  game.treasury_deck.some((card, i) => card !== i);
if (!shuffled) throw new Error("decks came back in their original order");
ok(`game started, first turn = seat ${game.turn}, decks shuffled`);

step("roll_dice — the same request/callback shape");
const turnWallet = game.players[game.turn].wallet.toBase58();
const roller = [host, guest].find((k) => k.publicKey.toBase58() === turnWallet);
if (!roller)
  throw new Error(`seat ${game.turn} belongs to neither test wallet`);
const before = game.players[game.turn].position;
await send(
  er,
  [
    await ix("rollDice", [42], {
      payer: roller.publicKey,
      game: gamePda,
      oracleQueue: EPHEMERAL_QUEUE,
    }),
  ],
  [roller],
);
ok("dice requested");

game = await until(
  "the dice callback",
  er,
  (g) => !g.vrf_pending && g.dice_rolled,
);
const { die1, die2 } = game;
if (die1 < 1 || die1 > 6 || die2 < 1 || die2 > 6) {
  throw new Error(`dice out of range: ${die1}, ${die2}`);
}
ok(
  `rolled ${die1} + ${die2}, seat ${game.turn} moved ${before} → ${game.players[game.turn].position}`,
);

step("a turn action on the rollup");
const pending = Object.keys(game.pending)[0];
if (pending === "None" && game.dice_rolled) {
  await send(
    er,
    [
      await ix("declineProperty", [], {
        player: roller.publicKey,
        game: gamePda,
      }),
    ],
    [roller],
  );
  ok("decline_property accepted by the rollup");
} else {
  ok(`skipped — a ${pending} modal is blocking, which is correct`);
}

if (KEEP) {
  console.log(`\nleft delegated: ${gamePda.toBase58()} (room ${CODE_TEXT})`);
} else {
  step("resign to game over, then settle back to the base layer");
  await send(
    er,
    [await ix("resign", [], { player: guest.publicKey, game: gamePda })],
    [guest],
  );
  game = await readGame(er);
  ok(`phase=${Object.keys(game.phase)[0]}, winner=seat ${game.winner}`);

  await send(
    er,
    [await ix("settleGame", [], { payer: host.publicKey, game: gamePda })],
    [host],
  );
  for (let i = 0; i < 30; i += 1) {
    if (!(await delegationStatus(gamePda)).isDelegated) break;
    await sleep(1000);
  }
  const settled = await readGame(base);
  if (!settled)
    throw new Error("the account did not come back to the base layer");
  ok(`undelegated; base layer shows winner=seat ${settled.winner}`);
}

console.log("\nall good — devnet + rollup + VRF are wired end to end");

const explorer = (address, cluster = "devnet") =>
  `https://explorer.solana.com/address/${address}?cluster=${cluster}`;

console.log("\nproof:");
console.log(`  program  ${explorer(program.programId.toBase58())}`);
console.log(`  game     ${explorer(gamePda.toBase58())}`);
console.log(
  `  rollup   https://explorer.solana.com/address/${gamePda.toBase58()}` +
    `?cluster=custom&customUrl=${encodeURIComponent(endpoint)}`,
);
