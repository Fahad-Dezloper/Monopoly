export type MockScreen = "game" | "entry";

export interface MockEntry {
  key: string;
  label: string;
  file: string;
  group: string;
}

export const MOCK_REGISTRY: Record<MockScreen, MockEntry[]> = {
  game: [
    {
      key: "topbar",
      label: "GameTopBar",
      file: "game/GameTopBar.tsx",
      group: "Shell",
    },
    {
      key: "rail",
      label: "LeftRail (money + chat)",
      file: "game/rail/LeftRail.tsx",
      group: "Left rail",
    },
    {
      key: "board",
      label: "GameBoard",
      file: "game/board/GameBoard.tsx",
      group: "Board",
    },
    {
      key: "panel",
      label: "RightRail",
      file: "game/rail/RightRail.tsx",
      group: "Right rail",
    },
    {
      key: "auction",
      label: "AuctionDialog",
      file: "game/dialogs/AuctionDialog.tsx",
      group: "Dialogs",
    },
    {
      key: "card",
      label: "CardDialog",
      file: "game/dialogs/CardDialog.tsx",
      group: "Dialogs",
    },
    {
      key: "trade",
      label: "TradeDialog",
      file: "game/dialogs/TradeDialog.tsx",
      group: "Dialogs",
    },
    {
      key: "stats",
      label: "StatsDialog",
      file: "game/dialogs/StatsDialog.tsx",
      group: "Dialogs",
    },
    {
      key: "rules",
      label: "RulesDialog",
      file: "game/dialogs/RulesDialog.tsx",
      group: "Dialogs",
    },
    {
      key: "gameover",
      label: "Game over banner",
      file: "game/GameScreen.tsx",
      group: "Shell",
    },
  ],
  entry: [
    {
      key: "backdrop",
      label: "EntryBackdrop",
      file: "entry/EntryBackdrop.tsx",
      group: "Behind",
    },
    {
      key: "welcome",
      label: "WelcomeDialog",
      file: "entry/WelcomeDialog.tsx",
      group: "Steps",
    },
    {
      key: "create",
      label: "CreateRoomDialog",
      file: "entry/CreateRoomDialog.tsx",
      group: "Steps",
    },
    {
      key: "join",
      label: "JoinRoomDialog",
      file: "entry/JoinRoomDialog.tsx",
      group: "Steps",
    },
    {
      key: "lobby",
      label: "LobbyDialog",
      file: "entry/LobbyDialog.tsx",
      group: "Steps",
    },
  ],
};

export const DIALOG_KEYS = [
  "auction",
  "card",
  "trade",
  "stats",
  "rules",
  "gameover",
];

const ENTRY_DEFAULT_VISIBLE = ["backdrop", "welcome"];

export interface MockFlag {
  visible: boolean;
  mock: boolean;
}

export function defaultFlags(screen: MockScreen): Record<string, MockFlag> {
  const entries = MOCK_REGISTRY[screen];
  const flags: Record<string, MockFlag> = {};
  for (const entry of entries) {
    flags[entry.key] = {
      visible:
        screen === "entry"
          ? ENTRY_DEFAULT_VISIBLE.includes(entry.key)
          : !DIALOG_KEYS.includes(entry.key),
      mock: true,
    };
  }
  return flags;
}
