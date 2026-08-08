"use client";

import { useState } from "react";
import { PlayerIdentityFields } from "@/components/entry/PlayerIdentityFields";
import type { PlayerColor } from "@/lib/monopoly/types";

interface JoinRoomDialogProps {
  busy: boolean;
  error: string | null;
  initialCode?: string | null;
  onJoin: (input: { code: string; name: string; color: PlayerColor }) => void;
  onBack: () => void;
}

export function JoinRoomDialog({
  busy,
  error,
  initialCode,
  onJoin,
  onBack,
}: JoinRoomDialogProps) {
  const [name, setName] = useState("player_1");
  const [color, setColor] = useState<PlayerColor>("blue");
  const [code, setCode] = useState(initialCode ?? "");

  const ready = !busy && !!name.trim() && code.trim().length >= 4;
  const submit = () => {
    if (!ready) return;
    onJoin({ code: code.trim(), name: name.trim(), color });
  };

  return (
    <div className="w-screen h-screen relative">
      <div className="w-[30vw] flex flex-col absolute scale-125 inset-0 m-auto h-fit rounded-2xl pb-2 bg-white overflow-hidden shadow-2xl">
        <img
          src={"/landing/lobbytop.png"}
          alt="lobby section"
          className="w-full h-full object-cover"
        />

        <div className="w-[28vw] my-2 mx-4 h-auto flex flex-col gap-2.5 bg-white p-3 rounded-2xl shadow-sm border border-purple-100/50">
          {/* ROOM CODE INPUT */}
          <div>
            <div className="flex items-center gap-1.5 text-[#7c3aed] text-[11px] font-extrabold tracking-wider uppercase mb-1">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
              <span>Room Code</span>
            </div>
            <input
              className="w-full px-4 py-2 bg-[#fcfaff] border border-[#ddd6fe] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 rounded-xl text-center text-xl font-black tracking-[0.3em] uppercase text-slate-800 outline-none transition-all placeholder:tracking-normal placeholder:font-bold placeholder:text-sm placeholder:text-slate-400"
              value={code}
              maxLength={6}
              placeholder="ABC123"
              onKeyDown={(event) => event.key === "Enter" && submit()}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
            />
          </div>

          <PlayerIdentityFields
            name={name}
            color={color}
            onNameChange={setName}
            onColorChange={setColor}
          />

          {error && (
            <div className="text-xs text-red-500 font-semibold px-1">
              {error}
            </div>
          )}
        </div>

        <div className="relative w-full">
          <img
            src={"/landing/lobbybtn.png"}
            alt="lobby section"
            className="w-full h-full object-cover"
          />
          <div className="flex gap-8 absolute bottom-5.5 font-black w-full justify-between px-14">
            <button
              type="button"
              className="pl-5"
              disabled={!ready}
              onClick={submit}
            >
              {busy ? "Joining…" : "Join lobby"}
            </button>
            <button type="button" className="pr-17" onClick={onBack}>
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
