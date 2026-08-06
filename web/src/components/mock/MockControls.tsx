"use client";

import {
  MOCK_REGISTRY,
  type MockEntry,
  type MockFlag,
  type MockScreen,
} from "@/components/mock/mockRegistry";
import { cx } from "@/lib/ui";

interface MockControlsProps {
  screen: MockScreen;
  flags: Record<string, MockFlag>;
  open: boolean;
  lastAction: string;
  onScreenChange: (screen: MockScreen) => void;
  onToggleVisible: (key: string) => void;
  onToggleMock: (key: string) => void;
  onAll: (patch: Partial<MockFlag>) => void;
  onOpenChange: (open: boolean) => void;
}

export function MockControls({
  screen,
  flags,
  open,
  lastAction,
  onScreenChange,
  onToggleVisible,
  onToggleMock,
  onAll,
  onOpenChange,
}: MockControlsProps) {
  const entries = MOCK_REGISTRY[screen];
  const groups = entries.reduce<Record<string, MockEntry[]>>((acc, entry) => {
    acc[entry.group] = [...(acc[entry.group] ?? []), entry];
    return acc;
  }, {});

  if (!open) {
    return (
      <button
        type="button"
        className="fixed right-4 bottom-4 z-200 size-11.5 rounded-full border border-line bg-accent text-[20px] text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
        onClick={() => onOpenChange(true)}
        title="Open mock studio"
      >
        🎛
      </button>
    );
  }

  return (
    <aside className="fixed inset-y-0 right-0 z-200 flex w-80 flex-col border-l border-line bg-[#0b0b10] font-sans shadow-[-18px_0_40px_rgba(0,0,0,0.45)]">
      <header className="flex items-start justify-between gap-2 border-b border-line px-3.5 pt-3.5 pb-2.5">
        <div>
          <strong className="block text-[13px]">Mock studio</strong>
          <span className="text-[10.5px] text-dim">design surface — no server, no sockets</span>
        </div>
        <button type="button" className="border-none bg-transparent text-[14px] text-dim hover:text-body" onClick={() => onOpenChange(false)}>
          ✕
        </button>
      </header>

      <div className="flex gap-1 border-b border-line px-3.5 py-2.5">
        {(["game", "lobby", "home"] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={cx("flex-1 rounded-chip border border-line bg-surface p-1.75 text-[11px] text-dim capitalize", screen === value && "border-transparent bg-accent text-white")}
            onClick={() => onScreenChange(value)}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1.25 border-b border-line px-3.5 py-2.5 *:rounded-[7px] *:border *:border-line *:bg-surface *:p-1.5 *:text-[10.5px] *:text-dim *:hover:border-accent *:hover:text-body">
        <button type="button" onClick={() => onAll({ mock: true, visible: true })}>
          All mock
        </button>
        <button type="button" onClick={() => onAll({ mock: false })}>
          All empty
        </button>
        <button type="button" onClick={() => onAll({ visible: true })}>
          Show all
        </button>
        <button type="button" onClick={() => onAll({ visible: false })}>
          Hide all
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3.5 pt-2 pb-3.5 [scrollbar-color:var(--color-line)_transparent] scrollbar-thin">
        {Object.entries(groups).map(([group, items]) => (
          <section key={group} className="mt-2.5">
            <h3 className="mt-0 mb-1.5 text-[9.5px] tracking-[0.12em] text-[#6d6c80] uppercase">{group}</h3>
            {items.map((entry) => {
              const flag = flags[entry.key];
              return (
                <div
                  key={entry.key}
                  className={cx("mb-1 flex items-center gap-2 rounded-[9px] border border-line bg-surface px-2 py-1.5", !flag.visible && "opacity-45")}
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={flag.visible}
                      onChange={() => onToggleVisible(entry.key)}
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[11.5px] font-semibold">{entry.label}</span>
                      <span className="truncate text-[9.5px] text-[#6d6c80]">{entry.file}</span>
                    </span>
                  </label>
                  <button
                    type="button"
                    className={cx("w-14.5 shrink-0 rounded-full border py-1.25 text-[10px] font-bold", flag.mock ? "border-transparent bg-good text-[#0b0b0f]" : "border-line bg-[#1c1c24] text-dim")}
                    onClick={() => onToggleMock(entry.key)}
                    title={
                      flag.mock
                        ? "Showing mock data — click for the empty state"
                        : "Showing the empty state — click for mock data"
                    }
                  >
                    <span>{flag.mock ? "mock" : "empty"}</span>
                  </button>
                </div>
              );
            })}
          </section>
        ))}
      </div>

      <footer className="border-t border-line px-3.5 py-2.5 text-[10px]">
        <span className="mb-0.75 block tracking-[0.1em] text-[#6d6c80] uppercase">last action</span>
        <code className="block max-h-12 overflow-auto break-all text-accent">{lastAction || "—"}</code>
      </footer>
    </aside>
  );
}
