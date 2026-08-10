import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * Read late, not at module scope: `ConfigModule.forRoot()` loads `.env` when
 * `AppModule` is evaluated, and imports are hoisted above that, so anything
 * resolved at the top of this file sees the environment before dotenv ran.
 * The constructor runs at DI time, which is safely after.
 */
function databaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim();
  return url ? url : undefined;
}

/**
 * Postgres is optional. Rooms, games and chat all live in Redis; the only thing
 * Postgres holds is the guest-profile row in `PlayersService`, which falls back
 * to Redis when `available` is false. That makes it safe to deploy with no
 * database at all — but only if nothing throws on the way there, and
 * `new PrismaClient()` throws outright on an unset `DATABASE_URL`. Hence the
 * placeholder, which is never connected to.
 */
const ABSENT = "postgresql://localhost:5432/robinverse-absent";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly configured = !!databaseUrl();
  available = false;

  constructor() {
    super({ datasources: { db: { url: databaseUrl() ?? ABSENT } } });
  }

  async onModuleInit() {
    if (!this.configured) {
      this.logger.log("DATABASE_URL unset — profiles will live in Redis only");
      return;
    }
    try {
      await this.$connect();
      this.available = true;
      this.logger.log("PostgreSQL connected");
    } catch (err) {
      this.available = false;
      this.logger.warn(
        `PostgreSQL unavailable — running without persistence (${String(err)})`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.available) await this.$disconnect();
  }
}
