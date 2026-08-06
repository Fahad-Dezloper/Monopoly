import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import type { GameAction, PlayerColor } from "../engine";
import { ClientEvents, ServerEvents } from "../common/events";
import { PlayersService } from "../players/players.service";
import { RoomsService } from "../rooms/rooms.service";
import { GameService } from "../game/game.service";
import { RedisService } from "../redis/redis.service";

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:3000"],
    credentials: true,
  },
  namespace: "/game",
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly players: PlayersService,
    private readonly rooms: RoomsService,
    private readonly game: GameService,
    private readonly redis: RedisService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.debug(`connected ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    const playerId = await this.players.setOffline(client.id);
    const roomCode = await this.redis.get(`socket-room:${client.id}`);
    if (playerId && roomCode) {
      const room = await this.rooms.leave(roomCode, playerId);
      await this.redis.del(`socket-room:${client.id}`);
      if (room) {
        this.server.to(roomCode).emit(ServerEvents.PLAYER_LEFT, {
          playerId,
          room: this.rooms.toPublic(room),
        });
        this.server.to(roomCode).emit(ServerEvents.ROOM_UPDATED, this.rooms.toPublic(room));
      } else {
        this.server.to(roomCode).emit(ServerEvents.PLAYER_LEFT, { playerId, room: null });
      }
    }
    this.logger.debug(`disconnected ${client.id}`);
  }

  @SubscribeMessage(ClientEvents.PING)
  ping(@ConnectedSocket() client: Socket) {
    client.emit(ServerEvents.PONG, { t: Date.now() });
  }

  @SubscribeMessage(ClientEvents.CREATE_ROOM)
  async createRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: {
      username: string;
      playerId?: string;
      color?: PlayerColor;
      maxPlayers?: number;
    },
  ) {
    try {
      const profile = await this.players.ensureGuest(body.username, body.playerId);
      await this.players.setOnline(profile.id, client.id);

      const room = await this.rooms.create({
        hostId: profile.id,
        username: profile.username,
        color: body.color,
        maxPlayers: body.maxPlayers,
      });

      await client.join(room.code);
      await this.redis.set(`socket-room:${client.id}`, room.code, 60 * 60 * 6);

      const payload = this.rooms.toPublic(room);
      client.emit(ServerEvents.ROOM_CREATED, { player: profile, room: payload });
      return payload;
    } catch (err) {
      return this.fail(client, err);
    }
  }

  @SubscribeMessage(ClientEvents.JOIN_ROOM)
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { code: string; username: string; playerId?: string; color?: PlayerColor },
  ) {
    try {
      const profile = await this.players.ensureGuest(body.username, body.playerId);
      await this.players.setOnline(profile.id, client.id);

      const room = await this.rooms.join({
        code: body.code,
        playerId: profile.id,
        username: profile.username,
        color: body.color,
      });

      await client.join(room.code);
      await this.redis.set(`socket-room:${client.id}`, room.code, 60 * 60 * 6);

      const payload = this.rooms.toPublic(room);
      client.emit(ServerEvents.ROOM_UPDATED, payload);
      client.to(room.code).emit(ServerEvents.PLAYER_JOINED, {
        player: profile,
        room: payload,
      });
      this.server.to(room.code).emit(ServerEvents.ROOM_UPDATED, payload);
      return payload;
    } catch (err) {
      return this.fail(client, err);
    }
  }

  @SubscribeMessage(ClientEvents.LEAVE_ROOM)
  async leaveRoom(@ConnectedSocket() client: Socket) {
    try {
      const profile = await this.players.getBySocket(client.id);
      const roomCode = await this.redis.get(`socket-room:${client.id}`);
      if (!profile || !roomCode) return null;

      const room = await this.rooms.leave(roomCode, profile.id);
      await client.leave(roomCode);
      await this.redis.del(`socket-room:${client.id}`);

      if (room) {
        const payload = this.rooms.toPublic(room);
        this.server.to(roomCode).emit(ServerEvents.PLAYER_LEFT, {
          playerId: profile.id,
          room: payload,
        });
        this.server.to(roomCode).emit(ServerEvents.ROOM_UPDATED, payload);
        return payload;
      }
      this.server.to(roomCode).emit(ServerEvents.PLAYER_LEFT, {
        playerId: profile.id,
        room: null,
      });
      return null;
    } catch (err) {
      return this.fail(client, err);
    }
  }

  @SubscribeMessage(ClientEvents.READY)
  async ready(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { ready: boolean },
  ) {
    try {
      const { profile, roomCode } = await this.requireRoomPlayer(client);
      const room = await this.rooms.setReady(roomCode, profile.id, body.ready);
      const payload = this.rooms.toPublic(room);
      this.server.to(roomCode).emit(ServerEvents.ROOM_UPDATED, payload);
      return payload;
    } catch (err) {
      return this.fail(client, err);
    }
  }

  @SubscribeMessage(ClientEvents.START_GAME)
  async startGame(@ConnectedSocket() client: Socket) {
    try {
      const { profile, roomCode } = await this.requireRoomPlayer(client);
      const room = await this.rooms.start(roomCode, profile.id);
      const payload = this.rooms.toPublic(room);
      this.server.to(roomCode).emit(ServerEvents.GAME_STARTED, payload);
      this.server.to(roomCode).emit(ServerEvents.GAME_STATE, payload);
      return payload;
    } catch (err) {
      return this.fail(client, err);
    }
  }

  @SubscribeMessage(ClientEvents.ROLL_DICE)
  async roll(@ConnectedSocket() client: Socket) {
    return this.runGameAction(client, (code, id) => this.game.next(code, id));
  }

  @SubscribeMessage(ClientEvents.BUY_PROPERTY)
  async buy(@ConnectedSocket() client: Socket) {
    return this.runGameAction(client, (code, id) => this.game.buy(code, id));
  }

  @SubscribeMessage(ClientEvents.DECLINE_BUY)
  async declineBuy(@ConnectedSocket() client: Socket) {
    return this.runGameAction(client, (code, id) => this.game.declineBuy(code, id));
  }

  @SubscribeMessage(ClientEvents.END_TURN)
  async endTurn(@ConnectedSocket() client: Socket) {
    return this.runGameAction(client, (code, id) => this.game.next(code, id));
  }

  @SubscribeMessage(ClientEvents.BUILD_HOUSE)
  async buildHouse(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { propertyIndex: number },
  ) {
    return this.runGameAction(client, (code, id) =>
      this.game.buildHouse(code, id, body.propertyIndex),
    );
  }

  @SubscribeMessage(ClientEvents.GAME_ACTION)
  async genericAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { action: GameAction },
  ) {
    return this.runGameAction(client, (code, id) =>
      this.game.dispatch(code, id, body.action),
    );
  }

  @SubscribeMessage(ClientEvents.RECONNECT)
  async reconnect(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { playerId: string; code: string },
  ) {
    try {
      const profile = await this.players.get(body.playerId);
      if (!profile) throw new Error("unknown player");
      await this.players.setOnline(profile.id, client.id);
      const room = await this.rooms.get(body.code);
      if (!room) throw new Error("room not found");
      if (!room.members.some((m) => m.id === profile.id)) {
        throw new Error("not a member");
      }
      await client.join(room.code);
      await this.redis.set(`socket-room:${client.id}`, room.code, 60 * 60 * 6);
      const payload = this.rooms.toPublic(room);
      client.emit(ServerEvents.ROOM_UPDATED, payload);
      if (room.game) client.emit(ServerEvents.GAME_STATE, payload);
      return payload;
    } catch (err) {
      return this.fail(client, err);
    }
  }

  private async runGameAction(
    client: Socket,
    fn: (code: string, playerId: string) => Promise<import("../rooms/room.types").RoomState>,
  ) {
    try {
      const { profile, roomCode } = await this.requireRoomPlayer(client);
      const room = await fn(roomCode, profile.id);
      const payload = this.rooms.toPublic(room);
      this.server.to(roomCode).emit(ServerEvents.GAME_STATE, payload);
      if (room.status === "finished") {
        this.server.to(roomCode).emit(ServerEvents.GAME_OVER, payload);
      }
      return payload;
    } catch (err) {
      return this.fail(client, err);
    }
  }

  private async requireRoomPlayer(client: Socket) {
    const profile = await this.players.getBySocket(client.id);
    const roomCode = await this.redis.get(`socket-room:${client.id}`);
    if (!profile || !roomCode) throw new Error("join a room first");
    return { profile, roomCode };
  }

  private fail(client: Socket, err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    client.emit(ServerEvents.ERROR, { message });
    return { error: message };
  }
}
