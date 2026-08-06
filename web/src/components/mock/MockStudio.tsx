"use client";

import { useState } from "react";
import { GameMockView } from "@/components/mock/GameMockView";
import { HomeMockView } from "@/components/mock/HomeMockView";
import { LobbyMockView } from "@/components/mock/LobbyMockView";
import { MockControls } from "@/components/mock/MockControls";
import {
  defaultFlags,
  type MockFlag,
  type MockScreen,
} from "@/components/mock/mockRegistry";

export function MockStudio() {
  const [screen, setScreen] = useState<MockScreen>("game");
  const [open, setOpen] = useState(true);
  const [lastAction, setLastAction] = useState("");
  const [flagsByScreen, setFlagsByScreen] = useState<
    Record<MockScreen, Record<string, MockFlag>>
  >({
    game: defaultFlags("game"),
    lobby: defaultFlags("lobby"),
    home: defaultFlags("home"),
  });

  const flags = flagsByScreen[screen];

  const patch = (key: string, next: Partial<MockFlag>) =>
    setFlagsByScreen((all) => ({
      ...all,
      [screen]: { ...all[screen], [key]: { ...all[screen][key], ...next } },
    }));

  const patchAll = (next: Partial<MockFlag>) =>
    setFlagsByScreen((all) => {
      const updated: Record<string, MockFlag> = {};
      for (const [key, flag] of Object.entries(all[screen])) {
        updated[key] = { ...flag, ...next };
      }
      return { ...all, [screen]: updated };
    });

  return (
    <div className="min-h-dvh">
      <div className={open ? "min-h-dvh pr-80 max-[1100px]:pr-0" : "min-h-dvh"}>
        {screen === "game" && (
          <GameMockView
            flags={flags}
            onAction={(action) => setLastAction(JSON.stringify(action))}
          />
        )}
        {screen === "lobby" && (
          <LobbyMockView flags={flags} onAction={setLastAction} />
        )}
        {screen === "home" && (
          <HomeMockView flags={flags} onAction={setLastAction} />
        )}
      </div>

      <MockControls
        screen={screen}
        flags={flags}
        open={open}
        lastAction={lastAction}
        onScreenChange={setScreen}
        onToggleVisible={(key) => patch(key, { visible: !flags[key].visible })}
        onToggleMock={(key) => patch(key, { mock: !flags[key].mock })}
        onAll={patchAll}
        onOpenChange={setOpen}
      />
    </div>
  );
}
