import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import type { GameAction, PlayerColor } from "../engine";
import { RoomsService } from "./rooms.service";

@Controller("rooms")
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @Post()
  async create(
    @Body()
    body: {
      hostId?: string;
      playerId?: string;
      username?: string;
      name?: string;
      color?: PlayerColor;
      maxPlayers?: number;
      isPrivate?: boolean;
    },
  ) {
    const hostId = body.hostId || body.playerId;
    const username = body.username || body.name || "host";
    if (!hostId) return { error: "hostId required" };
    const room = await this.rooms.create({
      hostId,
      username,
      color: body.color,
      maxPlayers: body.maxPlayers,
      isPrivate: body.isPrivate,
    });
    return { room: this.rooms.toPublic(room) };
  }

  @Get(":code")
  async get(@Param("code") code: string) {
    const room = await this.rooms.get(code);
    if (!room) throw new NotFoundException("room not found");
    return { room: this.rooms.toPublic(room) };
  }

  @Post(":code/join")
  async join(
    @Param("code") code: string,
    @Body()
    body: {
      playerId: string;
      username?: string;
      name?: string;
      color?: PlayerColor;
    },
  ) {
    const room = await this.rooms.join({
      code,
      playerId: body.playerId,
      username: body.username || body.name || "player",
      color: body.color,
    });
    return { room: this.rooms.toPublic(room) };
  }

  @Post(":code")
  async lobbyAction(
    @Param("code") code: string,
    @Body()
    body: {
      action: "join" | "leave" | "start" | "ready";
      playerId: string;
      username?: string;
      name?: string;
      color?: PlayerColor;
      ready?: boolean;
    },
  ) {
    if (body.action === "join") {
      const room = await this.rooms.join({
        code,
        playerId: body.playerId,
        username: body.username || body.name || "player",
        color: body.color,
      });
      return { room: this.rooms.toPublic(room) };
    }
    if (body.action === "leave") {
      const room = await this.rooms.leave(code, body.playerId);
      return { room: room ? this.rooms.toPublic(room) : null };
    }
    if (body.action === "start") {
      const room = await this.rooms.start(code, body.playerId);
      return { room: this.rooms.toPublic(room) };
    }
    if (body.action === "ready") {
      const room = await this.rooms.setReady(
        code,
        body.playerId,
        body.ready ?? true,
      );
      return { room: this.rooms.toPublic(room) };
    }
    return { error: "unknown action" };
  }

  @Post(":code/chat")
  async chat(
    @Param("code") code: string,
    @Body() body: { playerId: string; text: string },
  ) {
    const room = await this.rooms.postMessage(
      code,
      body.playerId,
      body.text ?? "",
    );
    return { room: this.rooms.toPublic(room) };
  }

  @Post(":code/action")
  async action(
    @Param("code") code: string,
    @Body() body: { playerId: string; gameAction: GameAction },
  ) {
    const room = await this.rooms.applyAction(
      code,
      body.playerId,
      body.gameAction,
    );
    return { room: this.rooms.toPublic(room) };
  }
}
