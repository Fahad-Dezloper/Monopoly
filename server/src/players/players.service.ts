import { Injectable } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

export interface PlayerProfile {
  id: string;
  username: string;
  avatarUrl?: string | null;
  online: boolean;
  socketId?: string;
}

@Injectable()
export class PlayersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Guest / quick-play identity (no auth yet). */
  async ensureGuest(username: string, existingId?: string): Promise<PlayerProfile> {
    const id = existingId || uuid();
    const name = username.trim().slice(0, 24) || `player-${id.slice(0, 4)}`;

    if (this.prisma.available) {
      const user = await this.prisma.user.upsert({
        where: { id },
        create: { id, username: `${name}-${id.slice(0, 4)}` },
        update: {},
      }).catch(async () => {
        // username collision — create with unique suffix
        return this.prisma.user.create({
          data: { id: uuid(), username: `${name}-${Date.now().toString(36)}` },
        });
      });
      const profile: PlayerProfile = {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        online: true,
      };
      await this.redis.setJson(`player:${profile.id}`, profile, 60 * 60 * 24);
      return profile;
    }

    const profile: PlayerProfile = { id, username: name, online: true };
    await this.redis.setJson(`player:${id}`, profile, 60 * 60 * 24);
    return profile;
  }

  async setOnline(playerId: string, socketId: string): Promise<void> {
    const p = (await this.redis.getJson<PlayerProfile>(`player:${playerId}`)) ?? {
      id: playerId,
      username: playerId.slice(0, 8),
      online: true,
    };
    p.online = true;
    p.socketId = socketId;
    await this.redis.setJson(`player:${playerId}`, p, 60 * 60 * 24);
    await this.redis.set(`socket:${socketId}`, playerId, 60 * 60 * 24);
  }

  async setOffline(socketId: string): Promise<string | null> {
    const playerId = await this.redis.get(`socket:${socketId}`);
    if (!playerId) return null;
    const p = await this.redis.getJson<PlayerProfile>(`player:${playerId}`);
    if (p) {
      p.online = false;
      p.socketId = undefined;
      await this.redis.setJson(`player:${playerId}`, p, 60 * 60 * 24);
    }
    await this.redis.del(`socket:${socketId}`);
    return playerId;
  }

  async getBySocket(socketId: string): Promise<PlayerProfile | null> {
    const playerId = await this.redis.get(`socket:${socketId}`);
    if (!playerId) return null;
    return this.redis.getJson<PlayerProfile>(`player:${playerId}`);
  }

  async get(playerId: string): Promise<PlayerProfile | null> {
    return this.redis.getJson<PlayerProfile>(`player:${playerId}`);
  }
}
