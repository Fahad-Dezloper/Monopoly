"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PublicRoom } from "@/lib/api/types";
import type { GameAction } from "@/lib/monopoly/engine";
import type { PlayerColor } from "@/lib/monopoly/types";

const PLAYER_KEY = "monopoly_player_id";
const POLL_MS = 800;

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "/api"
).replace(/\/$/, "");

export type LobbyView = "home" | "lobby" | "playing";

interface RoomResponse {
  room?: PublicRoom;
  error?: string;
  message?: string | string[];
}

function getOrCreatePlayerId(): string {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem(PLAYER_KEY);
  if (existing) return existing;

  const created =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `p_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  localStorage.setItem(PLAYER_KEY, created);
  return created;
}

function errorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const payload = data as { message?: string | string[]; error?: string };
  if (Array.isArray(payload.message)) return payload.message[0] || fallback;
  if (typeof payload.message === "string" && payload.message) {
    return payload.message;
  }
  if (
    typeof payload.error === "string" &&
    payload.error &&
    payload.error !== "Bad Request"
  ) {
    return payload.error;
  }
  return fallback;
}

async function request<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: T }> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });

  let data = {} as T;
  try {
    data = (await response.json()) as T;
  } catch {
    data = {} as T;
  }

  return { ok: response.ok, status: response.status, data };
}

export function useMultiplayer() {
  const [playerId] = useState(getOrCreatePlayerId);
  const [room, setRoom] = useState<PublicRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const versionRef = useRef(0);

  const view: LobbyView = !room
    ? "home"
    : room.status === "lobby"
      ? "lobby"
      : "playing";

  const mySeat = room && playerId ? (room.seats[playerId] ?? null) : null;
  const isHost = !!room && room.hostId === playerId;

  const isMyTurn = useMemo(() => {
    if (!room?.game || !mySeat) return false;
    const game = room.game;
    if (game.auction) return game.auction.currentBidder === mySeat;
    if (game.trade?.awaitingResponse) {
      return game.trade.recipient === mySeat || game.trade.initiator === mySeat;
    }
    return game.turn === mySeat;
  }, [room, mySeat]);

  const applyRoom = useCallback((next: PublicRoom) => {
    versionRef.current = next.version;
    setRoom(next);
  }, []);

  useEffect(() => {
    if (!room?.code) return;

    const code = room.code;
    const tick = async () => {
      const { ok, data } = await request<RoomResponse>(`/rooms/${code}`);
      if (!ok || !data.room) return;
      if (data.room.version !== versionRef.current) applyRoom(data.room);
    };

    const timer = setInterval(() => {
      void tick().catch(() => undefined);
    }, POLL_MS);

    return () => clearInterval(timer);
  }, [room?.code, applyRoom]);

  const createGame = useCallback(
    async (input: { name: string; color: PlayerColor; maxPlayers: number }) => {
      setBusy(true);
      setError(null);
      try {
        const { ok, data } = await request<RoomResponse>("/rooms", {
          method: "POST",
          body: JSON.stringify({
            playerId,
            name: input.name,
            color: input.color,
            maxPlayers: input.maxPlayers,
          }),
        });
        if (!ok || !data.room) {
          throw new Error(errorMessage(data, "failed to create"));
        }
        applyRoom(data.room);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "failed to create");
      } finally {
        setBusy(false);
      }
    },
    [playerId, applyRoom],
  );

  const joinGame = useCallback(
    async (input: { code: string; name: string; color: PlayerColor }) => {
      setBusy(true);
      setError(null);
      try {
        const code = input.code.trim().toUpperCase();
        const { ok, data } = await request<RoomResponse>(`/rooms/${code}`, {
          method: "POST",
          body: JSON.stringify({
            action: "join",
            playerId,
            name: input.name,
            color: input.color,
          }),
        });
        if (!ok || !data.room) {
          throw new Error(errorMessage(data, "failed to join"));
        }
        applyRoom(data.room);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "failed to join");
      } finally {
        setBusy(false);
      }
    },
    [playerId, applyRoom],
  );

  const startGame = useCallback(async () => {
    if (!room) return;
    setBusy(true);
    setError(null);
    try {
      const { ok, data } = await request<RoomResponse>(`/rooms/${room.code}`, {
        method: "POST",
        body: JSON.stringify({ action: "start", playerId }),
      });
      if (!ok || !data.room) {
        throw new Error(errorMessage(data, "failed to start"));
      }
      applyRoom(data.room);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "failed to start");
    } finally {
      setBusy(false);
    }
  }, [room, playerId, applyRoom]);

  const leaveGame = useCallback(async () => {
    if (room && playerId) {
      await request(`/rooms/${room.code}`, {
        method: "POST",
        body: JSON.stringify({ action: "leave", playerId }),
      }).catch(() => undefined);
    }
    setRoom(null);
    versionRef.current = 0;
  }, [room, playerId]);

  const sendChat = useCallback(
    async (text: string) => {
      const body = text.trim();
      if (!room || !playerId || !body) return;
      const { ok, data } = await request<RoomResponse>(
        `/rooms/${room.code}/chat`,
        {
          method: "POST",
          body: JSON.stringify({ playerId, text: body }),
        },
      ).catch(() => ({ ok: false, status: 0, data: {} as RoomResponse }));
      if (ok && data.room) applyRoom(data.room);
    },
    [room, playerId, applyRoom],
  );

  const act = useCallback(
    async (gameAction: GameAction) => {
      if (!room || !playerId) return;
      try {
        const { ok, data } = await request<RoomResponse>(
          `/rooms/${room.code}/action`,
          {
            method: "POST",
            body: JSON.stringify({ playerId, gameAction }),
          },
        );
        if (!ok || !data.room) {
          setError(errorMessage(data, "action failed"));
          return;
        }
        applyRoom(data.room);
        setError(null);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "action failed");
      }
    },
    [room, playerId, applyRoom],
  );

  return {
    view,
    room,
    playerId,
    mySeat,
    isMyTurn,
    isHost,
    error,
    busy,
    createGame,
    joinGame,
    startGame,
    leaveGame,
    act,
    sendChat,
    clearError: () => setError(null),
  };
}
