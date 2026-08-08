import { PublicKey } from "@solana/web3.js";

import idl from "@/lib/chain/robinverse.json";

export const CHAIN_ENABLED = process.env.NEXT_PUBLIC_CHAIN === "1";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || idl.address,
);

export const BASE_RPC =
  process.env.NEXT_PUBLIC_SOLANA_RPC || "https://rpc.magicblock.app/devnet";

export const ROUTER_ENDPOINT =
  process.env.NEXT_PUBLIC_MAGIC_ROUTER ||
  "https://devnet-router.magicblock.app/";

export const FALLBACK_ER_ENDPOINT =
  process.env.NEXT_PUBLIC_EPHEMERAL_RPC || "https://devnet-as.magicblock.app/";

export const EPHEMERAL_QUEUE = new PublicKey(
  "5hBR571xnXppuCPveTrctfTU7tJLSN94nq7kv7FRK5Tc",
);

/**
 * Pins new games to one rollup validator instead of the closest. Normally
 * unset. Set it after a program upgrade: a validator that already clones the
 * program keeps executing the previous build, and a delegated account can only
 * be written on the rollup holding it, so the choice is made at delegation time.
 * `node onchain/scripts/check-er-freshness.mjs` prints the identity to use.
 */
export const PINNED_VALIDATOR = process.env.NEXT_PUBLIC_ER_VALIDATOR
  ? new PublicKey(process.env.NEXT_PUBLIC_ER_VALIDATOR)
  : null;

export const GAME_SEED = "game";

export const NAME_LEN = 16;

export const CODE_LEN = 6;

export const BANK = 0;

/**
 * Rollup transactions are not on Solana's public clusters — they run on the
 * validator holding the delegated account, so the explorer has to be pointed at
 * that RPC. Base-layer transactions use the normal cluster.
 */
export function explorerTxUrl(signature: string, endpoint?: string): string {
  const base = `https://explorer.solana.com/tx/${signature}`;
  if (!endpoint || endpoint === BASE_RPC) return `${base}?cluster=devnet`;
  return `${base}?cluster=custom&customUrl=${encodeURIComponent(endpoint)}`;
}

export function explorerAddressUrl(address: string, endpoint?: string): string {
  const base = `https://explorer.solana.com/address/${address}`;
  if (!endpoint || endpoint === BASE_RPC) return `${base}?cluster=devnet`;
  return `${base}?cluster=custom&customUrl=${encodeURIComponent(endpoint)}`;
}
