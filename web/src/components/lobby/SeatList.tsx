"use client";

import { memberLabel, type RoomMember } from "@/lib/api/types";
import { avatar, cx, playerCard } from "@/lib/ui";

interface SeatListProps {
  members: RoomMember[];
  maxPlayers: number;
  playerId: string;
}

const TAG =
  "rounded-[5px] border border-line bg-surface-2 px-1.5 py-px text-[9px] tracking-[0.06em] text-dim uppercase";

export function SeatList({ members, maxPlayers, playerId }: SeatListProps) {
  const openSeats = Math.max(0, maxPlayers - members.length);

  return (
    <div className="flex flex-col gap-1.5">
      {members.map((member, index) => (
        <div
          key={member.id}
          className={cx(
            playerCard,
            member.id === playerId && "border-accent bg-[#1e1b2e]",
          )}
        >
          <span
            className={avatar}
            style={{ background: member.color }}
            aria-hidden
          >
            {memberLabel(member).slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 truncate text-[13px] font-bold text-body">
              {memberLabel(member)}
              {member.id === playerId && <span className={TAG}>you</span>}
              {member.isHost && <span className={TAG}>host</span>}
            </div>
            <div className="mt-px text-[11px] text-dim">
              Seat {index + 1} · starts with $1,500
            </div>
          </div>
        </div>
      ))}

      {Array.from({ length: openSeats }).map((_, index) => (
        <div key={`open-${index}`} className={cx(playerCard, "border-dashed")}>
          <span
            className={cx(
              avatar,
              "border border-dashed border-line bg-transparent text-dim",
            )}
            aria-hidden
          >
            +
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-body">Open seat</div>
            <div className="mt-px text-[11px] text-dim">
              waiting for a player…
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
