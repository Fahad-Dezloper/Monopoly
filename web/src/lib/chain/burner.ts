import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";

const STORAGE_KEY = "rv_burner_key";

let cached: Keypair | null = null;

function decode(raw: string): Keypair | null {
  try {
    const bytes = Uint8Array.from(JSON.parse(raw) as number[]);
    if (bytes.length !== 64) return null;
    return Keypair.fromSecretKey(bytes);
  } catch {
    return null;
  }
}

export function burnerKeypair(): Keypair {
  if (cached) return cached;
  if (typeof window === "undefined") {
    return Keypair.generate();
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  const existing = stored ? decode(stored) : null;
  if (existing) {
    cached = existing;
    return existing;
  }

  const created = Keypair.generate();
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(Array.from(created.secretKey)),
  );
  cached = created;
  return created;
}

export function resetBurner(): void {
  cached = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export const MIN_BALANCE_LAMPORTS = 0.03 * LAMPORTS_PER_SOL;

export async function topUp(
  connection: Connection,
  wallet: PublicKey,
): Promise<number> {
  const balance = await connection.getBalance(wallet);
  if (balance >= MIN_BALANCE_LAMPORTS) return balance;

  try {
    const signature = await connection.requestAirdrop(wallet, LAMPORTS_PER_SOL);
    const latest = await connection.getLatestBlockhash();
    await connection.confirmTransaction({ signature, ...latest }, "confirmed");
  } catch {}

  const after = await connection.getBalance(wallet);
  if (after < MIN_BALANCE_LAMPORTS) {
    throw new Error(
      `This browser needs devnet SOL — send ~0.05 SOL to ${wallet.toBase58()}`,
    );
  }
  return after;
}
