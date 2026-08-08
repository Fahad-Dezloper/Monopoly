import boardData from "@/lib/monopoly/boardData.json";
import type { Square } from "@/lib/monopoly/types";

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

type RawTile = Record<string, unknown> & {
  id: number;
  name: string;
  type: string;
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

function blankSquare(index: number, name: string): Square {
  return {
    index,
    name,
    shortName: shortLabel(name),
    pricetext: "",
    color: "#FFFFFF",
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

export function createStaticBoard(): Square[] {
  const meta = boardData.meta;
  const squares: Square[] = Array.from({ length: 40 }, (_, index) =>
    blankSquare(index, `Tile ${index}`),
  );

  for (const raw of boardData.board as unknown as RawTile[]) {
    const square = blankSquare(raw.id, raw.name);
    square.tileType = raw.type;

    if (raw.type === "go") {
      square.shortName = "go";
      square.pricetext = `COLLECT $${meta.go_salary} SALARY AS YOU PASS.`;
    } else if (raw.type === "jail") {
      square.shortName = "jail";
    } else if (raw.type === "free_parking") {
      square.shortName = "parking";
    } else if (raw.type === "go_to_jail") {
      square.shortName = "jail";
    } else if (raw.type === "treasury") {
      square.shortName = "treasury";
    } else if (raw.type === "fortune") {
      square.shortName = "fortune";
    } else if (raw.type === "tax") {
      square.taxAmount = Number(raw.amount ?? 0);
      square.pricetext = `Pay $${square.taxAmount}`;
      square.shortName = "tax";
    } else if (raw.type === "property") {
      const rent = raw.rent as Record<string, number>;
      const group = String(raw.group ?? "");
      square.groupNumber = GROUP_NUMBERS[group] ?? 0;
      square.color = GROUP_COLORS[group] ?? "#FFFFFF";
      square.price = Number(raw.price ?? 0);
      square.mortgageValue = Number(raw.mortgage_value ?? 0);
      square.houseprice = Number(raw.house_cost ?? 0);
      square.hotelprice = Number(raw.hotel_cost ?? 0);
      square.baserent = rent.base;
      square.monopolyrent = rent.monopoly;
      square.rent1 = rent.house_1;
      square.rent2 = rent.house_2;
      square.rent3 = rent.house_3;
      square.rent4 = rent.house_4;
      square.rent5 = rent.hotel;
      square.pricetext = `$${square.price}`;
      square.flagCode = COUNTRY_FLAG[String(raw.country ?? "")];
    } else if (raw.type === "transport") {
      const rent = raw.rent as Record<string, number>;
      square.groupNumber = GROUP_NUMBERS.transport;
      square.color = GROUP_COLORS.transport;
      square.price = Number(raw.price ?? 0);
      square.mortgageValue = Number(raw.mortgage_value ?? 0);
      square.baserent = rent.owned_1;
      square.rent1 = rent.owned_1;
      square.rent2 = rent.owned_2;
      square.rent3 = rent.owned_3;
      square.rent4 = rent.owned_4;
      square.pricetext = `$${square.price}`;
    } else if (raw.type === "utility") {
      const rent = raw.rent as Record<string, number>;
      square.groupNumber = GROUP_NUMBERS.utility;
      square.color = GROUP_COLORS.utility;
      square.price = Number(raw.price ?? 0);
      square.mortgageValue = Number(raw.mortgage_value ?? 0);
      square.rent1 = rent.owned_1_multiplier;
      square.rent2 = rent.owned_2_multiplier;
      square.pricetext = `$${square.price}`;
    }

    squares[raw.id] = square;
  }

  const groups: number[][] = Array.from({ length: 11 }, () => []);
  for (const square of squares) {
    if (square.groupNumber > 0) groups[square.groupNumber].push(square.index);
  }
  for (const square of squares) {
    if (square.groupNumber > 0) square.group = [...groups[square.groupNumber]];
  }

  return squares;
}

export const BOARD_META = boardData.meta;
