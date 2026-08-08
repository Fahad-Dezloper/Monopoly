"use client";

import { useState } from "react";
import { ActivityFeed } from "@/components/game/rail/ActivityFeed";
import { DealsPanel } from "@/components/game/rail/DealsPanel";
import { RailTabs, type RailTab } from "@/components/game/rail/RailTabs";
import { ChatComposer } from "@/components/shared/ChatComposer";
import { ChatFeed } from "@/components/shared/ChatFeed";
import type { ChatMessage } from "@/lib/api/types";
import type { GameState } from "@/lib/monopoly/types";

interface RailChatPanelProps {
  state: GameState;
  mySeat: number | null;
  messages: ChatMessage[];
  playerId: string;
  canTrade: boolean;
  onSendChat: (text: string) => void;
  onOpenTrade: (recipient?: number) => void;
}

export function RailChatPanel({
  state,
  mySeat,
  messages,
  playerId,
  canTrade,
  onSendChat,
  onOpenTrade,
}: RailChatPanelProps) {
  const [tab, setTab] = useState<RailTab>("log");
  const [seenChat, setSeenChat] = useState(messages.length);

  const unread = tab === "chat" ? 0 : Math.max(0, messages.length - seenChat);
  const pendingDeals = state.trade ? 1 : 0;

  const openTab = (next: RailTab) => {
    setSeenChat(messages.length);
    setTab(next);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <RailTabs
        tab={tab}
        unread={unread}
        pendingDeals={pendingDeals}
        onTabChange={openTab}
      />
      {tab === "log" && (
        <ActivityFeed alerts={state.alerts} players={state.players} />
      )}

      {tab === "chat" && (
        <ChatFeed
          messages={messages}
          playerId={playerId}
          emptyLabel="Say something to the table"
          className="!rounded-2xl !border-line !bg-white !text-slate-700"
        />
      )}

      {tab === "deals" && (
        <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-line bg-white p-2">
          <DealsPanel
            state={state}
            mySeat={mySeat}
            canTrade={canTrade}
            onOpenTrade={onOpenTrade}
          />
        </div>
      )}

      {tab === "chat" && (
        <ChatComposer onSend={onSendChat} onFocus={() => openTab("chat")} />
      )}
    </div>
  );
}
