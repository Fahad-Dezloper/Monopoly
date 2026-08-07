import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  available = false;

  async onModuleInit() {
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
