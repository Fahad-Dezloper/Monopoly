import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { PlayersModule } from "./players/players.module";
import { RoomsModule } from "./rooms/rooms.module";
import { GameModule } from "./game/game.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    PlayersModule,
    RoomsModule,
    GameModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
