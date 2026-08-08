"use client";

import { useState } from "react";
import { PlayerIdentityFields } from "@/components/entry/PlayerIdentityFields";
import { DevnetWalletCard } from "@/components/entry/DevnetWalletCard";
import { CHAIN_ENABLED } from "@/lib/chain/config";
import type { PlayerColor } from "@/lib/monopoly/types";

interface CreateRoomDialogProps {
  busy: boolean;
  error: string | null;
  onCreate: (input: {
    name: string;
    color: PlayerColor;
    maxPlayers: number;
  }) => void;
  onBack: () => void;
}

export function CreateRoomDialog({
  busy,
  error,
  onCreate,
  onBack,
}: CreateRoomDialogProps) {
  const [name, setName] = useState("player_1");
  const [color, setColor] = useState<PlayerColor>(() => {
    const pool: PlayerColor[] = [
      "yellow",
      "blue",
      "red",
      "lime",
      "green",
      "aqua",
      "orange",
      "purple",
    ];
    return pool[Math.floor(Math.random() * pool.length)]!;
  });
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isWalletFunded, setIsWalletFunded] = useState<boolean>(true);
  // Off chain there is no wallet to fund, so it can never block the form.
  const walletReady = !CHAIN_ENABLED || isWalletFunded;

  const ready = !busy && !!name.trim() && walletReady;

  const submit = () => {
    if (!ready) return;
    onCreate({ name: name.trim(), color, maxPlayers });
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
          {/* DEVNET WALLET CARD & SOL BALANCE */}
          {CHAIN_ENABLED && (
            <DevnetWalletCard onFundedChange={setIsWalletFunded} />
          )}

          <PlayerIdentityFields
            name={name}
            color={color}
            onNameChange={setName}
            onColorChange={setColor}
          />

          {/* TABLE SIZE */}
          <div>
            <div className="flex items-center gap-1.5 text-[#7c3aed] text-[11px] font-extrabold tracking-wider uppercase mb-1.5">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
              <span>Table Size</span>
            </div>
            <div className="flex items-center gap-1 justify-between">
              {[2, 3, 4, 5, 6, 7, 8].map((count) => {
                const isSelected = maxPlayers === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setMaxPlayers(count)}
                    className={`flex-1 flex items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl text-xs font-black transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-[0_4px_12px_rgba(124,58,237,0.4)] border border-white/60 scale-105 z-10"
                        : "bg-[#f8f6ff] text-[#2e1065] border border-[#e9e2ff] hover:bg-[#f0ebff]"
                    }`}
                  >
                    <span>{count}</span>
                    <svg
                      className="w-3.5 h-3.5 fill-current opacity-90"
                      viewBox="0 0 24 24"
                    >
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>

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
          <div className="absolute inset-0 flex items-center justify-between px-10 font-extrabold text-white text-xs md:text-sm lg:text-base">
            <button
              type="button"
              className="flex-1 flex items-center justify-center text-center px-3 h-full transition-all disabled:opacity-40 hover:opacity-90 leading-tight"
              disabled={!ready}
              onClick={submit}
            >
              {busy ? "Creating…" : "Create lobby"}
            </button>
            <button
              type="button"
              className="flex-1 flex items-center justify-center text-center px-3 h-full transition-all hover:opacity-90 leading-tight"
              onClick={onBack}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
