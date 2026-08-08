"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PublicKey } from "@solana/web3.js";

import {
  chain as getChain,
  codeBytes,
  decodeName,
  nameBytes,
} from "@/lib/chain/client";
import { BANK, CODE_LEN, PINNED_VALIDATOR } from "@/lib/chain/config";
import { seatOf, toGameState } from "@/lib/chain/decode";
import {
  buildInstruction,
  EMPTY_UI,
  planAction,
  type UiState,
} from "@/lib/chain/dispatch";
import { alertsFromLogs, type FeedLine } from "@/lib/chain/events";
import { topUp } from "@/lib/chain/burner";
import { variantOf, type OnchainGame } from "@/lib/chain/types";
import type { ChatMessage, PublicRoom, RoomMember } from "@/lib/api/types";
import type { GameAction } from "@/lib/monopoly/engine";
import { PLAYER_COLORS } from "@/lib/monopoly/board";
import type { PlayerColor } from "@/lib/monopoly/types";

export type LobbyView = "home" | "lobby" | "playing";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_ALERTS = 80;

const CHAT_API = (
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "/api"
).replace(/\/$/, "");

function randomCode(): string {
  const bytes = new Uint8Array(CODE_LEN);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join(
    "",
  );
}

function colorIndex(color: PlayerColor): number {
  const index = PLAYER_COLORS.indexOf(color);
  return index >= 0 ? index : 0;
}

function reason(cause: unknown, fallback: string): string {
  if (cause instanceof Error) {
    const raw = cause.message || "";
    // Friendlier Solana / MagicBlock simulation noise
    if (/simulation failed|Transaction simulation failed/i.test(raw)) {
      if (/insufficient|0x1|custom program error: 0x1/i.test(raw)) {
        return "Not enough SOL — refresh balance and try again.";
      }
      if (/blockhash|expired|recentBlockhash/i.test(raw)) {
        return "Network lag — try the action again.";
      }
      if (/already in use|account in use/i.test(raw)) {
        return "Table busy — wait a second and retry.";
      }
      const program = /Error Message: ([^.\n]+)/.exec(raw);
      if (program) return program[1].trim();
      return "Move rejected by the network — try again.";
    }
    const match = /Error Message: ([^.\n]+)/.exec(raw);
    if (match) return match[1].trim();
    return raw.split("\n")[0] || fallback;
  }
  return fallback;
}

export function useOnchainGame() {
  const chain = useMemo(() => getChain(), []);
  const playerId = useMemo(() => chain.wallet.toBase58(), [chain]);

  const [code, setCode] = useState<string | null>(null);
  const [game, setGame] = useState<OnchainGame | null>(null);
  const [ui, setUi] = useState<UiState>(EMPTY_UI);
  const [feed, setFeed] = useState<FeedLine[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState({ version: 0, at: 0 });

  const [routeVersion, setRouteVersion] = useState(0);
  // Mirrored into state because the render path needs it for explorer links.
  const [feedEndpoint, setFeedEndpoint] = useState<string | null>(null);

  const gameRef = useRef<OnchainGame | null>(null);
  const settledRef = useRef(false);
  const endpointRef = useRef<string | null>(null);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const pda = useMemo<PublicKey | null>(
    () => (code ? chain.gamePda(code) : null),
    [chain, code],
  );

  useEffect(() => {
    if (!pda) return;
    const timer = setInterval(() => {
      void chain
        .resolveRoute(pda, true)
        .then((route) => {
          if (route.endpoint !== endpointRef.current) {
            setRouteVersion((v) => v + 1);
          }
        })
        .catch(() => undefined);
    }, 2500);
    return () => clearInterval(timer);
  }, [chain, pda]);

  useEffect(() => {
    if (!pda) return;
    let cancelled = false;
    let stopAccount: (() => void) | undefined;
    let logSub: number | undefined;
    let connection:
      Awaited<ReturnType<typeof chain.resolveRoute>>["connection"] | null =
      null;

    void (async () => {
      const route = await chain.resolveRoute(pda, true);
      if (cancelled) return;
      connection = route.connection;
      endpointRef.current = route.endpoint;
      setFeedEndpoint(route.endpoint);

      stopAccount = await chain.watchGame(pda, (next) => {
        if (cancelled) return;
        setGame(next);
        setRevision((prev) => ({ version: prev.version + 1, at: Date.now() }));
      });

      logSub = route.connection.onLogs(
        chain.program.programId,
        (entry) => {
          if (cancelled || entry.err) return;
          const lines = alertsFromLogs(
            chain.coder,
            entry.logs,
            pda,
            gameRef.current,
            entry.signature,
          );
          if (lines.length === 0) return;
          setFeed((prev) => [...prev, ...lines].slice(-MAX_ALERTS));
        },
        "confirmed",
      );
    })();

    return () => {
      cancelled = true;
      stopAccount?.();
      if (logSub !== undefined && connection) {
        void connection.removeOnLogsListener(logSub).catch(() => undefined);
      }
    };
  }, [chain, pda, routeVersion]);

  const alerts = useMemo(() => feed.map((line) => line.text), [feed]);

  const state = useMemo(
    () =>
      game
        ? toGameState(game, {
            alerts,
            selectedProperty: ui.selectedProperty,
          })
        : null,
    [game, alerts, ui.selectedProperty],
  );

  const stateWithDraft = useMemo(() => {
    if (!state) return null;
    if (state.trade || !ui.trade) return state;
    return { ...state, trade: ui.trade };
  }, [state, ui.trade]);

  const mySeat = game ? seatOf(game, playerId) : null;
  const isHost = game ? game.host.toBase58() === playerId : false;
  const phase = game ? variantOf(game.phase) : null;

  const view: LobbyView = !game
    ? "home"
    : phase === "Lobby"
      ? "lobby"
      : "playing";

  const isMyTurn = useMemo(() => {
    if (!game || !mySeat) return false;
    if (game.auction.active) return game.auction.current_bidder === mySeat;
    if (game.trade.active && game.trade.awaiting_response) {
      return game.trade.recipient === mySeat || game.trade.initiator === mySeat;
    }
    return game.turn === mySeat;
  }, [game, mySeat]);

  const room = useMemo<PublicRoom | null>(() => {
    if (!game || !code) return null;
    const members: RoomMember[] = [];
    for (let seat = 1; seat <= game.player_count; seat += 1) {
      const player = game.players[seat];
      const id = player.wallet.toBase58();
      members.push({
        id,
        username: decodeName(player.name) || `Player ${seat}`,
        color: PLAYER_COLORS[player.color] ?? "black",
        isHost: id === game.host.toBase58(),
        ready: true,
        seat,
        joinedAt: seat,
      });
    }

    const seats: Record<string, number> = {};
    for (const member of members) {
      if (member.seat) seats[member.id] = member.seat;
    }

    return {
      code,
      hostId: game.host.toBase58(),
      status:
        phase === "Lobby"
          ? "lobby"
          : phase === "GameOver"
            ? "finished"
            : "playing",
      maxPlayers,
      members,
      seats,
      game: phase === "Lobby" ? null : stateWithDraft,
      messages,
      version: revision.version,
      updatedAt: revision.at,
    };
  }, [game, code, phase, maxPlayers, messages, stateWithDraft, revision]);

  const run = useCallback(
    async <T>(label: string, work: () => Promise<T>): Promise<T | null> => {
      setBusy(true);
      setError(null);
      try {
        return await work();
      } catch (cause) {
        setError(reason(cause, label));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const createGame = useCallback(
    async (input: { name: string; color: PlayerColor; maxPlayers: number }) => {
      await run("failed to create", async () => {
        await topUp(chain.base, chain.wallet);
        const next = randomCode();
        const ix = await buildInstruction(
          chain,
          "createGame",
          [codeBytes(next), nameBytes(input.name), colorIndex(input.color)],
          chain.gamePda(next),
        );
        await chain.sendBase([ix]);
        setMaxPlayers(input.maxPlayers);
        setFeed([]);
        settledRef.current = false;
        setCode(next);
      });
    },
    [chain, run],
  );

  const joinGame = useCallback(
    async (input: { code: string; name: string; color: PlayerColor }) => {
      await run("failed to join", async () => {
        await topUp(chain.base, chain.wallet);
        const next = input.code.trim().toUpperCase();
        const ix = await buildInstruction(
          chain,
          "joinGame",
          [nameBytes(input.name), colorIndex(input.color)],
          chain.gamePda(next),
        );
        await chain.sendBase([ix]);
        setFeed([]);
        settledRef.current = false;
        setCode(next);
      });
    },
    [chain, run],
  );

  const startGame = useCallback(async () => {
    if (!code || !pda) return;
    await run("failed to start", async () => {
      const delegate = await buildInstruction(
        chain,
        "delegateGame",
        [codeBytes(code), PINNED_VALIDATOR],
        pda,
      );
      await chain.sendBase([delegate]);

      const route = await waitForDelegation(chain, pda);
      setRouteVersion((v) => v + 1);

      const start = await buildInstruction(chain, "startGame", [seed()], pda);
      await chain.send([start], route.connection);
    });
  }, [chain, code, pda, run]);

  const leaveGame = useCallback(async () => {
    setCode(null);
    setGame(null);
    setUi(EMPTY_UI);
    setFeed([]);
    setMessages([]);
    setError(null);
    endpointRef.current = null;
  }, []);

  // Table chat is not on chain: it is talk, not game state, and it would cost
  // account space and a transaction per line. It goes through the REST server,
  // keyed only by the room code both players already share.
  const sendChat = useCallback(
    async (text: string) => {
      const body = text.trim();
      if (!body || !code) return;
      const seat = game ? seatOf(game, playerId) : null;
      const username =
        seat != null && game
          ? decodeName(game.players[seat].name) || `Player ${seat}`
          : "player";
      const color =
        seat != null && game
          ? (PLAYER_COLORS[game.players[seat].color] ?? "blue")
          : "blue";

      try {
        const res = await fetch(`${CHAT_API}/chat/${code}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ playerId, username, color, text: body }),
        });
        const data = (await res.json()) as { messages?: ChatMessage[] };
        if (data.messages) setMessages(data.messages);
      } catch {
        // Chat is not worth failing a turn over; the poll will catch up.
      }
    },
    [code, game, playerId],
  );

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    const read = async () => {
      try {
        const res = await fetch(`${CHAT_API}/chat/${code}`);
        const data = (await res.json()) as { messages?: ChatMessage[] };
        if (!cancelled && data.messages) setMessages(data.messages);
      } catch {
        // Offline or no server — chat simply stays quiet.
      }
    };
    void read();
    const timer = setInterval(() => void read(), 2000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [code]);

  const act = useCallback(
    async (action: GameAction) => {
      if (!game || !pda) return;

      const plan = planAction(action, game, ui);
      if (plan.kind === "ignore") return;
      if (plan.kind === "ui") {
        setUi((prev) => ({ ...prev, ...plan.next }));
        return;
      }
      if (plan.kind === "error") {
        setError(plan.message);
        return;
      }

      setError(null);
      try {
        const ix = await buildInstruction(chain, plan.method, plan.args, pda);
        await chain.sendRouted(pda, [ix]);
        if (
          plan.method === "proposeTrade" ||
          plan.method === "respondToTrade"
        ) {
          setUi((prev) => ({ ...prev, trade: null }));
        }
      } catch (cause) {
        setError(reason(cause, "action failed"));
      }
    },
    [chain, game, pda, ui],
  );

  useEffect(() => {
    if (!game || !pda || !isHost || settledRef.current) return;
    if (variantOf(game.phase) !== "GameOver") return;
    settledRef.current = true;

    void (async () => {
      try {
        const ix = await buildInstruction(chain, "settleGame", [], pda);
        await chain.sendRouted(pda, [ix]);
        chain.forgetRoute(pda);
      } catch {
        settledRef.current = false;
      }
    })();
  }, [chain, game, pda, isHost]);

  return {
    view,
    room,
    playerId,
    mySeat,
    isMyTurn,
    isHost,
    error,
    busy,
    awaitingChain: game?.vrf_pending ?? false,
    wallet: chain.wallet,
    /** Feed lines paired with the transaction that produced each one. */
    feed,
    /** Where those transactions ran, so links point at the right explorer. */
    feedEndpoint,
    gameAddress: pda?.toBase58() ?? null,
    createGame,
    joinGame,
    startGame,
    leaveGame,
    act,
    sendChat,
    clearError: () => setError(null),
  };
}

function seed(): number {
  return Math.floor(Math.random() * 256);
}

async function waitForDelegation(
  chain: ReturnType<typeof getChain>,
  pda: PublicKey,
  attempts = 12,
) {
  for (let i = 0; i < attempts; i += 1) {
    const route = await chain.resolveRoute(pda, true);
    if (route.delegated) return route;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("the rollup has not picked up the game yet — try again");
}

export { BANK };
