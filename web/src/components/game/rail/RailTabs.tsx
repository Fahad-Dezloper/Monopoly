"use client";

import { ChatIcon, DealsIcon, LogIcon } from "@/components/shared/icons";
import { cx } from "@/lib/ui";

export type RailTab = "log" | "chat" | "deals";

const TABS: {
  key: RailTab;
  label: string;
  Icon: (props: { className?: string }) => React.ReactElement;
}[] = [
  { key: "log", label: "Log", Icon: LogIcon },
  { key: "chat", label: "Chat", Icon: ChatIcon },
  { key: "deals", label: "Deals", Icon: DealsIcon },
];

interface RailTabsProps {
  tab: RailTab;
  unread: number;
  pendingDeals: number;
  onTabChange: (tab: RailTab) => void;
}

export function RailTabs({
  tab,
  unread,
  pendingDeals,
  onTabChange,
}: RailTabsProps) {
  return (
    <div className="flex gap-1.5">
      {TABS.map(({ key, label, Icon }) => {
        const active = tab === key;
        const badge =
          key === "chat" ? unread : key === "deals" ? pendingDeals : 0;

        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            title={label}
            onClick={() => onTabChange(key)}
            className={cx(
              "relative inline-flex h-9 items-center justify-center gap-1.5 overflow-hidden rounded-2xl border text-[12px] font-bold transition-all",
              active
                ? "flex-3 border-[#e9e2ff] bg-white text-[#7c3aed] shadow-sm"
                : "flex-1 border-[#e9e2ff] bg-white/80 text-slate-400 hover:border-[#7c3aed]/30 hover:bg-[#f8f6ff] hover:text-[#7c3aed]",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {active && (
              <span className="overflow-hidden whitespace-nowrap">{label}</span>
            )}
            {badge > 0 && (
              <span
                className={cx(
                  "grid h-4 min-w-4 place-items-center rounded-full bg-[#7c3aed] px-1 text-[10px] font-bold text-white",
                  !active && "absolute top-1 right-1 h-3.5 min-w-3.5",
                )}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
