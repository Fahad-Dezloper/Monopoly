import boardData from "../data/monopoly_board_game.json";
import type { Square } from "./types";

export type BoardDataset = typeof boardData;

export const BOARD_DATA: BoardDataset = boardData;

export const GAME_META = BOARD_DATA.meta;
export const BUILDING_RULES = BOARD_DATA.building_rules;
export const MORTGAGE_RULES = BOARD_DATA.mortgage_rules;

export const CHANCE_TEXTS = [...BOARD_DATA.fortune_cards];
export const COMMUNITY_CHEST_TEXTS = [...BOARD_DATA.treasury_cards];

const GROUP_COLORS: Record<string, string> = {
  india: "#8B4513",
  china: "#87CEEB",
  brazil: "#FF0080",
  russia: "#FFA500",
  germany: "#FF0000",
  australia: "#FFFF00",
  uk: "#008000",
  usa: "#0000FF",
  transport: "#FFFFFF",
  utility: "#FFFFFF",
};

const GROUP_NUMBERS: Record<string, number> = {
  transport: 1,
  utility: 2,
  india: 3,
  china: 4,
  brazil: 5,
  russia: 6,
  germany: 7,
  australia: 8,
  uk: 9,
  usa: 10,
};

const COUNTRY_FLAG: Record<string, string> = {
  India: "in",
  China: "cn",
  Brazil: "br",
  Russia: "ru",
  Germany: "de",
  Australia: "au",
  UK: "gb",
  USA: "us",
};

const DESTINATION_ALIASES: Record<string, string> = {
  "Grand Promenade": "New York City",
  Pacifica: "Frankfurt",
};

function shortLabel(name: string): string {
  const cleaned = name.replace(/\./g, "").trim();
  if (cleaned.length <= 10) return cleaned.toLowerCase();
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return cleaned.slice(0, 9).toLowerCase();
  if (parts[0].length <= 3)
    return `${parts[0]} ${parts[1]}`.toLowerCase().slice(0, 10);
  return parts[0].toLowerCase().slice(0, 10);
}

function emptySquare(index: number, name: string, color = "#FFFFFF"): Square {
  return {
    index,
    name,
    shortName: shortLabel(name),
    pricetext: "",
    color,
    owner: 0,
    mortgage: false,
    house: 0,
    hotel: 0,
    groupNumber: 0,
    price: 0,
    baserent: 0,
    monopolyrent: 0,
    rent1: 0,
    rent2: 0,
    rent3: 0,
    rent4: 0,
    rent5: 0,
    houseprice: 0,
    hotelprice: 0,
    mortgageValue: 0,
    taxAmount: 0,
    tileType: "special",
    landcount: 0,
    group: [],
  };
}

export function createClassicBoard(): Square[] {
  const squares: Square[] = Array.from({ length: 40 }, (_, i) =>
    emptySquare(i, `Tile ${i}`),
  );

  for (const tile of BOARD_DATA.board) {
    const sq = emptySquare(tile.id, tile.name);
    sq.tileType = tile.type;

    switch (tile.type) {
      case "go":
        sq.shortName = "go";
        sq.pricetext = `COLLECT $${GAME_META.go_salary} SALARY AS YOU PASS.`;
        break;
      case "jail":
        sq.shortName = "jail";
        break;
      case "free_parking":
        sq.shortName = "parking";
        break;
      case "go_to_jail":
        sq.shortName = "jail";
        sq.pricetext =
          "Go directly to Jail. Do not pass GO. Do not collect $200.";
        break;
      case "treasury":
        sq.shortName = "treasury";
        sq.pricetext = "FOLLOW INSTRUCTIONS ON TOP CARD";
        break;
      case "fortune":
        sq.shortName = "fortune";
        sq.pricetext = "FOLLOW INSTRUCTIONS ON TOP CARD";
        break;
      case "tax": {
        const amount = Number(
          "amount" in tile ? (tile as { amount: number }).amount : 0,
        );
        sq.taxAmount = amount;
        sq.pricetext = `Pay $${amount}`;
        sq.shortName = "tax";
        break;
      }
      case "property": {
        const group = String(
          "group" in tile ? (tile as { group: string }).group : "",
        );
        const country = String(
          "country" in tile ? (tile as { country: string }).country : "",
        );
        const rent = (
          tile as {
            rent: {
              base: number;
              monopoly: number;
              house_1: number;
              house_2: number;
              house_3: number;
              house_4: number;
              hotel: number;
            };
          }
        ).rent;
        const price = Number((tile as { price: number }).price);
        sq.groupNumber = GROUP_NUMBERS[group] ?? 0;
        sq.color = GROUP_COLORS[group] ?? "#FFFFFF";
        sq.price = price;
        sq.mortgageValue = Number(
          (tile as { mortgage_value: number }).mortgage_value,
        );
        sq.houseprice = Number((tile as { house_cost: number }).house_cost);
        sq.hotelprice = Number((tile as { hotel_cost: number }).hotel_cost);
        sq.baserent = rent.base;
        sq.monopolyrent = rent.monopoly;
        sq.rent1 = rent.house_1;
        sq.rent2 = rent.house_2;
        sq.rent3 = rent.house_3;
        sq.rent4 = rent.house_4;
        sq.rent5 = rent.hotel;
        sq.pricetext = `$${price}`;
        sq.flagCode = COUNTRY_FLAG[country];
        break;
      }
      case "transport": {
        const rent = (
          tile as {
            rent: {
              owned_1: number;
              owned_2: number;
              owned_3: number;
              owned_4: number;
            };
          }
        ).rent;
        const price = Number((tile as { price: number }).price);
        sq.groupNumber = GROUP_NUMBERS.transport;
        sq.color = GROUP_COLORS.transport;
        sq.price = price;
        sq.mortgageValue = Number(
          (tile as { mortgage_value: number }).mortgage_value,
        );
        sq.baserent = rent.owned_1;
        sq.rent1 = rent.owned_1;
        sq.rent2 = rent.owned_2;
        sq.rent3 = rent.owned_3;
        sq.rent4 = rent.owned_4;
        sq.pricetext = `$${price}`;
        sq.shortName = shortLabel(tile.name);
        break;
      }
      case "utility": {
        const rent = (
          tile as {
            rent: {
              owned_1_multiplier: number;
              owned_2_multiplier: number;
            };
          }
        ).rent;
        const price = Number((tile as { price: number }).price);
        sq.groupNumber = GROUP_NUMBERS.utility;
        sq.color = GROUP_COLORS.utility;
        sq.price = price;
        sq.mortgageValue = Number(
          (tile as { mortgage_value: number }).mortgage_value,
        );
        sq.rent1 = rent.owned_1_multiplier;
        sq.rent2 = rent.owned_2_multiplier;
        sq.pricetext = `$${price}`;
        sq.shortName = shortLabel(tile.name);
        break;
      }
      default:
        break;
    }

    squares[tile.id] = sq;
  }

  const groups: number[][] = Array.from({ length: 11 }, () => []);
  for (const s of squares) {
    if (s.groupNumber > 0) groups[s.groupNumber].push(s.index);
  }
  for (const s of squares) {
    if (s.groupNumber > 0) s.group = [...groups[s.groupNumber]];
  }

  return squares;
}

export function findSquareIndexByName(name: string): number {
  const alias = DESTINATION_ALIASES[name] ?? name;
  const lower = alias.toLowerCase();
  const board = createClassicBoard();
  const hit = board.find((s) => s.name.toLowerCase() === lower);
  return hit?.index ?? -1;
}

let cachedBoard: Square[] | null = null;
function boardSnapshot(): Square[] {
  if (!cachedBoard) cachedBoard = createClassicBoard();
  return cachedBoard;
}

export function squareIndexByName(name: string): number {
  const alias = DESTINATION_ALIASES[name] ?? name;
  const lower = alias.toLowerCase();
  const hit = boardSnapshot().find((s) => s.name.toLowerCase() === lower);
  return hit?.index ?? -1;
}

export const PLAYER_COLORS = [
  "aqua",
  "black",
  "blue",
  "fuchsia",
  "gray",
  "green",
  "lime",
  "maroon",
  "navy",
  "olive",
  "orange",
  "purple",
  "red",
  "silver",
  "teal",
  "yellow",
] as const;

export const DEFAULT_COLORS = [
  "yellow",
  "blue",
  "red",
  "lime",
  "green",
  "aqua",
  "orange",
  "purple",
] as const;

export const BOARD_LAYOUT: { index: number; row: number; col: number }[] = [
  ...Array.from({ length: 11 }, (_, i) => ({
    index: 20 + i,
    row: 1,
    col: i + 1,
  })),
  ...Array.from({ length: 9 }, (_, i) => ({
    index: 31 + i,
    row: i + 2,
    col: 11,
  })),
  ...Array.from({ length: 11 }, (_, i) => ({
    index: 10 - i,
    row: 11,
    col: i + 1,
  })),
  ...Array.from({ length: 9 }, (_, i) => ({
    index: 19 - i,
    row: i + 2,
    col: 1,
  })),
];

export function cellSide(
  index: number,
): "corner" | "top" | "right" | "bottom" | "left" {
  if ([0, 10, 20, 30].includes(index)) return "corner";
  if (index > 20 && index < 30) return "top";
  if (index > 30 && index < 40) return "right";
  if (index > 0 && index < 10) return "bottom";
  return "left";
}

export function flagUrl(code: string, size = 64): string {
  return `https://flagcdn.com/w${size}/${code.toLowerCase()}.png`;
}

export const FLAG_EMOJI: Record<string, string> = {
  in: "🇮🇳",
  cn: "🇨🇳",
  br: "🇧🇷",
  ru: "🇷🇺",
  de: "🇩🇪",
  au: "🇦🇺",
  gb: "🇬🇧",
  us: "🇺🇸",
};
