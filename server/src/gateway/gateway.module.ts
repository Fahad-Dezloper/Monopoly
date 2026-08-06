import { Module } from "@nestjs/common";
import { PlayersModule } from "../players/players.module";
import { RoomsModule } from "../rooms/rooms.module";
import { GameModule } from "../game/game.module";
import { GameGateway } from "./game.gateway";

@Module({
  imports: [PlayersModule, RoomsModule, GameModule],
  providers: [GameGateway],
})
export class GatewayModule {}
