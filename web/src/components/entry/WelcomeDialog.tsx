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
        <div className="flex gap-8 absolute bottom-6  font-black w-full justify-between px-16 ">
          <button type="button" className="text-white" onClick={onCreate}>
            Create a lobby
          </button>
          <button type="button" className="text-white" onClick={onJoin}>
            Join with a code
          </button>
        </div>{" "}
      </div>
    </div>
  );
}
