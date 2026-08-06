use anchor_lang::prelude::*;

use crate::board::BOARD_SIZE;

/// Seat 0 is the bank sentinel, mirroring the original TypeScript engine, so
/// `owner == BANK` reads the same on chain as it did off chain. Real seats are
/// 1..=MAX_PLAYERS.
pub const BANK: u8 = 0;
pub const MAX_PLAYERS: usize = 8;
pub const SEATS: usize = MAX_PLAYERS + 1;
pub const NAME_LEN: usize = 16;
pub const FORTUNE_COUNT: usize = 16;
pub const TREASURY_COUNT: usize = 16;
pub const TURN_LIMIT_SECONDS: i64 = 180;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum Phase {
    /// Seats are still filling; no dice yet.
    Lobby,
    /// Current player may roll.
    TurnStart,
    /// VRF requested, dice not yet delivered.
    AwaitingDice,
    /// Dice landed and the square was resolved; player may act then end turn.
    Rolled,
    /// A card was drawn and is waiting to be acknowledged.
    Card,
    /// An unbought property is under auction.
    Auction,
    GameOver,
}

/// Modal-style interruptions that block turn progress until acknowledged.
/// Replaces the off-chain `popup` object; the client renders from this.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum Pending {
    None,
    /// Landed on Go To Jail, or rolled three doubles.
    GoToJail,
    /// Third failed jail roll — the $50 fine is compulsory.
    JailFine,
    /// A drawn card awaiting acknowledgement before its effect applies.
    Card { fortune: bool, index: u8 },
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub struct PlayerState {
    pub wallet: Pubkey,
    pub name: [u8; NAME_LEN],
    pub color: u8,
    /// Signed so a player can sit in debt before raising funds or going bust,
    /// exactly as the original engine allowed money to go negative.
    pub cash: i64,
    pub position: u8,
    /// Who they owe when cash is negative; BANK when it is the bank.
    pub creditor: u8,
    pub in_jail: bool,
    pub jail_rolls: u8,
    pub fortune_jail_card: bool,
    pub treasury_jail_card: bool,
    /// Still live in the current auction.
    pub bidding: bool,
    /// Seat is occupied and not yet bankrupt.
    pub active: bool,
}

impl PlayerState {
    pub fn empty() -> Self {
        Self {
            wallet: Pubkey::default(),
            name: [0; NAME_LEN],
            color: 0,
            cash: 0,
            position: 0,
            creditor: BANK,
            in_jail: false,
            jail_rolls: 0,
            fortune_jail_card: false,
            treasury_jail_card: false,
            bidding: false,
            active: false,
        }
    }

    pub fn is_broke(&self) -> bool {
        self.cash < 0
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub struct SquareState {
    pub owner: u8,
    pub houses: u8,
    pub hotel: bool,
    pub mortgaged: bool,
    /// Kept for the client's "hot tiles" heat display.
    pub land_count: u16,
}

impl SquareState {
    pub fn empty() -> Self {
        Self {
            owner: BANK,
            houses: 0,
            hotel: false,
            mortgaged: false,
            land_count: 0,
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub struct AuctionState {
    pub active: bool,
    pub square: u8,
    pub highest_bid: u32,
    pub highest_bidder: u8,
    pub current_bidder: u8,
}

impl AuctionState {
    pub fn idle() -> Self {
        Self {
            active: false,
            square: 0,
            highest_bid: 0,
            highest_bidder: BANK,
            current_bidder: BANK,
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub struct TradeState {
    pub active: bool,
    pub initiator: u8,
    pub recipient: u8,
    pub initiator_cash: u32,
    pub recipient_cash: u32,
    /// 1 = offered by initiator, 2 = requested from recipient, 0 = untouched.
    pub squares: [u8; BOARD_SIZE],
    pub awaiting_response: bool,
}

impl TradeState {
    pub fn idle() -> Self {
        Self {
            active: false,
            initiator: BANK,
            recipient: BANK,
            initiator_cash: 0,
            recipient_cash: 0,
            squares: [0; BOARD_SIZE],
            awaiting_response: false,
        }
    }
}

#[account]
#[derive(InitSpace)]
pub struct Game {
    /// Room code, matching the six-character lobby codes already in the product.
    pub code: [u8; 6],
    pub host: Pubkey,
    pub bump: u8,
    pub phase: Phase,
    pub player_count: u8,
    pub turn: u8,
    pub double_count: u8,
    pub die1: u8,
    pub die2: u8,
    pub dice_rolled: bool,
    /// Winning seat once decided, BANK while the game is live or a draw.
    pub winner: u8,
    pub houses_available: u8,
    pub hotels_available: u8,
    pub turn_deadline: i64,
    pub pending: Pending,
    pub players: [PlayerState; SEATS],
    pub squares: [SquareState; BOARD_SIZE],
    pub fortune_deck: [u8; FORTUNE_COUNT],
    pub fortune_index: u8,
    pub treasury_deck: [u8; TREASURY_COUNT],
    pub treasury_index: u8,
    /// Squares landed on but not bought, drained into auctions at end of turn.
    pub auction_queue: [u8; BOARD_SIZE],
    pub auction_queue_len: u8,
    pub auction: AuctionState,
    pub trade: TradeState,
    /// Correlates one VRF request with one permitted callback.
    pub vrf_nonce: u64,
    /// True between a randomness request and its callback.
    pub vrf_pending: bool,
    /// What the in-flight randomness is for.
    pub vrf_purpose: VrfPurpose,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum VrfPurpose {
    None,
    /// Shuffling both decks and randomising seat order at game start.
    Setup,
    /// A dice roll for the current player.
    Dice,
}

impl Game {
    pub fn current(&self) -> &PlayerState {
        &self.players[self.turn as usize]
    }

    pub fn current_mut(&mut self) -> &mut PlayerState {
        &mut self.players[self.turn as usize]
    }

    pub fn seat_of(&self, wallet: &Pubkey) -> Option<u8> {
        (1..=self.player_count)
            .find(|seat| {
                let player = &self.players[*seat as usize];
                player.active && player.wallet == *wallet
            })
            .map(|seat| seat)
    }

    pub fn live_seats(&self) -> impl Iterator<Item = u8> + '_ {
        (1..=self.player_count).filter(move |seat| self.players[*seat as usize].active)
    }

    pub fn live_count(&self) -> u8 {
        self.live_seats().count() as u8
    }
}
