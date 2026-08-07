import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly memory = new Map<string, string>();
  mode: "redis" | "memory" = "memory";

  constructor(private readonly config: ConfigService) {
    const mode = this.config.get<string>("REDIS_MODE") ?? "memory";
    if (mode === "redis") {
      try {
        const url =
          this.config.get<string>("REDIS_URL") ?? "redis://localhost:6379";
        this.client = new Redis(url, {
          maxRetriesPerRequest: 1,
          lazyConnect: true,
        });
        this.client
          .connect()
          .then(() => {
            this.mode = "redis";
            this.logger.log("Redis connected");
          })
          .catch((err) => {
            this.logger.warn(
              `Redis connect failed — using memory (${String(err)})`,
            );
            this.client = null;
            this.mode = "memory";
          });
      } catch (err) {
        this.logger.warn(`Redis init failed — using memory (${String(err)})`);
        this.mode = "memory";
      }
    } else {
      this.logger.log("Using in-memory store (REDIS_MODE=memory)");
    }
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit();
  }

  async get(key: string): Promise<string | null> {
    if (this.client && this.mode === "redis") return this.client.get(key);
    return this.memory.get(key) ?? null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.client && this.mode === "redis") {
      if (ttlSeconds) await this.client.set(key, value, "EX", ttlSeconds);
      else await this.client.set(key, value);
      return;
    }
    this.memory.set(key, value);
    if (ttlSeconds) {
      setTimeout(() => this.memory.delete(key), ttlSeconds * 1000).unref?.();
    }
  }

  async del(key: string): Promise<void> {
    if (this.client && this.mode === "redis") {
      await this.client.del(key);
      return;
    }
    this.memory.delete(key);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setJson(
    key: string,
    value: unknown,
    ttlSeconds?: number,
  ): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }
}
