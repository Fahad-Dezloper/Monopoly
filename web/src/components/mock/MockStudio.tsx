"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { EntryMockView } from "@/components/mock/EntryMockView";
import { GameMockView } from "@/components/mock/GameMockView";
import { MockControls } from "@/components/mock/MockControls";
import {
  defaultFlags,
  type MockFlag,
  type MockScreen,
} from "@/components/mock/mockRegistry";

/**
 * Deep links a state: `/mock?screen=entry&only=welcome&panel=1`.
 *
 * `only` lists the components to show and hides the rest, which is what makes a
 * single state addressable — for sharing a design, and for driving the studio
 * from a headless browser during testing.
 */
function flagsFromUrl(
  screen: MockScreen,
  params: URLSearchParams,
): Record<string, MockFlag> {
  const flags = defaultFlags(screen);
  const only = params.get("only");
  if (!only) return flags;

  const wanted = new Set(only.split(",").filter(Boolean));
  for (const key of Object.keys(flags)) {
    flags[key] = { ...flags[key], visible: wanted.has(key) };
  }
  return flags;
}

export function MockStudio() {
  const params = useSearchParams();
  const urlScreen = params.get("screen") === "entry" ? "entry" : "game";

  const [screen, setScreen] = useState<MockScreen>(urlScreen);
  const [open, setOpen] = useState(params.get("panel") !== "0");
  const [lastAction, setLastAction] = useState("");
  const [flagsByScreen, setFlagsByScreen] = useState<
    Record<MockScreen, Record<string, MockFlag>>
  >({
    game: flagsFromUrl("game", params),
    entry: flagsFromUrl("entry", params),
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
        {screen === "entry" && (
          <EntryMockView flags={flags} onAction={setLastAction} />
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
