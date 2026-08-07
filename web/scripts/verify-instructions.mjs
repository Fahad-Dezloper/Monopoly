import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const idl = require("../src/lib/chain/robinverse.json");

const EPHEMERAL_QUEUE = new PublicKey(
  "5hBR571xnXppuCPveTrctfTU7tJLSN94nq7kv7FRK5Tc",
);

const payer = Keypair.generate();
const wallet = payer.publicKey;

const provider = new AnchorProvider(
  new Connection("http://localhost:8899"),
  {
    publicKey: wallet,
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
  },
  { commitment: "confirmed" },
);

const program = new Program(idl, provider);

const CODE = Array.from(new TextEncoder().encode("ABC123"));
const NAME = Array.from({ length: 16 }, (_, i) => (i < 4 ? 65 + i : 0));
const SQUARES = Array.from({ length: 40 }, () => 0);

const game = PublicKey.findProgramAddressSync(
  [Buffer.from("game"), Buffer.from(CODE)],
  program.programId,
)[0];

const VRF = { payer: wallet, game, oracleQueue: EPHEMERAL_QUEUE };
const PLAYER = { player: wallet, game };
const PAYER = { payer: wallet, game };

const CASES = [
  ["createGame", [CODE, NAME, 3], { host: wallet }],
  ["joinGame", [NAME, 4], PLAYER],
  ["delegateGame", [CODE, null], { payer: wallet }],
  ["startGame", [7], VRF],
  ["rollDice", [7], VRF],
  ["acknowledge", [], PLAYER],
  ["buyProperty", [], PLAYER],
  ["declineProperty", [], PLAYER],
  ["endTurn", [], PLAYER],
  ["payJailFine", [], PLAYER],
  ["useJailCard", [], PLAYER],
  ["build", [1], PLAYER],
  ["sellBuilding", [1], PLAYER],
  ["mortgage", [1], PLAYER],
  ["unmortgage", [1], PLAYER],
  ["placeBid", [120], PLAYER],
  ["withdrawBid", [], PLAYER],
  ["proposeTrade", [2, 100, 0, SQUARES], PLAYER],
  ["respondToTrade", [true], PLAYER],
  ["forceSkipTurn", [], { caller: wallet, game }],
  ["resign", [], PLAYER],
  ["checkpoint", [], PAYER],
  ["settleGame", [], PAYER],
];

let failures = 0;

for (const [method, args, accounts] of CASES) {
  try {
    const ix = await program.methods[method](...args)
      .accountsPartial(accounts)
      .instruction();
    console.log(
      `ok   ${method.padEnd(16)} ${ix.keys.length} accounts, ${ix.data.length} bytes`,
    );
  } catch (cause) {
    failures += 1;
    console.error(`FAIL ${method}: ${cause.message}`);
  }
}

const declared = new Set(idl.instructions.map((ix) => ix.name));
const covered = new Set(
  CASES.map(([m]) => m.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)),
);
const clientCallable = [...declared].filter(
  (name) => !name.startsWith("callback_") && name !== "process_undelegation",
);
const missing = clientCallable.filter((name) => !covered.has(name));
if (missing.length) {
  failures += 1;
  console.error(`FAIL uncovered instructions: ${missing.join(", ")}`);
}

console.log(
  failures === 0
    ? `\nall ${CASES.length} instructions build`
    : `\n${failures} failure(s)`,
);
process.exit(failures === 0 ? 0 : 1);
