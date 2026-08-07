import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
const require = createRequire(import.meta.url);
const {
  AnchorProvider,
  Program,
} = require("/Users/dezloper/Desktop/RobinVerse/onchain/node_modules/@coral-xyz/anchor");
const idl = require("/Users/dezloper/Desktop/RobinVerse/onchain/idl/robinverse.json");
const CODE_TEXT = process.argv[2];
const base = new Connection("https://api.devnet.solana.com", "confirmed");
const funder = Keypair.fromSecretKey(
  Uint8Array.from(
    JSON.parse(readFileSync(`${homedir()}/.config/solana/id.json`, "utf8")),
  ),
);
const guest = Keypair.generate();
writeFileSync("/tmp/guest.json", JSON.stringify(Array.from(guest.secretKey)));
const program = new Program(
  idl,
  new AnchorProvider(
    base,
    {
      publicKey: guest.publicKey,
      signTransaction: async (t) => t,
      signAllTransactions: async (t) => t,
    },
    { commitment: "confirmed" },
  ),
);
const enc = (t, l) => {
  const o = new Uint8Array(l);
  o.set(new TextEncoder().encode(t).slice(0, l));
  return Array.from(o);
};
const CODE = enc(CODE_TEXT, 6);
const pda = PublicKey.findProgramAddressSync(
  [Buffer.from("game"), Buffer.from(CODE)],
  program.programId,
)[0];
async function send(ixs, signers) {
  const tx = new Transaction().add(...ixs);
  tx.feePayer = signers[0].publicKey;
  const { blockhash, lastValidBlockHeight } = await base.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.sign(...signers);
  const sig = await base.sendRawTransaction(tx.serialize());
  const { value } = await base.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    "confirmed",
  );
  if (value.err) throw new Error(JSON.stringify(value.err));
  return sig;
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
      .joinGame(enc("Riya", 16), 5)
      .accountsPartial({ player: guest.publicKey, game: pda })
      .instruction(),
  ],
  [guest],
);
console.log("joined", CODE_TEXT, "as", guest.publicKey.toBase58());
