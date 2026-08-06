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
              "relative inline-flex h-9 items-center justify-center gap-1.5 overflow-hidden rounded-[10px] border text-[12px] font-bold transition-[flex-grow,background-color,border-color,color] duration-300 ease-out motion-reduce:transition-none",
              active
                ? "flex-3 bg-[#C589FA] text-black"
                : "flex-1 border-line bg-surface px-0 text-dim hover:border-[#3e3e48] hover:text-body",
            )}
          >
            <Icon className="size-4.5 shrink-0" />
            {active && (
              <span
                className={cx(
                  "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-out motion-reduce:transition-none",
                  active ? "max-w-24 opacity-100" : "max-w-0 opacity-0",
                )}
              >
                {label}
              </span>
            )}
            {badge > 0 && (
              <span
                className={cx(
                  "grid h-4 min-w-4 place-items-center rounded-lg bg-accent px-1 text-[10px] font-bold text-white",
                  !active && "absolute h-3.5 min-w-3.5 px-0.5",
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
