import type { ChatMessage, PublicRoom, RoomMember } from "@/lib/api/types";
import { createMockGameState } from "@/lib/mock/gameState";

export const MOCK_PLAYER_ID = "mock-you";
export const MOCK_ROOM_CODE = "R7XK42";

export const MOCK_MEMBERS: RoomMember[] = [
  {
    id: "mock-emma",
    username: "Emma",
    color: "red",
    isHost: true,
    ready: true,
    seat: 1,
    joinedAt: 1,
  },
  {
    id: "mock-liam",
    username: "Liam",
    color: "lime",
    isHost: false,
    ready: true,
    seat: 2,
    joinedAt: 2,
  },
  {
    id: MOCK_PLAYER_ID,
    username: "Olivia",
    color: "blue",
    isHost: false,
    ready: true,
    seat: 3,
    joinedAt: 3,
  },
  {
    id: "mock-noah",
    username: "Noah",
    color: "orange",
    isHost: false,
    ready: false,
    seat: 4,
    joinedAt: 4,
  },
];

export const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    playerId: "mock-emma",
    username: "Emma",
    color: "red",
    text: "who is bringing snacks",
    at: 1,
  },
  {
    id: "m2",
    playerId: MOCK_PLAYER_ID,
    username: "Olivia",
    color: "blue",
    text: "i want the top hat",
    at: 2,
  },
  {
    id: "m3",
    playerId: "mock-liam",
    username: "Liam",
    color: "lime",
    text: "trading Berlin for two hubs, any takers?",
    at: 3,
  },
  {
    id: "m4",
    playerId: "mock-noah",
    username: "Noah",
    color: "orange",
    text: "stuck in jail again 😭",
    at: 4,
  },
];

export function createMockRoom(): PublicRoom {
  return {
    code: MOCK_ROOM_CODE,
    hostId: "mock-emma",
    status: "lobby",
    maxPlayers: 6,
    isPrivate: true,
    members: MOCK_MEMBERS,
    seats: { "mock-emma": 1, "mock-liam": 2, [MOCK_PLAYER_ID]: 3, "mock-noah": 4 },
    game: createMockGameState(),
    messages: MOCK_MESSAGES,
    version: 12,
    updatedAt: Date.now(),
  };
}

export function createEmptyRoom(): PublicRoom {
  return {
    code: "------",
    hostId: MOCK_PLAYER_ID,
    status: "lobby",
    maxPlayers: 4,
    isPrivate: true,
    members: [],
    seats: {},
    game: null,
    messages: [],
    version: 0,
    updatedAt: Date.now(),
  };
}
