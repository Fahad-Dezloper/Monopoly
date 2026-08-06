"use client";

import { useState } from "react";
import { ActivityFeed } from "@/components/game/rail/ActivityFeed";
import { DealsPanel } from "@/components/game/rail/DealsPanel";
import { RailTabs, type RailTab } from "@/components/game/rail/RailTabs";
import { ChatComposer } from "@/components/shared/ChatComposer";
import { ChatFeed } from "@/components/shared/ChatFeed";
import type { ChatMessage } from "@/lib/api/types";
import type { GameState } from "@/lib/monopoly/types";

const TAB_TITLE: Record<RailTab, string> = {
  log: "Game Log",
  chat: "Chat",
  deals: "Deals",
};

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
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
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
          emptyLabel="say something to the table"
        />
      )}

      {tab === "deals" && (
        <DealsPanel
          state={state}
          mySeat={mySeat}
          canTrade={canTrade}
          onOpenTrade={onOpenTrade}
        />
      )}

      {tab === "chat" && (
        <ChatComposer onSend={onSendChat} onFocus={() => openTab("chat")} />
      )}
    </div>
  );
}
