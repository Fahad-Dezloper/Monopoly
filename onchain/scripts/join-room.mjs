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
const { AnchorProvider, Program } = require("@coral-xyz/anchor");
const idl = require("../idl/robinverse.json");

const [codeText, name = "Guest", colour = "5"] = process.argv.slice(2);
if (!codeText) {
  console.error(
    "usage: node scripts/join-room.mjs <ROOM_CODE> [name] [colour]",
  );
  process.exit(1);
}

const base = new Connection(
  process.env.SOLANA_RPC || "https://api.devnet.solana.com",
  "confirmed",
);

const funder = Keypair.fromSecretKey(
  Uint8Array.from(
    JSON.parse(readFileSync(`${homedir()}/.config/solana/id.json`, "utf8")),
  ),
);
const guest = Keypair.generate();

const program = new Program(
  idl,
  new AnchorProvider(
    base,
    {
      publicKey: guest.publicKey,
      signTransaction: async (tx) => tx,
      signAllTransactions: async (txs) => txs,
    },
    { commitment: "confirmed" },
  ),
);

const enc = (text, len) => {
  const out = new Uint8Array(len);
  out.set(new TextEncoder().encode(text).slice(0, len));
  return Array.from(out);
};

const CODE = enc(codeText.toUpperCase(), 6);
const gamePda = PublicKey.findProgramAddressSync(
  [Buffer.from("game"), Buffer.from(CODE)],
  program.programId,
)[0];

async function send(instructions, signers) {
  const tx = new Transaction().add(...instructions);
  tx.feePayer = signers[0].publicKey;
  const { blockhash, lastValidBlockHeight } = await base.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.sign(...signers);
  const signature = await base.sendRawTransaction(tx.serialize());
  const { value } = await base.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed",
  );
  if (value.err) throw new Error(JSON.stringify(value.err));
  return signature;
}

await send(
  [
    SystemProgram.transfer({
      fromPubkey: funder.publicKey,
      toPubkey: guest.publicKey,
      lamports: 0.02 * LAMPORTS_PER_SOL,
    }),
  ],
  [funder],
);

await send(
  [
    await program.methods
      .joinGame(enc(name, 16), Number(colour))
      .accountsPartial({ player: guest.publicKey, game: gamePda })
      .instruction(),
  ],
  [guest],
);

console.log(
  `${name} joined ${codeText.toUpperCase()} as ${guest.publicKey.toBase58()}`,
);
console.log(`game account ${gamePda.toBase58()}`);
