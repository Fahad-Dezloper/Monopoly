import { Injectable } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

export interface PlayerProfile {
  id: string;
  username: string;
  avatarUrl?: string | null;
  online: boolean;
}

@Injectable()
export class PlayersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async ensureGuest(
    username: string,
    existingId?: string,
  ): Promise<PlayerProfile> {
    const id = existingId || uuid();
    const name = username.trim().slice(0, 24) || `player-${id.slice(0, 4)}`;

    if (this.prisma.available) {
      const user = await this.prisma.user
        .upsert({
          where: { id },
          create: { id, username: `${name}-${id.slice(0, 4)}` },
          update: {},
        })
        .catch(async () => {
          return this.prisma.user.create({
            data: {
              id: uuid(),
              username: `${name}-${Date.now().toString(36)}`,
            },
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

  async get(playerId: string): Promise<PlayerProfile | null> {
    return this.redis.getJson<PlayerProfile>(`player:${playerId}`);
  }
}
