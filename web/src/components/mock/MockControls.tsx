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
        className="fixed right-4 bottom-4 z-200 size-11.5 rounded-full border border-[#e9e2ff] bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-[20px] text-white shadow-lg"
        onClick={() => onOpenChange(true)}
        title="Open mock studio"
      >
        🎛
      </button>
    );
  }

  return (
    <aside className="fixed inset-y-0 right-0 z-200 flex w-80 flex-col border-l border-[#e9e2ff] bg-white font-sans text-slate-800 shadow-[-18px_0_40px_rgba(109,40,217,0.08)]">
      <header className="flex items-start justify-between gap-2 border-b border-[#e9e2ff] px-3.5 pt-3.5 pb-2.5">
        <div>
          <strong className="block text-[13px] text-slate-900">
            Mock studio
          </strong>
          <span className="text-[10.5px] text-slate-400">
            design surface — no server, no sockets
          </span>
        </div>
        <button
          type="button"
          className="border-none bg-transparent text-[14px] text-slate-400 hover:text-slate-700"
          onClick={() => onOpenChange(false)}
        >
          ✕
        </button>
      </header>

      <div className="flex gap-1 border-b border-[#e9e2ff] px-3.5 py-2.5">
        {(["game", "entry"] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={cx(
              "flex-1 rounded-full border border-[#e9e2ff] bg-[#f8f6ff] p-1.75 text-[11px] font-semibold text-slate-500 capitalize hover:border-[#7c3aed]/35",
              screen === value &&
                "border-transparent bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white",
            )}
            onClick={() => onScreenChange(value)}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1.25 border-b border-[#e9e2ff] px-3.5 py-2.5 *:rounded-xl *:border *:border-[#e9e2ff] *:bg-[#fdfcff] *:p-1.5 *:text-[10.5px] *:font-semibold *:text-slate-600 *:hover:border-[#7c3aed]/40 *:hover:bg-[#f8f6ff] *:hover:text-[#7c3aed]">
        <button
          type="button"
          onClick={() => onAll({ mock: true, visible: true })}
        >
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

      <div className="min-h-0 flex-1 overflow-y-auto px-3.5 pt-2 pb-3.5 [scrollbar-color:#e9e2ff_transparent] scrollbar-thin">
        {Object.entries(groups).map(([group, items]) => (
          <section key={group} className="mt-2.5">
            <h3 className="mt-0 mb-1.5 text-[9.5px] font-extrabold tracking-[0.12em] text-[#7c3aed] uppercase">
              {group}
            </h3>
            {items.map((entry) => {
              const flag = flags[entry.key];
              return (
                <div
                  key={entry.key}
                  className={cx(
                    "mb-1 flex items-center gap-2 rounded-xl border border-[#e9e2ff] bg-[#fdfcff] px-2 py-1.5",
                    !flag.visible && "opacity-45",
                  )}
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={flag.visible}
                      onChange={() => onToggleVisible(entry.key)}
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[11.5px] font-semibold text-slate-800">
                        {entry.label}
                      </span>
                      <span className="truncate text-[9.5px] text-slate-400">
                        {entry.file}
                      </span>
                    </span>
                  </label>
                  <button
                    type="button"
                    className={cx(
                      "w-14.5 shrink-0 rounded-full border py-1.25 text-[10px] font-bold",
                      flag.mock
                        ? "border-transparent bg-emerald-500 text-white"
                        : "border-[#e9e2ff] bg-white text-slate-400",
                    )}
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

      <footer className="border-t border-[#e9e2ff] px-3.5 py-2.5 text-[10px]">
        <span className="mb-0.75 block tracking-[0.1em] text-slate-400 uppercase">
          last action
        </span>
        <code className="block max-h-12 overflow-auto break-all text-[#7c3aed]">
          {lastAction || "—"}
        </code>
      </footer>
    </aside>
  );
}
