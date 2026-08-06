import { randomUUID } from "node:crypto";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import {
  DEFAULT_COLORS,
  TURN_LIMIT_MS,
  gameReducer,
  isTurnExpired,
  startGame,
  type GameAction,
  type PlayerColor,
  type PlayerSetup,
} from "../engine";
import { RedisService } from "../redis/redis.service";
import {
  CHAT_LIMIT,
  CHAT_MAX_LENGTH,
  roomKey,
  type ChatMessage,
  type RoomState,
} from "./room.types";

function makeCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * (alphabet.length))];
  return out;
}

@Injectable()
export class RoomsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RoomsService.name);
  private readonly activePlaying = new Set<string>();
  private readonly chains = new Map<string, Promise<unknown>>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly redis: RedisService) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.sweepTurnTimeouts();
    }, 5000);
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private enqueue<T>(code: string, fn: () => Promise<T>): Promise<T> {
    const key = code.toUpperCase();
    const prev = this.chains.get(key) ?? Promise.resolve();
    const next = prev.then(fn, fn);
    this.chains.set(
      key,
      next.then(
        () => undefined,
        () => undefined,
      ),
    );
    return next;
  }

  private trackPlaying(room: RoomState | null) {
    if (!room) return;
    const key = room.code.toUpperCase();
    if (room.status === "playing" && room.game) this.activePlaying.add(key);
    else this.activePlaying.delete(key);
  }

  /** Apply expired turn skips; returns true if state changed. */
  private applyDeadlineIfNeeded(room: RoomState): boolean {
    if (!room.game || room.status !== "playing") return false;
    if (room.game.phase === "game_over") return false;

    // Migrate older rooms that lack a deadline
    if (!room.game.turnDeadlineAt) {
      room.game = {
        ...room.game,
        turnDeadlineAt: Date.now() + TURN_LIMIT_MS,
      };
      return true;
    }

    if (!isTurnExpired(room.game)) return false;

    let guard = 0;
    while (
      room.game &&
      room.status === "playing" &&
      room.game.phase !== "game_over" &&
      isTurnExpired(room.game) &&
      guard < room.game.playerCount + 1
    ) {
      room.game = gameReducer(room.game, { type: "SKIP_TURN" });
      guard += 1;
    }

    if (room.game.phase === "game_over") room.status = "finished";
    return true;
  }

  private async sweepTurnTimeouts() {
    for (const code of [...this.activePlaying]) {
      try {
        await this.get(code);
      } catch (err) {
        this.logger.warn(`turn sweep failed for ${code}: ${String(err)}`);
      }
    }
  }

  async get(code: string): Promise<RoomState | null> {
    return this.enqueue(code, async () => {
      const room = await this.redis.getJson<RoomState>(roomKey(code));
      if (!room) return null;
      if (this.applyDeadlineIfNeeded(room)) {
        await this.persist(room);
      } else {
        this.trackPlaying(room);
      }
      return room;
    });
  }

  async save(room: RoomState): Promise<RoomState> {
    return this.enqueue(room.code, async () => this.persist(room));
  }

  private async persist(room: RoomState): Promise<RoomState> {
    room.version += 1;
    room.updatedAt = Date.now();
    await this.redis.setJson(roomKey(room.code), room, 60 * 60 * 6);
    this.trackPlaying(room);
    return room;
  }

  async create(input: {
    hostId: string;
    username: string;
    color?: PlayerColor;
    maxPlayers?: number;
    isPrivate?: boolean;
  }): Promise<RoomState> {
    let code = makeCode();
    while (await this.redis.getJson(roomKey(code))) code = makeCode();

    const room: RoomState = {
      code,
      hostId: input.hostId,
      status: "lobby",
      maxPlayers: Math.min(8, Math.max(2, input.maxPlayers ?? 4)),
      isPrivate: input.isPrivate ?? true,
      members: [
        {
          id: input.hostId,
          username: input.username,
          color: input.color ?? "blue",
          isHost: true,
          ready: true,
          joinedAt: Date.now(),
        },
      ],
      seats: {},
      game: null,
      messages: [],
      version: 0,
      updatedAt: Date.now(),
    };
    return this.persist(room);
  }

  /** Room chat — any member may post, seated or not. */
  async postMessage(
    code: string,
    playerId: string,
    text: string,
  ): Promise<RoomState> {
    return this.enqueue(code, async () => {
      const room = await this.redis.getJson<RoomState>(roomKey(code));
      if (!room) throw new NotFoundException("room not found");

      const member = room.members.find((m) => m.id === playerId);
      if (!member) throw new ForbiddenException("not in room");

      const body = text.trim().slice(0, CHAT_MAX_LENGTH);
      if (!body) throw new BadRequestException("empty message");

      const message: ChatMessage = {
        id: randomUUID(),
        playerId,
        username: member.username,
        color: member.color,
        text: body,
        at: Date.now(),
      };
      room.messages = [...(room.messages ?? []), message].slice(-CHAT_LIMIT);
      return this.persist(room);
    });
  }

  async join(input: {
    code: string;
    playerId: string;
    username: string;
    color?: PlayerColor;
  }): Promise<RoomState> {
    return this.enqueue(input.code, async () => {
      const room = await this.redis.getJson<RoomState>(roomKey(input.code));
      if (!room) throw new NotFoundException("room not found");
      if (room.status !== "lobby") throw new BadRequestException("game already started");

      const existing = room.members.find((m) => m.id === input.playerId);
      if (existing) return room;

      if (room.members.length >= room.maxPlayers) {
        throw new BadRequestException("room is full");
      }

      const used = new Set(room.members.map((m) => m.color));
      const color =
        input.color && !used.has(input.color)
          ? input.color
          : (DEFAULT_COLORS.find((c) => !used.has(c)) as PlayerColor) ?? "red";

      room.members.push({
        id: input.playerId,
        username: input.username,
        color,
        isHost: false,
        ready: false,
        joinedAt: Date.now(),
      });
      return this.persist(room);
    });
  }

  async leave(code: string, playerId: string): Promise<RoomState | null> {
    return this.enqueue(code, async () => {
      const room = await this.redis.getJson<RoomState>(roomKey(code));
      if (!room) return null;

      room.members = room.members.filter((m) => m.id !== playerId);
      if (room.members.length === 0) {
        await this.redis.del(roomKey(code));
        this.activePlaying.delete(code.toUpperCase());
        return null;
      }

      if (room.hostId === playerId) {
        room.hostId = room.members[0].id;
        room.members[0].isHost = true;
        room.members[0].ready = true;
      }
      return this.persist(room);
    });
  }

  async setReady(code: string, playerId: string, ready: boolean): Promise<RoomState> {
    return this.enqueue(code, async () => {
      const room = await this.requireLobbyUnlocked(code);
      const member = room.members.find((m) => m.id === playerId);
      if (!member) throw new ForbiddenException("not in room");
      member.ready = ready;
      return this.persist(room);
    });
  }

  async kick(code: string, hostId: string, targetId: string): Promise<RoomState> {
    return this.enqueue(code, async () => {
      const room = await this.requireLobbyUnlocked(code);
      if (room.hostId !== hostId) throw new ForbiddenException("host only");
      if (targetId === hostId) throw new BadRequestException("cannot kick host");
      room.members = room.members.filter((m) => m.id !== targetId);
      return this.persist(room);
    });
  }

  async start(code: string, hostId: string): Promise<RoomState> {
    return this.enqueue(code, async () => {
      const room = await this.requireLobbyUnlocked(code);
      if (room.hostId !== hostId) throw new ForbiddenException("host only");
      if (room.members.length < 2) throw new BadRequestException("need at least 2 players");

      for (const m of room.members) m.ready = true;

      const setups: PlayerSetup[] = room.members.map((m) => ({
        name: m.username,
        color: m.color,
      }));

      const game = startGame(setups, { shuffle: true });
      const seats: Record<string, number> = {};

      for (const m of room.members) {
        const seat = game.players.findIndex(
          (p) => p.index > 0 && p.name === m.username && p.color === m.color,
        );
        if (seat > 0) {
          seats[m.id] = seat;
          m.seat = seat;
        }
      }

      room.seats = seats;
      room.game = game;
      room.status = "playing";
      return this.persist(room);
    });
  }

  async applyAction(
    code: string,
    playerId: string,
    action: GameAction,
  ): Promise<RoomState> {
    return this.enqueue(code, async () => {
      const room = await this.redis.getJson<RoomState>(roomKey(code));
      if (!room || !room.game) throw new NotFoundException("game not found");
      if (room.status !== "playing") throw new BadRequestException("not playing");

      this.applyDeadlineIfNeeded(room);

      if (room.game.phase === "game_over") {
        room.status = "finished";
        return this.persist(room);
      }

      // System-only action
      if (action.type === "SKIP_TURN") {
        room.game = gameReducer(room.game, action);
        if (room.game.phase === "game_over") room.status = "finished";
        return this.persist(room);
      }

      const seat = room.seats[playerId];
      if (!seat) throw new ForbiddenException("not seated");

      const turnActions = new Set([
        "NEXT",
        "BUY",
        "DECLINE_BUY",
        "PAY_JAIL_FINE",
        "USE_JAIL_CARD",
        "MORTGAGE",
        "UNMORTGAGE",
        "BUY_HOUSE",
        "SELL_HOUSE",
        "SELECT_PROPERTY",
        "SET_TAB",
        "RESIGN",
      ]);
      if (turnActions.has(action.type) && room.game.turn !== seat) {
        throw new ForbiddenException("not your turn");
      }

      room.game = gameReducer(room.game, action);
      if (room.game.phase === "game_over") room.status = "finished";
      return this.persist(room);
    });
  }

  private async requireLobbyUnlocked(code: string): Promise<RoomState> {
    const room = await this.redis.getJson<RoomState>(roomKey(code));
    if (!room) throw new NotFoundException("room not found");
    if (room.status !== "lobby") throw new BadRequestException("not in lobby");
    return room;
  }

  toPublic(room: RoomState) {
    return {
      code: room.code,
      hostId: room.hostId,
      status: room.status,
      maxPlayers: room.maxPlayers,
      isPrivate: room.isPrivate,
      members: room.members,
      seats: room.seats,
      messages: room.messages ?? [],
      version: room.version,
      updatedAt: room.updatedAt,
      game: room.game,
    };
  }
}
