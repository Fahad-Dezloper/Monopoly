import type { Player } from "@/lib/monopoly/types";

export interface ActivityLine {
  player: Player | null;
  rest: string;
  icon: string;
}

const ICON_RULES: { match: RegExp; icon: string }[] = [
  { match: /rent/, icon: "💸" },
  { match: /bought|buy/, icon: "🏠" },
  { match: /landed/, icon: "📍" },
  { match: /jail/, icon: "🚔" },
  { match: /rolled/, icon: "🎲" },
  { match: /wins/, icon: "🏆" },
  { match: /eliminated|resigned/, icon: "☠️" },
  { match: /salary|received/, icon: "💵" },
  { match: /house|hotel/, icon: "🏗️" },
  { match: /auction/, icon: "🔨" },
];

export function activityIcon(text: string): string {
  const lower = text.toLowerCase();
  return ICON_RULES.find((rule) => rule.match.test(lower))?.icon ?? "•";
}

export function parseActivity(text: string, players: Player[]): ActivityLine {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const candidates = players
    .filter((player) => player.index > 0 && player.name.trim())
    .sort((a, b) => b.name.length - a.name.length);

  for (const player of candidates) {
    const name = player.name.trim();
    if (lower.startsWith(name.toLowerCase())) {
      return {
        player,
        rest: trimmed.slice(name.length).trimStart(),
        icon: activityIcon(trimmed),
      };
    }
  }

  return { player: null, rest: trimmed, icon: activityIcon(trimmed) };
}
