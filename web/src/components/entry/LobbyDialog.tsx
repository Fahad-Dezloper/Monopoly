"use client";

import { useState } from "react";
import {
  memberLabel,
  type ChatMessage,
  type PublicRoom,
} from "@/lib/api/types";
import { COLOR_HEX } from "@/components/entry/PlayerIdentityFields";

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
  const [copiedType, setCopiedType] = useState<"code" | "link" | null>(null);
  const [chatInput, setChatInput] = useState("");

  const short = room.members.length < 2;
  const hostMember = room.members.find((member) => member.isHost);
  const hostName = hostMember ? memberLabel(hostMember) : "the host";
  const openSeats = Math.max(0, room.maxPlayers - room.members.length);

  const handleCopy = async (type: "code" | "link") => {
    const textToCopy =
      type === "code"
        ? room.code
        : `${window.location.origin}/?join=${room.code}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      setCopiedType(null);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim());
    setChatInput("");
  };

  return (
    <div className="w-screen h-screen relative">
      <div className="w-[50vw] flex flex-col absolute inset-0 m-auto h-fit rounded-2xl pb-2 bg-white overflow-hidden shadow-2xl">
        <img
          src={"/landing/lobbyjointop.png"}
          alt="lobby section"
          className="w-full h-full object-cover"
        />

        {/* MAIN LOBBY CONTAINER */}
        <div className="w-[46vw] my-2 mx-auto grid grid-cols-2 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-purple-100/50 text-slate-800">
          {/* LEFT COLUMN: ROOM CODE & PLAYERS */}
          <div className="flex flex-col gap-3">
            {/* ROOM CODE SECTION */}
            <div>
              <div className="flex items-center gap-1.5 text-[#7c3aed] text-[11px] font-extrabold tracking-wider uppercase mb-1.5">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
                <span>Room Code</span>
              </div>

              {/* CODE DISPLAY BOX */}
              <div className="bg-[#f5f0ff] border border-[#e9e2ff] rounded-2xl p-3 flex items-center justify-between relative overflow-hidden mb-2">
                {/* Decorative Sparkles Left */}
                <svg
                  className="w-4 h-4 text-[#a78bfa] opacity-60 shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                </svg>

                <div className="text-2xl font-black text-[#6d28d9] tracking-[0.35em] text-center w-full select-all">
                  {room.code}
                </div>

                {/* Decorative Sparkles Right */}
                <svg
                  className="w-4 h-4 text-[#a78bfa] opacity-60 shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                </svg>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy("code")}
                  className="flex-1 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
                >
                  <svg
                    className="w-3.5 h-3.5 fill-none stroke-current stroke-[2.5]"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{copiedType === "code" ? "Copied!" : "Copy code"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy("link")}
                  className="flex-1 bg-white border border-[#e9e2ff] text-[#7c3aed] font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 hover:bg-[#fcfaff] active:scale-[0.98] transition-all"
                >
                  <svg
                    className="w-3.5 h-3.5 fill-none stroke-current stroke-[2.5]"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span>
                    {copiedType === "link" ? "Copied Link!" : "Invite link"}
                  </span>
                </button>
              </div>
            </div>

            {/* PLAYERS SECTION */}
            <div>
              <div className="flex items-center gap-1.5 text-[#7c3aed] text-[11px] font-extrabold tracking-wider uppercase mb-2">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
                <span>
                  Players · {room.members.length} of {room.maxPlayers}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto pr-1">
                {/* FILLED SEATS */}
                {room.members.map((member, index) => {
                  const isYou = member.id === playerId;
                  const hexColor =
                    COLOR_HEX[member.color] || member.color || "#0052ff";
                  return (
                    <div
                      key={member.id}
                      className="bg-[#fcfaff] border border-[#eee7ff] rounded-xl p-2 flex items-center justify-between gap-2.5 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Avatar */}
                        <div
                          className="w-8 h-8 rounded-full text-white font-black text-xs flex items-center justify-center relative shrink-0 shadow-sm"
                          style={{ backgroundColor: hexColor }}
                        >
                          {memberLabel(member).slice(0, 2).toUpperCase()}
                          {/* Online Dot */}
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                        </div>

                        {/* Player Info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {memberLabel(member)}
                            </span>
                            {isYou && (
                              <span className="bg-[#ddd6fe] text-[#6d28d9] text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                                YOU
                              </span>
                            )}
                            {member.isHost && (
                              <span className="bg-[#dbeafe] text-[#1e40af] text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                                HOST
                              </span>
                            )}
                          </div>
                          <div className="text-[10.5px] text-slate-400 font-medium">
                            Seat {index + 1} · starts with $1,500
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* EMPTY SEATS */}
                {Array.from({ length: openSeats }).map((_, index) => (
                  <div
                    key={`open-${index}`}
                    className="border border-dashed border-[#e2d9f7] bg-white rounded-xl p-2 flex items-center gap-2.5"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#f3edff] text-[#7c3aed] flex items-center justify-center font-bold text-sm shrink-0">
                      +
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Open seat
                      </div>
                      <div className="text-[10.5px] text-slate-400">
                        waiting for a player...
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-500 font-semibold px-1">
                {error}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: TABLE CHAT */}
          <div className="bg-white border border-[#eee7ff] rounded-2xl p-3 flex flex-col justify-between h-full min-h-[300px]">
            <div>
              <div className="flex items-center gap-1.5 text-[#7c3aed] text-[11px] font-extrabold tracking-wider uppercase mb-2">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
                </svg>
                <span>Table Chat</span>
              </div>
            </div>

            {/* FEED CONTAINER */}
            <div className="bg-[#fcfaff] border border-[#f0ebff] rounded-2xl flex-1 flex flex-col p-3 overflow-y-auto max-h-[220px] min-h-[180px] my-2">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center my-auto p-4 text-center">
                  {/* 3D Chat Graphic Illustration */}
                  <div className="relative w-16 h-14 mb-2 flex items-center justify-center">
                    {/* Purple Chat Bubble */}
                    <div className="absolute top-0 left-1 w-9 h-7 bg-[#7c3aed] rounded-xl rounded-bl-none flex items-center justify-center shadow-md transform -rotate-6">
                      <div className="flex gap-0.5">
                        <span className="w-1 h-1 bg-white rounded-full"></span>
                        <span className="w-1 h-1 bg-white rounded-full"></span>
                        <span className="w-1 h-1 bg-white rounded-full"></span>
                      </div>
                    </div>
                    {/* Blue Chat Bubble */}
                    <div className="absolute bottom-0 right-1 w-9 h-7 bg-[#3b82f6] rounded-xl rounded-tr-none flex items-center justify-center shadow-md transform rotate-6">
                      <svg
                        className="w-4 h-4 text-white fill-current"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5S7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                      </svg>
                    </div>
                    {/* Sparkle */}
                    <span className="absolute -top-1 -right-1 text-xs text-[#a78bfa]">
                      ✨
                    </span>
                  </div>
                  <p className="font-bold text-[#1e1b4b] text-xs leading-snug max-w-[160px]">
                    Say hi while the room fills up!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {messages.map((msg) => {
                    const isMine = msg.playerId === playerId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] ${
                          isMine
                            ? "self-end items-end"
                            : "self-start items-start"
                        }`}
                      >
                        <span
                          className="text-[9px] font-bold mb-0.5 px-1 uppercase"
                          style={{ color: msg.color || "#7c3aed" }}
                        >
                          {isMine ? "You" : msg.username}
                        </span>
                        <div
                          className={`px-3 py-1.5 rounded-2xl text-xs font-medium ${
                            isMine
                              ? "bg-[#7c3aed] text-white rounded-tr-xs shadow-xs"
                              : "bg-[#f3edff] text-[#1e1b4b] rounded-tl-xs border border-[#e9e2ff]"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CHAT INPUT FORM */}
            <form onSubmit={handleSendChat} className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-white border border-[#e9e2ff] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="w-9 h-9 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100"
              >
                <svg
                  className="w-4 h-4 fill-current transform rotate-45 -translate-y-0.5 -translate-x-0.5"
                  viewBox="0 0 24 24"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* BOTTOM BUTTON BAR */}
        <div className="relative w-full">
          <img
            src={"/landing/lobbybtn.png"}
            alt="lobby section"
            className="w-full h-full object-cover"
          />
          <div className="flex gap-8 absolute bottom-10 font-black w-full justify-between px-20 text-lg">
            {isHost ? (
              <button
                type="button"
                disabled={busy || short}
                onClick={onStart}
                className="disabled:opacity-50"
              >
                {busy
                  ? "Starting…"
                  : short
                    ? "Waiting for one more player"
                    : `Start game · ${room.members.length} players`}
              </button>
            ) : (
              <div className="flex h-10 flex-1 items-center justify-center gap-2">
                Waiting for {hostName} to start…
              </div>
            )}
            <button type="button" className="pr-22" onClick={onLeave}>
              Leave lobby
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
