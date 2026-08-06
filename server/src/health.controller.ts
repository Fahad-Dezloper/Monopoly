import { Controller, Get } from "@nestjs/common";
import { RedisService } from "./redis/redis.service";
import { PrismaService } from "./prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  check() {
    return {
      ok: true,
      service: "robinverse-server",
      redis: this.redis.mode,
      postgres: this.prisma.available ? "up" : "down",
      engine: "src/engine",
    };
  }
}
