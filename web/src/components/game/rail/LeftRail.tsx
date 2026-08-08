"use client";

import { ChatComposer } from "@/components/shared/ChatComposer";
import { ChatFeed } from "@/components/shared/ChatFeed";
import type { ChatMessage } from "@/lib/api/types";
import { money } from "@/lib/monopoly/panelView";
import { playerHoldings } from "@/lib/monopoly/stats";
import type { GameState } from "@/lib/monopoly/types";

interface LeftRailProps {
  state: GameState;
  mySeat: number | null;
  playerId: string;
  messages: ChatMessage[];
  onSendChat: (text: string) => void;
}

export function LeftRail({
  state,
  mySeat,
  playerId,
  messages,
  onSendChat,
}: LeftRailProps) {
  const holdings = mySeat != null ? playerHoldings(state, mySeat) : null;
  const worth = holdings ? holdings.cash + holdings.invested : 0;
  const cashShare =
    holdings && worth > 0 ? Math.round((holdings.cash / worth) * 100) : 0;

  return (
    <aside className="flex h-full min-h-0 w-full flex-col gap-2">
      {/* MONEY CARD */}
      <section className="shrink-0 rounded-2xl border border-[#e9e2ff] bg-white p-3 shadow-sm">
        <div className="mb-1 text-[10px] font-extrabold tracking-wider text-[#7c3aed] uppercase">
          Your money
        </div>
        {holdings ? (
          <>
            <div className="text-[24px] leading-none font-black tabular-nums text-emerald-600">
              {money(holdings.cash)}
            </div>
            <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-[#e9e2ff]">
              <span
                className="bg-emerald-500"
                style={{ width: `${cashShare}%` }}
                aria-hidden
              />
              <span
                className="bg-[#7c3aed]"
                style={{ width: `${100 - cashShare}%` }}
                aria-hidden
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] font-semibold text-slate-400">
              <span>{cashShare}% liquid</span>
              <span>Net {money(worth)}</span>
            </div>
          </>
        ) : (
          <p className="text-[12px] text-slate-400">Not seated</p>
        )}
      </section>

      {/* CHAT — full remaining height */}
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#e9e2ff] bg-white shadow-sm">
        <header className="flex shrink-0 items-center gap-1.5 border-b border-[#e9e2ff] px-3 py-2">
          <span className="text-[11px] font-extrabold tracking-wider text-[#7c3aed] uppercase">
            Chat
          </span>
        </header>
        <ChatFeed
          messages={messages}
          playerId={playerId}
          emptyLabel="Say hi to the table…"
          className="!min-h-0 !flex-1 !rounded-none !border-0 !bg-transparent"
        />
        <div className="shrink-0 border-t border-[#e9e2ff] p-2">
          <ChatComposer onSend={onSendChat} placeholder="Message the table…" />
        </div>
      </section>
    </aside>
  );
}
