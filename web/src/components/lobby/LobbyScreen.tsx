"use client";

import { RoomCodeCard } from "@/components/lobby/RoomCodeCard";
import { SeatList } from "@/components/lobby/SeatList";
import { ChatComposer } from "@/components/shared/ChatComposer";
import { ChatFeed } from "@/components/shared/ChatFeed";
import { Logo } from "@/components/shared/Logo";
import type { ChatMessage, PublicRoom } from "@/lib/api/types";
import { buyButton, cx, dangerButton, errorBox, panel } from "@/lib/ui";

interface LobbyScreenProps {
  room: PublicRoom;
  playerId: string;
  isHost: boolean;
  busy: boolean;
  error: string | null;
  messages: ChatMessage[];
  onSendChat: (text: string) => void;
  onStart: () => void;
  onLeave: () => void;
}

export function LobbyScreen({
  room,
  playerId,
  isHost,
  busy,
  error,
  messages,
  onSendChat,
  onStart,
  onLeave,
}: LobbyScreenProps) {
  const startLabel = busy
    ? "Starting…"
    : room.members.length < 2
      ? "Need 2+ players"
      : "Start game";

  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr] gap-2.5 bg-shell p-2.5 font-sans text-body">
      <header className="flex items-center justify-between gap-3 rounded-panel border border-line bg-surface px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Logo badge href={null} />
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-[7px] text-[12px] font-semibold text-body">
            <span className="font-medium text-dim">Lobby</span>
            <span className="font-bold tracking-[0.12em]">{room.code}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className={dangerButton} onClick={onLeave}>
            Leave
          </button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1200px] grid-cols-[minmax(0,1fr)_minmax(340px,420px)] content-center items-start gap-4.5 px-[clamp(12px,4vw,56px)] pt-5 pb-10 max-[1080px]:grid-cols-[minmax(0,1fr)]">
        <section className={cx(panel, "gap-3 p-4")}>
          <RoomCodeCard code={room.code} />
          <SeatList
            members={room.members}
            maxPlayers={room.maxPlayers}
            playerId={playerId}
          />

          {error && <div className={errorBox}>{error}</div>}

          {isHost ? (
            <button
              type="button"
              className={buyButton}
              disabled={busy || room.members.length < 2}
              onClick={onStart}
            >
              {startLabel}
            </button>
          ) : (
            <div className="rounded-[11px] border border-dashed border-line bg-shell-2 p-3.25 text-center text-[13px] text-dim">
              Waiting for the host to start…
            </div>
          )}
        </section>

        <section className={cx(panel, "min-h-[340px]")}>
          <header className="flex items-center justify-between gap-2.5 border-b border-line bg-surface-2 px-3.5 py-3">
            <span className="inline-flex items-center gap-1.75 text-[14px] font-bold">
              Table chat
            </span>
          </header>
          <ChatFeed
            messages={messages}
            playerId={playerId}
            emptyLabel="Say hi while the room fills up."
            className="rounded-none border-none"
          />
          <ChatComposer
            onSend={onSendChat}
            className="border-t border-line p-2.5"
          />
        </section>
      </main>
    </div>
  );
}
