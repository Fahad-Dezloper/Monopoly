"use client";

import {
  Dialog,
  dialogDanger,
  dialogPrimary,
} from "@/components/game/dialogs/Dialog";
import { RoomCodeBlock } from "@/components/entry/RoomCodeBlock";
import { SeatList } from "@/components/entry/SeatList";
import { ChatComposer } from "@/components/shared/ChatComposer";
import { ChatFeed } from "@/components/shared/ChatFeed";
import {
  memberLabel,
  type ChatMessage,
  type PublicRoom,
} from "@/lib/api/types";
import { errorBox } from "@/lib/ui";

interface LobbyDialogProps {
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

export function LobbyDialog({
  room,
  playerId,
  isHost,
  busy,
  error,
  messages,
  onSendChat,
  onStart,
  onLeave,
}: LobbyDialogProps) {
  const short = room.members.length < 2;
  const hostMember = room.members.find((member) => member.isHost);
  const hostName = hostMember ? memberLabel(hostMember) : "the host";

  return (
    <Dialog
      eyebrow="Step 2 of 2"
      title={isHost ? "Your lobby is open" : `Waiting in ${hostName}'s lobby`}
      subtitle={
        isHost
          ? "Share the code, then start whenever the table is ready."
          : "You are in. The game begins the moment the host starts it."
      }
      size="lg"
      footer={
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {isHost ? (
              <button
                type="button"
                className={dialogPrimary}
                disabled={busy || short}
                onClick={onStart}
              >
                {busy
                  ? "Starting…"
                  : short
                    ? "Waiting for one more player"
                    : `Start game · ${room.members.length} players`}
              </button>
            ) : (
              <div className="flex h-10 flex-1 items-center justify-center gap-2 rounded-sm border border-dashed border-line bg-shell-2 px-4 text-[13px] font-semibold text-dim">
                <span className="size-1.5 animate-pulse rounded-full bg-accent" />
                Waiting for {hostName} to start…
              </div>
            )}
            <button type="button" className={dialogDanger} onClick={onLeave}>
              Leave lobby
            </button>
          </div>
          {isHost && short && (
            <p className="text-center text-[11.5px] text-dim">
              A game needs at least two players. Send the code to a friend.
            </p>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 max-[640px]:grid-cols-1">
        <div className="flex flex-col gap-4">
          <RoomCodeBlock code={room.code} />
          <SeatList
            members={room.members}
            maxPlayers={room.maxPlayers}
            playerId={playerId}
          />
          {error && <div className={errorBox}>{error}</div>}
        </div>

        <div className="flex min-h-70 flex-col overflow-hidden rounded-sm border border-line bg-surface-2">
          <header className="border-b border-line px-3 py-2 text-[10px] font-bold tracking-[0.14em] text-dim uppercase">
            Table chat
          </header>
          <ChatFeed
            messages={messages}
            playerId={playerId}
            emptyLabel="Say hi while the room fills up."
            className="min-h-0 flex-1 rounded-none border-none"
          />
          <ChatComposer
            onSend={onSendChat}
            className="border-t border-line p-2"
          />
        </div>
      </div>
    </Dialog>
  );
}
