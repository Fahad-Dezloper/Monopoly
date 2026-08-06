import type { GameState, PlayerColor } from "../engine";

export interface RoomMemberState {
  id: string;
  username: string;
  color: PlayerColor;
  isHost: boolean;
  ready: boolean;
  seat?: number;
  joinedAt: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  username: string;
  color: PlayerColor;
  text: string;
  at: number;
}

/** Keep the room payload small — chat is a rolling window, not history. */
export const CHAT_LIMIT = 60;
export const CHAT_MAX_LENGTH = 240;

export interface RoomState {
  code: string;
  hostId: string;
  status: "lobby" | "playing" | "finished";
  maxPlayers: number;
  isPrivate: boolean;
  members: RoomMemberState[];
  /** memberId -> seat (1..n) after start */
  seats: Record<string, number>;
  game: GameState | null;
  messages: ChatMessage[];
  version: number;
  updatedAt: number;
}

export function roomKey(code: string): string {
  return `room:${code.toUpperCase()}`;
}
