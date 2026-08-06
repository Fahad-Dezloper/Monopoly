import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { PlayersService } from "./players.service";

@Controller("players")
export class PlayersController {
  constructor(private readonly players: PlayersService) {}

  @Post("guest")
  createGuest(@Body() body: { username?: string; playerId?: string }) {
    return this.players.ensureGuest(body.username ?? "guest", body.playerId);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.players.get(id);
  }
}
