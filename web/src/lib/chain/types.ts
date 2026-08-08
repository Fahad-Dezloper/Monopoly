import type { BN } from "@coral-xyz/anchor";
import type { PublicKey } from "@solana/web3.js";

/**
 * The `Game` account as Anchor's borsh coder actually hands it back: struct
 * fields keep the snake_case names from the IDL, and enums arrive as a single
 * PascalCase key matching the Rust variant.
 */

export type OnchainPhase =
  | { Lobby: Record<string, never> }
  | { TurnStart: Record<string, never> }
  | { AwaitingDice: Record<string, never> }
  | { Rolled: Record<string, never> }
  | { Card: Record<string, never> }
  | { Auction: Record<string, never> }
  | { GameOver: Record<string, never> };

export type OnchainPending =
  | { None: Record<string, never> }
  | { GoToJail: Record<string, never> }
  | { JailFine: Record<string, never> }
  | { Card: { fortune: boolean; index: number } };

export type OnchainVrfPurpose =
  | { None: Record<string, never> }
  | { Setup: Record<string, never> }
  | { Dice: Record<string, never> };

export interface OnchainPlayer {
  wallet: PublicKey;
  name: number[];
  color: number;
  cash: BN;
  position: number;
  creditor: number;
  in_jail: boolean;
  jail_rolls: number;
  fortune_jail_card: boolean;
  treasury_jail_card: boolean;
  bidding: boolean;
  active: boolean;
}

export interface OnchainSquare {
  owner: number;
  houses: number;
  hotel: boolean;
  mortgaged: boolean;
  land_count: number;
}

export interface OnchainAuction {
  active: boolean;
  square: number;
  highest_bid: number;
  highest_bidder: number;
  current_bidder: number;
}

export interface OnchainTrade {
  active: boolean;
  initiator: number;
  recipient: number;
  initiator_cash: number;
  recipient_cash: number;
  squares: number[];
  awaiting_response: boolean;
}

export interface OnchainGame {
  code: number[];
  host: PublicKey;
  bump: number;
  phase: OnchainPhase;
  player_count: number;
  turn: number;
  double_count: number;
  die1: number;
  die2: number;
  dice_rolled: boolean;
  winner: number;
  houses_available: number;
  hotels_available: number;
  turn_deadline: BN;
  pending: OnchainPending;
  players: OnchainPlayer[];
  squares: OnchainSquare[];
  fortune_deck: number[];
  fortune_index: number;
  treasury_deck: number[];
  treasury_index: number;
  auction_queue: number[];
  auction_queue_len: number;
  auction: OnchainAuction;
  trade: OnchainTrade;
  vrf_nonce: BN;
  vrf_pending: boolean;
  vrf_purpose: OnchainVrfPurpose;
}

export function variantOf(value: object): string {
  return Object.keys(value)[0] ?? "";
}
