import {
  AnchorProvider,
  BorshCoder,
  Program,
  type Idl,
} from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
  type AccountInfo,
  type TransactionInstruction,
} from "@solana/web3.js";
import { Buffer } from "buffer";

import { burnerKeypair } from "@/lib/chain/burner";
import {
  BASE_RPC,
  CODE_LEN,
  FALLBACK_ER_ENDPOINT,
  GAME_SEED,
  NAME_LEN,
  PROGRAM_ID,
  ROUTER_ENDPOINT,
} from "@/lib/chain/config";
import rawIdl from "@/lib/chain/robinverse.json";
import type { OnchainGame } from "@/lib/chain/types";

if (typeof globalThis.Buffer === "undefined") {
  (globalThis as { Buffer?: typeof Buffer }).Buffer = Buffer;
}

const IDL = rawIdl as unknown as Idl;

interface IxBuilder {
  accountsPartial(accounts: Record<string, PublicKey>): IxBuilder;
  instruction(): Promise<TransactionInstruction>;
}
type Methods = Record<string, (...args: unknown[]) => IxBuilder>;

export type Lane = "base" | "er";

export interface Route {
  delegated: boolean;
  endpoint: string;
  connection: Connection;
}

export function codeBytes(code: string): number[] {
  const bytes = new Uint8Array(CODE_LEN);
  const text = new TextEncoder().encode(code.toUpperCase().slice(0, CODE_LEN));
  bytes.set(text);
  return Array.from(bytes);
}

export function nameBytes(name: string): number[] {
  const bytes = new Uint8Array(NAME_LEN);
  bytes.set(new TextEncoder().encode(name).slice(0, NAME_LEN));
  return Array.from(bytes);
}

export function decodeName(bytes: number[]): string {
  const end = bytes.indexOf(0);
  const slice = end === -1 ? bytes : bytes.slice(0, end);
  return new TextDecoder().decode(Uint8Array.from(slice));
}

export function decodeCode(bytes: number[]): string {
  return decodeName(bytes);
}

class BurnerWallet {
  constructor(readonly payer: Keypair) {}

  get publicKey(): PublicKey {
    return this.payer.publicKey;
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    tx: T,
  ): Promise<T> {
    if (tx instanceof VersionedTransaction) tx.sign([this.payer]);
    else tx.partialSign(this.payer);
    return tx;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    txs: T[],
  ): Promise<T[]> {
    return Promise.all(txs.map((tx) => this.signTransaction(tx)));
  }
}

export class RobinverseChain {
  readonly base: Connection;
  readonly keypair: Keypair;
  readonly program: Program<Idl>;
  readonly coder: BorshCoder;

  private routes = new Map<string, Route>();
  private erConnections = new Map<string, Connection>();

  constructor() {
    this.base = new Connection(BASE_RPC, "confirmed");
    this.keypair = burnerKeypair();

    const provider = new AnchorProvider(
      this.base,
      new BurnerWallet(this.keypair),
      { commitment: "confirmed" },
    );
    this.program = new Program(IDL, provider);
    this.coder = new BorshCoder(IDL);
  }

  get wallet(): PublicKey {
    return this.keypair.publicKey;
  }

  get methods(): Methods {
    return this.program.methods as unknown as Methods;
  }

  gamePda(code: string): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(GAME_SEED), Buffer.from(codeBytes(code))],
      PROGRAM_ID,
    )[0];
  }

  async resolveRoute(game: PublicKey, refresh = false): Promise<Route> {
    const key = game.toBase58();
    const cachedRoute = this.routes.get(key);
    if (cachedRoute && !refresh) return cachedRoute;

    let delegated = false;
    let fqdn: string | undefined;

    try {
      const response = await fetch(ROUTER_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getDelegationStatus",
          params: [key],
        }),
      });
      const body = (await response.json()) as {
        result?: { isDelegated?: boolean; fqdn?: string };
        error?: { message?: string };
      };
      if (!body.error) {
        delegated = body.result?.isDelegated === true;
        fqdn = body.result?.fqdn;
      }
    } catch {}

    const endpoint = delegated
      ? (normaliseEndpoint(fqdn) ?? FALLBACK_ER_ENDPOINT)
      : BASE_RPC;

    const route: Route = {
      delegated,
      endpoint,
      connection: delegated ? this.erConnection(endpoint) : this.base,
    };
    this.routes.set(key, route);
    return route;
  }

  private erConnection(endpoint: string): Connection {
    const existing = this.erConnections.get(endpoint);
    if (existing) return existing;
    const created = new Connection(endpoint, {
      commitment: "confirmed",
      wsEndpoint: endpoint.replace(/^http/, "ws"),
    });
    this.erConnections.set(endpoint, created);
    return created;
  }

  forgetRoute(game: PublicKey): void {
    this.routes.delete(game.toBase58());
  }

  async send(
    instructions: TransactionInstruction[],
    connection: Connection,
  ): Promise<string> {
    const tx = new Transaction().add(...instructions);
    tx.feePayer = this.wallet;
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.sign(this.keypair);

    const signature = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
    });
    await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed",
    );
    return signature;
  }

  sendBase(instructions: TransactionInstruction[]): Promise<string> {
    return this.send(instructions, this.base);
  }

  async sendRouted(
    game: PublicKey,
    instructions: TransactionInstruction[],
  ): Promise<string> {
    const route = await this.resolveRoute(game);
    return this.send(instructions, route.connection);
  }

  decodeGame(info: AccountInfo<Buffer> | null): OnchainGame | null {
    if (!info?.data?.length) return null;
    try {
      return this.coder.accounts.decode<OnchainGame>("Game", info.data);
    } catch {
      return null;
    }
  }

  async fetchGame(game: PublicKey): Promise<OnchainGame | null> {
    const route = await this.resolveRoute(game);
    const info = await route.connection.getAccountInfo(game);
    return this.decodeGame(info);
  }

  async watchGame(
    game: PublicKey,
    onChange: (state: OnchainGame | null) => void,
  ): Promise<() => void> {
    const route = await this.resolveRoute(game);
    let closed = false;

    const id = route.connection.onAccountChange(
      game,
      (info) => {
        if (!closed) onChange(this.decodeGame(info));
      },
      { commitment: "confirmed" },
    );

    const poll = setInterval(() => {
      void route.connection
        .getAccountInfo(game)
        .then((info) => {
          if (!closed) onChange(this.decodeGame(info));
        })
        .catch(() => undefined);
    }, 3000);

    void route.connection
      .getAccountInfo(game)
      .then((info) => {
        if (!closed) onChange(this.decodeGame(info));
      })
      .catch(() => undefined);

    return () => {
      closed = true;
      clearInterval(poll);
      void route.connection
        .removeAccountChangeListener(id)
        .catch(() => undefined);
    };
  }
}

function normaliseEndpoint(fqdn?: string): string | null {
  if (!fqdn) return null;
  const trimmed = fqdn.trim();
  if (!trimmed) return null;
  return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
}

let singleton: RobinverseChain | null = null;

export function chain(): RobinverseChain {
  if (!singleton) singleton = new RobinverseChain();
  return singleton;
}
