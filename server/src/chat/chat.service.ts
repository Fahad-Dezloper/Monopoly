import { BadRequestException, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { RedisService } from "../redis/redis.service";

export interface TableMessage {
  id: string;
  playerId: string;
  username: string;
  color: string;
  text: string;
  at: number;
}

const MAX_MESSAGES = 80;
const MAX_LENGTH = 240;
const TTL_SECONDS = 60 * 60 * 6;

const key = (code: string) => `table-chat:${code.toUpperCase()}`;

/**
 * Table chat keyed by room code, with no room of its own.
 *
 * On-chain games have no server-side room to hang messages off — the game lives
 * in a Solana account. Chat is table talk rather than game state, so it does not
 * belong on chain either: it would cost account space and a transaction per
 * line. This keeps it in Redis, addressed only by the code both players already
 * share, which works for the REST game and the on-chain game alike.
 */
@Injectable()
export class ChatService {
  constructor(private readonly redis: RedisService) {}

  async list(code: string): Promise<TableMessage[]> {
    return (await this.redis.getJson<TableMessage[]>(key(code))) ?? [];
  }

  async post(
    code: string,
    input: {
      playerId: string;
      username?: string;
      color?: string;
      text: string;
    },
  ): Promise<TableMessage[]> {
    const body = (input.text ?? "").trim().slice(0, MAX_LENGTH);
    if (!body) throw new BadRequestException("empty message");
    if (!input.playerId) throw new BadRequestException("missing playerId");

    const messages = await this.list(code);
    messages.push({
      id: randomUUID(),
      playerId: input.playerId,
      username: (input.username || "player").slice(0, 24),
      color: input.color || "blue",
      text: body,
      at: Date.now(),
    });

    const capped = messages.slice(-MAX_MESSAGES);
    await this.redis.setJson(key(code), capped, TTL_SECONDS);
    return capped;
  }
}
