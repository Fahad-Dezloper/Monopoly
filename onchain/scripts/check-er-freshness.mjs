/**
 * Reports which rollup validators are executing the current build.
 *
 * A validator clones the program the first time it is asked to run it and
 * caches that copy. Upgrading on the base layer does NOT push the new build
 * out: a validator that already holds the previous one keeps running it, and
 * because a delegated account can only be written on the rollup holding it,
 * games routed there silently behave like the old program.
 *
 * That failure mode is invisible — transactions succeed, they just run the
 * wrong code — so check before blaming the client.
 *
 *   node scripts/check-er-freshness.mjs
 */
import { Connection, PublicKey } from "@solana/web3.js";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const idl = require("../idl/robinverse.json");

const PROGRAM = new PublicKey(idl.address);
const SO = new URL("../target/deploy/robinverse.so", import.meta.url);

const VALIDATORS = [
  [
    "asia",
    "https://devnet-as.magicblock.app/",
    "MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57",
  ],
  [
    "europe",
    "https://devnet-eu.magicblock.app/",
    "MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e",
  ],
  [
    "usa",
    "https://devnet-us.magicblock.app/",
    "MUS3hc9TCw4cGC12vHNoYcCGzJG1txjgQLZWVoeNHNd",
  ],
];

const LOADER_V4_HEADER = 48;

const local = readFileSync(SO);
const localHash = createHash("sha256").update(local).digest("hex");

console.log(
  `local build  ${local.length} bytes  sha256 ${localHash.slice(0, 16)}`,
);
console.log(`program      ${PROGRAM.toBase58()}\n`);

const fresh = [];

for (const [region, url, identity] of VALIDATORS) {
  let status;
  try {
    const account = await new Connection(url, "confirmed").getAccountInfo(
      PROGRAM,
    );
    if (!account) {
      status = "program not cloned here yet (it will clone on first use)";
    } else {
      const elf = account.data.subarray(
        LOADER_V4_HEADER,
        LOADER_V4_HEADER + local.length,
      );
      const hash = createHash("sha256").update(elf).digest("hex");
      if (hash === localHash) {
        status = "running the current build";
        fresh.push([region, identity]);
      } else {
        status = `STALE — running ${hash.slice(0, 16)}`;
      }
    }
  } catch (cause) {
    status = `unreachable: ${cause.message.slice(0, 60)}`;
  }
  console.log(`${region.padEnd(8)} ${status}`);
}

console.log();
if (fresh.length === VALIDATORS.length) {
  console.log(
    "every validator is current — leave NEXT_PUBLIC_ER_VALIDATOR unset",
  );
  console.log("so the router can pick whichever rollup is closest.");
} else if (fresh.length > 0) {
  const [region, identity] = fresh[0];
  console.log("Some validators are stale. Pin new games to a current one:");
  console.log(`\n  NEXT_PUBLIC_ER_VALIDATOR=${identity}   # ${region}\n`);
  console.log("Unset it once the stale validators have re-cloned, so games go");
  console.log("to the nearest rollup instead of the furthest current one.");
} else {
  console.log("No validator is running this build yet. A freshly cloned one");
  console.log(
    "picks it up on first use — delegate a throwaway game to force it.",
  );
  process.exitCode = 1;
}
