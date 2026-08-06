import type { PlayerSetup, TradeDraft } from "./types";
import type { GameState } from "./types";

export type GameAction =
  | { type: "START"; setups: PlayerSetup[] }
  | { type: "NEXT" }
  | { type: "BUY" }
  | { type: "DECLINE_BUY" }
  | { type: "PAY_JAIL_FINE" }
  | { type: "USE_JAIL_CARD" }
  | { type: "SET_TAB"; tab: GameState["controlTab"] }
  | { type: "SELECT_PROPERTY"; index: number }
  | { type: "BUY_HOUSE"; index?: number }
  | { type: "SELL_HOUSE"; index?: number }
  | { type: "MORTGAGE" }
  | { type: "UNMORTGAGE" }
  | { type: "POPUP_OK" }
  | { type: "POPUP_YES" }
  | { type: "POPUP_NO" }
  | { type: "AUCTION_BID"; amount: number }
  | { type: "AUCTION_PASS" }
  | { type: "AUCTION_EXIT" }
  | { type: "OPEN_TRADE"; recipient: number }
  | { type: "UPDATE_TRADE"; trade: TradeDraft }
  | { type: "PROPOSE_TRADE" }
  | { type: "ACCEPT_TRADE" }
  | { type: "CANCEL_TRADE" }
  | { type: "TOGGLE_STATS" }
  | { type: "RESIGN" }
  | { type: "AI_BUY_IF"; shouldBuy: boolean }
  | { type: "AI_BID"; amount: number }
  | { type: "SKIP_TURN" };
