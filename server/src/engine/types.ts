export type PlayerColor =
  | "aqua"
  | "black"
  | "blue"
  | "fuchsia"
  | "gray"
  | "green"
  | "lime"
  | "maroon"
  | "navy"
  | "olive"
  | "orange"
  | "purple"
  | "red"
  | "silver"
  | "teal"
  | "yellow";

export interface Square {
  index: number;
  name: string;
  /** Short label shown on the board tile. */
  shortName?: string;
  /** ISO 3166-1 alpha-2 country code for flag image, if any. */
  flagCode?: string;
  pricetext: string;
  color: string;
  owner: number;
  mortgage: boolean;
  house: number;
  hotel: number;
  groupNumber: number;
  price: number;
  baserent: number;
  /** Rent when full color set is owned and no houses are built. */
  monopolyrent: number;
  rent1: number;
  rent2: number;
  rent3: number;
  rent4: number;
  rent5: number;
  houseprice: number;
  hotelprice: number;
  /** Listed mortgage cash from board dataset. */
  mortgageValue: number;
  /** Tax tile amount (0 for non-tax). */
  taxAmount: number;
  /** Raw tile type from monopoly_board_game.json */
  tileType?: string;
  landcount: number;
  group: number[];
}

export interface Player {
  index: number;
  name: string;
  color: PlayerColor;
  position: number;
  money: number;
  creditor: number;
  jail: boolean;
  jailroll: number;
  communityChestJailCard: boolean;
  chanceJailCard: boolean;
  bidding: boolean;
}

export interface PlayerSetup {
  name: string;
  color: PlayerColor;
}

export type ControlTab = "buy" | "manage" | "trade";
export type Phase =
  | "setup"
  | "turn_start"
  | "rolled"
  | "card"
  | "auction"
  | "trade"
  | "game_over";

export interface PopupState {
  open: boolean;
  title?: string;
  message: string;
  mode: "ok" | "yesno" | "blank";
  resolveId?: string;
}

export interface AuctionState {
  propertyIndex: number;
  highestBid: number;
  highestBidder: number;
  currentBidder: number;
  message?: string;
}

export interface TradeDraft {
  initiator: number;
  recipient: number;
  leftMoney: number;
  rightMoney: number;
  properties: number[]; // 1 offered, -1 requested, 0 neither
  communityChestJailCard: number;
  chanceJailCard: number;
  awaitingResponse: boolean;
}

export interface CardState {
  type: "chance" | "community";
  index: number;
  text: string;
}

export interface GameState {
  phase: Phase;
  squares: Square[];
  players: Player[];
  playerCount: number;
  turn: number;
  doubleCount: number;
  die1: number;
  die2: number;
  diceRolled: boolean;
  alerts: string[];
  landedMessage: string;
  controlTab: ControlTab;
  nextButtonLabel: string;
  nextButtonTitle: string;
  selectedProperty: number;
  auctionQueue: number[];
  auction: AuctionState | null;
  trade: TradeDraft | null;
  popup: PopupState | null;
  card: CardState | null;
  chanceDeck: number[];
  chanceIndex: number;
  communityDeck: number[];
  communityIndex: number;
  showStats: boolean;
  winner: number | null;
  housesAvailable: number;
  hotelsAvailable: number;
  /** Absolute timestamp when the current turn expires (auto-pass). */
  turnDeadlineAt: number;
}
