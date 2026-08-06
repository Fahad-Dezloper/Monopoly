export type MockScreen = "game" | "lobby" | "home";

export interface MockEntry {
  key: string;
  label: string;
  file: string;
  group: string;
}

export const MOCK_REGISTRY: Record<MockScreen, MockEntry[]> = {
  game: [
    { key: "topbar", label: "GameTopBar", file: "game/GameTopBar.tsx", group: "Shell" },
    { key: "banner", label: "TurnBanner", file: "game/TurnBanner.tsx", group: "Shell" },
    { key: "rail", label: "PlayerRail", file: "game/rail/PlayerRail.tsx", group: "Left rail" },
    { key: "board", label: "GameBoard", file: "game/board/GameBoard.tsx", group: "Board" },
    { key: "actionbar", label: "ActionBar", file: "game/ActionBar.tsx", group: "Shell" },
    { key: "panel", label: "PropertyPanel", file: "game/property/PropertyPanel.tsx", group: "Right rail" },
    { key: "dock", label: "GameDock", file: "game/dock/GameDock.tsx", group: "Dock" },
    { key: "auction", label: "AuctionDialog", file: "game/dialogs/AuctionDialog.tsx", group: "Dialogs" },
    { key: "card", label: "CardDialog", file: "game/dialogs/CardDialog.tsx", group: "Dialogs" },
    { key: "trade", label: "TradeDialog", file: "game/dialogs/TradeDialog.tsx", group: "Dialogs" },
    { key: "stats", label: "StatsDialog", file: "game/dialogs/StatsDialog.tsx", group: "Dialogs" },
    { key: "rules", label: "RulesDialog", file: "game/dialogs/RulesDialog.tsx", group: "Dialogs" },
    { key: "gameover", label: "Game over banner", file: "game/GameScreen.tsx", group: "Shell" },
  ],
  lobby: [
    { key: "lobby", label: "LobbyScreen", file: "lobby/LobbyScreen.tsx", group: "Lobby" },
  ],
  home: [
    { key: "nav", label: "HomeNav", file: "home/HomeNav.tsx", group: "Home" },
    { key: "hero", label: "HeroSection", file: "home/HeroSection.tsx", group: "Home" },
    { key: "features", label: "FeatureStrip", file: "home/FeatureStrip.tsx", group: "Home" },
    { key: "steps", label: "HowToPlaySteps", file: "home/HowToPlaySteps.tsx", group: "Home" },
    { key: "panel", label: "CreateJoinPanel", file: "home/CreateJoinPanel.tsx", group: "Home" },
  ],
};

export const DIALOG_KEYS = ["auction", "card", "trade", "stats", "rules", "gameover"];

export interface MockFlag {
  visible: boolean;
  mock: boolean;
}

export function defaultFlags(screen: MockScreen): Record<string, MockFlag> {
  const entries = MOCK_REGISTRY[screen];
  const flags: Record<string, MockFlag> = {};
  for (const entry of entries) {
    flags[entry.key] = {
      visible: !DIALOG_KEYS.includes(entry.key),
      mock: true,
    };
  }
  return flags;
}
