use anchor_lang::prelude::*;

#[error_code]
pub enum GameError {
    #[msg("The game is full")]
    GameFull,
    #[msg("The game has already started")]
    AlreadyStarted,
    #[msg("The game has not started yet")]
    NotStarted,
    #[msg("The game is over")]
    GameOver,
    #[msg("At least two players are required")]
    NotEnoughPlayers,
    #[msg("That wallet already holds a seat")]
    AlreadyJoined,
    #[msg("That wallet does not hold a seat in this game")]
    NotAPlayer,
    #[msg("It is not your turn")]
    NotYourTurn,
    #[msg("Only the host may do that")]
    NotHost,
    #[msg("A modal action is waiting to be acknowledged")]
    PendingAction,
    #[msg("No pending action to acknowledge")]
    NoPendingAction,
    #[msg("Dice have not been rolled yet")]
    DiceNotRolled,
    #[msg("Dice have already been rolled this turn")]
    DiceAlreadyRolled,
    #[msg("Randomness is already in flight")]
    RandomnessPending,
    #[msg("No randomness request is in flight")]
    NoRandomnessPending,
    #[msg("This randomness callback does not match the pending request")]
    RandomnessMismatch,
    #[msg("That square cannot be bought")]
    NotBuyable,
    #[msg("That square already has an owner")]
    AlreadyOwned,
    #[msg("You do not own that square")]
    NotOwner,
    #[msg("Not enough cash")]
    InsufficientFunds,
    #[msg("You must settle your debt before continuing")]
    OutstandingDebt,
    #[msg("Houses must be built evenly across the colour group")]
    UnevenBuild,
    #[msg("You must own the whole colour group to build")]
    NoMonopoly,
    #[msg("Mortgaged property blocks building on this group")]
    GroupMortgaged,
    #[msg("The bank has no houses left")]
    NoHousesLeft,
    #[msg("The bank has no hotels left")]
    NoHotelsLeft,
    #[msg("That build is not allowed here")]
    InvalidBuild,
    #[msg("That square is already mortgaged")]
    AlreadyMortgaged,
    #[msg("That square is not mortgaged")]
    NotMortgaged,
    #[msg("Sell the buildings on this group first")]
    HasBuildings,
    #[msg("No auction is running")]
    NoAuction,
    #[msg("It is not your turn to bid")]
    NotYourBid,
    #[msg("A bid must beat the current highest bid")]
    BidTooLow,
    #[msg("No trade is open")]
    NoTrade,
    #[msg("A trade is already open")]
    TradeAlreadyOpen,
    #[msg("You are not part of this trade")]
    NotInTrade,
    #[msg("That trade is not valid")]
    InvalidTrade,
    #[msg("The turn clock has not expired yet")]
    TurnNotExpired,
    #[msg("That square index is out of range")]
    BadSquare,
    #[msg("That seat is out of range")]
    BadSeat,
    #[msg("Player name is too long")]
    NameTooLong,
    #[msg("You are not in jail")]
    NotInJail,
    #[msg("You do not hold a Get Out of Jail Free card")]
    NoJailCard,
}
