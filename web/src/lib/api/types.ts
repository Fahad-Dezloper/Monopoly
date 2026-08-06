import type { GameState, PlayerColor } from "@/lib/monopoly/types";

export interface RoomMember {
  id: string;
  username: string;
  name?: string;
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

export interface PublicRoom {
  code: string;
  hostId: string;
  status: "lobby" | "playing" | "finished";
  maxPlayers: number;
  isPrivate?: boolean;
  members: RoomMember[];
  seats: Record<string, number>;
  game: GameState | null;
  messages?: ChatMessage[];
  version: number;
  updatedAt: number;
}

export function memberLabel(m: RoomMember): string {
  return m.username || m.name || "player";
}
