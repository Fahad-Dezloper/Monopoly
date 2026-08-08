"use client";

import {
  Dialog,
  dialogGhost,
  dialogPrimary,
} from "@/components/game/dialogs/Dialog";
import {
  GAME_POINTS,
  GAME_TAGLINE,
  TURN_CLOCK_NOTE,
} from "@/components/entry/entryContent";

interface WelcomeDialogProps {
  onCreate: () => void;
  onJoin: () => void;
}

export function WelcomeDialog({ onCreate, onJoin }: WelcomeDialogProps) {
  return (
    <div className="w-screen h-screen  relative">
      <div className="w-[30vw] absolute inset-0 m-auto h-fit rounded-2xl pb-2 bg-white overflow-hidden">
        <img
          src={"/landing/landing3.png"}
          alt="landing modal"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-6 inset-x-0 flex items-center justify-between px-10 font-extrabold text-white text-xs md:text-sm lg:text-base">
          <button
            type="button"
            className="flex-1 flex items-center justify-center text-center px-3 h-full transition-all hover:opacity-90 leading-tight"
            onClick={onCreate}
          >
            Create a lobby
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center text-center px-3 h-full transition-all hover:opacity-90 leading-tight"
            onClick={onJoin}
          >
            Join with a code
          </button>
        </div>{" "}
      </div>
    </div>
  );
}
