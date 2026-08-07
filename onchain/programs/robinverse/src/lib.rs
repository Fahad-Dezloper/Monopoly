use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::{commit, delegate, ephemeral, vrf, vrf_callback};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::MagicIntentBundleBuilder;
use ephemeral_rollups_sdk::vrf::{
    self as vrf_sdk,
    instructions::{create_request_scoped_randomness_ix, RequestRandomnessParams},
    types::SerializableAccountMeta,
};

pub mod board;
pub mod engine;
pub mod errors;
pub mod state;

#[cfg(test)]
mod tests;

use board::{tile, BOARD_SIZE};
use errors::GameError;
use state::*;

declare_id!("AyHcc7ySuwU5qfinS94CPaZKpiWCXWfFdxLtww8bupAs");

pub const GAME_SEED: &[u8] = b"game";
pub const STARTING_CASH: i64 = 1500;

#[ephemeral]
#[program]
pub mod robinverse {
    use super::*;

    pub fn create_game(
        ctx: Context<CreateGame>,
        code: [u8; 6],
        name: [u8; NAME_LEN],
        color: u8,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        game.code = code;
        game.host = ctx.accounts.host.key();
        game.bump = ctx.bumps.game;
        game.phase = Phase::Lobby;
        game.player_count = 0;
        game.turn = 0;
        game.double_count = 0;
        game.die1 = 0;
        game.die2 = 0;
        game.dice_rolled = false;
        game.winner = BANK;
        game.houses_available = engine::default_houses();
        game.hotels_available = engine::default_hotels();
        game.turn_deadline = 0;
        game.pending = Pending::None;
        game.players = engine::fresh_players();
        game.squares = engine::fresh_squares();
        game.fortune_deck = core::array::from_fn(|i| i as u8);
        game.fortune_index = 0;
        game.treasury_deck = core::array::from_fn(|i| i as u8);
        game.treasury_index = 0;
        game.auction_queue = [0; BOARD_SIZE];
        game.auction_queue_len = 0;
        game.auction = AuctionState::idle();
        game.trade = TradeState::idle();
        game.vrf_nonce = 0;
        game.vrf_pending = false;
        game.vrf_purpose = VrfPurpose::None;

        seat_player(game, ctx.accounts.host.key(), name, color)?;

        emit!(GameCreated {
            game: game.key(),
            host: game.host,
            code,
        });
        Ok(())
    }

    pub fn join_game(ctx: Context<JoinGame>, name: [u8; NAME_LEN], color: u8) -> Result<()> {
        let game = &mut ctx.accounts.game;
        require!(game.phase == Phase::Lobby, GameError::AlreadyStarted);
        let seat = seat_player(game, ctx.accounts.player.key(), name, color)?;

        emit!(PlayerJoined {
            game: game.key(),
            seat,
            wallet: ctx.accounts.player.key(),
        });
        Ok(())
    }

    pub fn delegate_game(
        ctx: Context<DelegateGame>,
        code: [u8; 6],
        validator: Option<Pubkey>,
    ) -> Result<()> {
        ctx.accounts.delegate_game(
            &ctx.accounts.payer,
            &[GAME_SEED, &code],
            DelegateConfig {
                validator,
                ..DelegateConfig::default()
            },
        )?;
        Ok(())
    }

    pub fn start_game(ctx: Context<RequestRandomness>, client_seed: u8) -> Result<()> {
        let nonce = {
            let game = &mut ctx.accounts.game;
            require!(game.phase == Phase::Lobby, GameError::AlreadyStarted);
            require!(game.player_count >= 2, GameError::NotEnoughPlayers);
            require!(!game.vrf_pending, GameError::RandomnessPending);
            require_keys_eq!(ctx.accounts.payer.key(), game.host, GameError::NotHost);

            game.vrf_nonce = game.vrf_nonce.wrapping_add(1);
            game.vrf_pending = true;
            game.vrf_purpose = VrfPurpose::Setup;
            game.vrf_nonce
        };

        request_randomness(
            &ctx,
            instruction::CallbackStart::DISCRIMINATOR.to_vec(),
            client_seed,
            nonce,
        )
    }

    pub fn callback_start(
        ctx: Context<CallbackRandomness>,
        randomness: [u8; 32],
        nonce: u64,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        require!(game.vrf_pending, GameError::NoRandomnessPending);
        require!(game.vrf_nonce == nonce, GameError::RandomnessMismatch);
        require!(
            game.vrf_purpose == VrfPurpose::Setup,
            GameError::RandomnessMismatch
        );

        engine::apply_setup_randomness(game, &randomness, now()?);

        emit!(GameStarted {
            game: game.key(),
            first_turn: game.turn,
        });
        Ok(())
    }

    pub fn roll_dice(ctx: Context<RequestRandomness>, client_seed: u8) -> Result<()> {
        let nonce = {
            let payer = ctx.accounts.payer.key();
            let game = &mut ctx.accounts.game;
            let seat = require_turn(game, &payer)?;
            require!(game.pending == Pending::None, GameError::PendingAction);
            require!(!game.vrf_pending, GameError::RandomnessPending);
            require!(
                game.phase == Phase::TurnStart || can_roll_again(game),
                GameError::DiceAlreadyRolled
            );

            game.vrf_nonce = game.vrf_nonce.wrapping_add(1);
            game.vrf_pending = true;
            game.vrf_purpose = VrfPurpose::Dice;
            game.phase = Phase::AwaitingDice;

            emit!(DiceRequested {
                game: game.key(),
                seat,
                nonce: game.vrf_nonce,
            });
            game.vrf_nonce
        };

        request_randomness(
            &ctx,
            instruction::CallbackRoll::DISCRIMINATOR.to_vec(),
            client_seed,
            nonce,
        )
    }

    pub fn callback_roll(
        ctx: Context<CallbackRandomness>,
        randomness: [u8; 32],
        nonce: u64,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        require!(game.vrf_pending, GameError::NoRandomnessPending);
        require!(game.vrf_nonce == nonce, GameError::RandomnessMismatch);
        require!(
            game.vrf_purpose == VrfPurpose::Dice,
            GameError::RandomnessMismatch
        );

        let outcome = engine::apply_dice(game, &randomness);

        emit!(DiceRolled {
            game: game.key(),
            seat: game.turn,
            die1: outcome.die1,
            die2: outcome.die2,
            doubles: outcome.doubles,
            square: game.current().position,
            rent_paid: outcome.land.rent_paid,
            rent_to: outcome.land.rent_to,
        });
        Ok(())
    }

    pub fn acknowledge(ctx: Context<PlayerAction>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        require_turn(game, &ctx.accounts.player.key())?;
        require!(game.pending != Pending::None, GameError::NoPendingAction);

        let outcome = engine::resolve_pending(game);

        emit!(PendingResolved {
            game: game.key(),
            seat: game.turn,
            square: game.current().position,
            rent_paid: outcome.rent_paid,
            tax_paid: outcome.tax_paid,
        });
        Ok(())
    }

    pub fn pay_jail_fine(ctx: Context<PlayerAction>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let seat = require_turn(game, &ctx.accounts.player.key())?;
        require!(game.pending == Pending::None, GameError::PendingAction);
        require!(!game.vrf_pending, GameError::RandomnessPending);
        require!(game.players[seat as usize].in_jail, GameError::NotInJail);
        require!(!game.dice_rolled, GameError::DiceAlreadyRolled);
        require!(
            game.players[seat as usize].cash >= board::JAIL_FINE as i64,
            GameError::InsufficientFunds
        );

        engine::pay_jail_fine(game);

        emit!(LeftJail {
            game: game.key(),
            seat,
            paid: board::JAIL_FINE,
            used_card: false,
        });
        Ok(())
    }

    pub fn use_jail_card(ctx: Context<PlayerAction>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let seat = require_turn(game, &ctx.accounts.player.key())?;
        require!(game.pending == Pending::None, GameError::PendingAction);
        require!(!game.vrf_pending, GameError::RandomnessPending);
        require!(game.players[seat as usize].in_jail, GameError::NotInJail);
        require!(!game.dice_rolled, GameError::DiceAlreadyRolled);
        require!(engine::use_jail_card(game), GameError::NoJailCard);

        emit!(LeftJail {
            game: game.key(),
            seat,
            paid: 0,
            used_card: true,
        });
        Ok(())
    }

    pub fn buy_property(ctx: Context<PlayerAction>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let seat = require_turn(game, &ctx.accounts.player.key())?;
        require!(game.pending == Pending::None, GameError::PendingAction);
        require!(game.dice_rolled, GameError::DiceNotRolled);

        let square = game.current().position;
        require!(tile(square).is_ownable(), GameError::NotBuyable);
        require!(
            game.squares[square as usize].owner == BANK,
            GameError::AlreadyOwned
        );
        require!(
            game.current().cash >= tile(square).price as i64,
            GameError::InsufficientFunds
        );

        let price = engine::buy_current_square(game, seat);

        emit!(PropertyBought {
            game: game.key(),
            seat,
            square,
            price,
        });
        Ok(())
    }

    pub fn decline_property(ctx: Context<PlayerAction>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        require_turn(game, &ctx.accounts.player.key())?;
        require!(game.dice_rolled, GameError::DiceNotRolled);
        Ok(())
    }

    pub fn end_turn(ctx: Context<PlayerAction>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let seat = require_turn(game, &ctx.accounts.player.key())?;
        require!(game.pending == Pending::None, GameError::PendingAction);
        require!(game.dice_rolled, GameError::DiceNotRolled);
        require!(!game.vrf_pending, GameError::RandomnessPending);
        require!(
            !game.players[seat as usize].is_broke(),
            GameError::OutstandingDebt
        );

        if can_roll_again(game) {
            game.phase = Phase::TurnStart;
            game.dice_rolled = false;
            return Ok(());
        }

        engine::end_turn_or_auction(game, now()?);

        emit!(TurnEnded {
            game: game.key(),
            previous: seat,
            next: game.turn,
        });
        Ok(())
    }

    pub fn build(ctx: Context<PlayerAction>, square: u8) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let seat = require_seat(game, &ctx.accounts.player.key())?;
        require_square(square)?;
        require!(
            game.squares[square as usize].owner == seat,
            GameError::NotOwner
        );
        require!(owns_group_or_err(game, square)?, GameError::NoMonopoly);

        if engine::can_build_hotel(game, seat, square) {
            engine::build_hotel(game, seat, square);
            emit!(Built {
                game: game.key(),
                seat,
                square,
                hotel: true,
            });
        } else if engine::can_build_house(game, seat, square) {
            engine::build_house(game, seat, square);
            emit!(Built {
                game: game.key(),
                seat,
                square,
                hotel: false,
            });
        } else {
            return Err(build_failure(game, seat, square).into());
        }
        Ok(())
    }

    pub fn sell_building(ctx: Context<PlayerAction>, square: u8) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let seat = require_seat(game, &ctx.accounts.player.key())?;
        require_square(square)?;
        require!(
            game.squares[square as usize].owner == seat,
            GameError::NotOwner
        );
        let state = game.squares[square as usize];
        require!(state.houses > 0 || state.hotel, GameError::InvalidBuild);
        require!(
            engine::can_sell_building(game, square),
            GameError::NoHousesLeft
        );

        let refund = engine::sell_building(game, seat, square);

        emit!(BuildingSold {
            game: game.key(),
            seat,
            square,
            refund,
        });
        Ok(())
    }

    pub fn mortgage(ctx: Context<PlayerAction>, square: u8) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let seat = require_seat(game, &ctx.accounts.player.key())?;
        require_square(square)?;
        require!(
            game.squares[square as usize].owner == seat,
            GameError::NotOwner
        );
        require!(
            !game.squares[square as usize].mortgaged,
            GameError::AlreadyMortgaged
        );
        require!(
            !tile(square)
                .members()
                .any(|i| game.squares[i].houses > 0 || game.squares[i].hotel),
            GameError::HasBuildings
        );

        let value = engine::mortgage(game, seat, square);

        emit!(Mortgaged {
            game: game.key(),
            seat,
            square,
            value,
            lifted: false,
        });
        Ok(())
    }

    pub fn unmortgage(ctx: Context<PlayerAction>, square: u8) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let seat = require_seat(game, &ctx.accounts.player.key())?;
        require_square(square)?;
        require!(
            game.squares[square as usize].owner == seat,
            GameError::NotOwner
        );
        require!(
            game.squares[square as usize].mortgaged,
            GameError::NotMortgaged
        );
        require!(
            game.players[seat as usize].cash >= engine::unmortgage_cost(square) as i64,
            GameError::InsufficientFunds
        );

        let cost = engine::unmortgage(game, seat, square);

        emit!(Mortgaged {
            game: game.key(),
            seat,
            square,
            value: cost,
            lifted: true,
        });
        Ok(())
    }

    pub fn place_bid(ctx: Context<PlayerAction>, amount: u32) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let seat = require_seat(game, &ctx.accounts.player.key())?;
        require!(game.auction.active, GameError::NoAuction);
        require!(game.auction.current_bidder == seat, GameError::NotYourBid);
        require!(amount > game.auction.highest_bid, GameError::BidTooLow);
        require!(
            game.players[seat as usize].cash >= amount as i64,
            GameError::InsufficientFunds
        );

        let square = game.auction.square;
        engine::place_bid(game, amount, now()?);

        emit!(BidPlaced {
            game: game.key(),
            seat,
            square,
            amount,
        });
        Ok(())
    }

    pub fn withdraw_bid(ctx: Context<PlayerAction>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let seat = require_seat(game, &ctx.accounts.player.key())?;
        require!(game.auction.active, GameError::NoAuction);
        require!(game.auction.current_bidder == seat, GameError::NotYourBid);

        engine::withdraw_from_auction(game, now()?);

        emit!(BidWithdrawn {
            game: game.key(),
            seat,
        });
        Ok(())
    }

    pub fn propose_trade(
        ctx: Context<PlayerAction>,
        recipient: u8,
        initiator_cash: u32,
        recipient_cash: u32,
        squares: [u8; BOARD_SIZE],
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let seat = require_seat(game, &ctx.accounts.player.key())?;
        require!(!game.trade.active, GameError::TradeAlreadyOpen);
        require!(recipient != seat, GameError::InvalidTrade);
        require!(
            recipient >= 1 && recipient <= game.player_count,
            GameError::BadSeat
        );
        require!(
            game.players[recipient as usize].active,
            GameError::NotAPlayer
        );

        let draft = TradeState {
            active: true,
            initiator: seat,
            recipient,
            initiator_cash,
            recipient_cash,
            squares,
            awaiting_response: true,
        };
        require!(
            engine::trade_is_valid(game, &draft),
            GameError::InvalidTrade
        );
        game.trade = draft;

        emit!(TradeProposed {
            game: game.key(),
            initiator: seat,
            recipient,
        });
        Ok(())
    }

    pub fn respond_to_trade(ctx: Context<PlayerAction>, accept: bool) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let seat = require_seat(game, &ctx.accounts.player.key())?;
        require!(game.trade.active, GameError::NoTrade);
        require!(
            seat == game.trade.recipient || seat == game.trade.initiator,
            GameError::NotInTrade,
        );
        if accept {
            require!(seat == game.trade.recipient, GameError::NotInTrade);
            let draft = game.trade;
            require!(
                engine::trade_is_valid(game, &draft),
                GameError::InvalidTrade
            );
            engine::apply_trade(game, &draft);
        }
        game.trade = TradeState::idle();

        emit!(TradeResolved {
            game: game.key(),
            seat,
            accepted: accept,
        });
        Ok(())
    }

    pub fn force_skip_turn(ctx: Context<AnySigner>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        require!(game.phase != Phase::GameOver, GameError::GameOver);
        require!(game.phase != Phase::Lobby, GameError::NotStarted);

        let current = now()?;
        require!(
            game.turn_deadline > 0 && current >= game.turn_deadline,
            GameError::TurnNotExpired
        );

        let seat = game.turn;
        engine::eliminate(game, seat, current);

        emit!(PlayerEliminated {
            game: game.key(),
            seat,
            timed_out: true,
            winner: game.winner,
        });
        Ok(())
    }

    pub fn resign(ctx: Context<PlayerAction>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let seat = require_seat(game, &ctx.accounts.player.key())?;
        require!(game.phase != Phase::GameOver, GameError::GameOver);

        engine::eliminate(game, seat, now()?);

        emit!(PlayerEliminated {
            game: game.key(),
            seat,
            timed_out: false,
            winner: game.winner,
        });
        Ok(())
    }

    pub fn checkpoint(ctx: Context<CommitGame>) -> Result<()> {
        MagicIntentBundleBuilder::new(
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.magic_context.to_account_info(),
            ctx.accounts.magic_program.to_account_info(),
        )
        .commit(&[ctx.accounts.game.to_account_info()])
        .build_and_invoke()?;
        Ok(())
    }

    pub fn settle_game(ctx: Context<CommitGame>) -> Result<()> {
        require!(
            ctx.accounts.game.phase == Phase::GameOver,
            GameError::NotStarted
        );

        MagicIntentBundleBuilder::new(
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.magic_context.to_account_info(),
            ctx.accounts.magic_program.to_account_info(),
        )
        .commit_and_undelegate(&[ctx.accounts.game.to_account_info()])
        .build_and_invoke()?;
        Ok(())
    }
}

fn now() -> Result<i64> {
    Ok(Clock::get()?.unix_timestamp)
}

fn seat_player(game: &mut Game, wallet: Pubkey, name: [u8; NAME_LEN], color: u8) -> Result<u8> {
    require!(
        (game.player_count as usize) < MAX_PLAYERS,
        GameError::GameFull
    );
    require!(game.seat_of(&wallet).is_none(), GameError::AlreadyJoined);

    let seat = game.player_count + 1;
    let player = &mut game.players[seat as usize];
    player.wallet = wallet;
    player.name = name;
    player.color = color;
    player.cash = STARTING_CASH;
    player.position = 0;
    player.creditor = BANK;
    player.in_jail = false;
    player.jail_rolls = 0;
    player.fortune_jail_card = false;
    player.treasury_jail_card = false;
    player.bidding = true;
    player.active = true;
    game.player_count = seat;
    Ok(seat)
}

fn require_seat(game: &Game, wallet: &Pubkey) -> Result<u8> {
    require!(game.phase != Phase::Lobby, GameError::NotStarted);
    require!(game.phase != Phase::GameOver, GameError::GameOver);
    game.seat_of(wallet).ok_or(GameError::NotAPlayer.into())
}

fn require_turn(game: &Game, wallet: &Pubkey) -> Result<u8> {
    let seat = require_seat(game, wallet)?;
    require!(seat == game.turn, GameError::NotYourTurn);
    Ok(seat)
}

fn require_square(square: u8) -> Result<()> {
    require!((square as usize) < BOARD_SIZE, GameError::BadSquare);
    Ok(())
}

fn owns_group_or_err(game: &Game, square: u8) -> Result<bool> {
    Ok(engine::owns_full_group(game, square))
}

fn build_failure(game: &Game, seat: u8, square: u8) -> GameError {
    let state = game.squares[square as usize];
    let spec = tile(square);
    if spec.group < 3 {
        return GameError::InvalidBuild;
    }
    if state.mortgaged || engine::group_has_mortgage(game, square) {
        return GameError::GroupMortgaged;
    }
    if state.hotel {
        return GameError::InvalidBuild;
    }
    if game.houses_available == 0 {
        return GameError::NoHousesLeft;
    }
    if state.houses == 4 && game.hotels_available == 0 {
        return GameError::NoHotelsLeft;
    }
    let cost = if state.houses == 4 {
        spec.hotel_cost.max(spec.house_cost)
    } else {
        spec.house_cost
    };
    if game.players[seat as usize].cash < cost as i64 {
        return GameError::InsufficientFunds;
    }
    GameError::UnevenBuild
}

fn can_roll_again(game: &Game) -> bool {
    game.dice_rolled
        && game.die1 == game.die2
        && game.double_count > 0
        && game.double_count < 3
        && !game.current().in_jail
        && game.pending == Pending::None
}

/// Extra bytes the oracle appends after the 32 randomness bytes. These must
/// Borsh-deserialize into exactly the callback's trailing parameters — `nonce:
/// u64` and nothing else. Adding a byte here without adding a matching
/// parameter shifts the nonce and every callback is rejected.
pub fn callback_args(nonce: u64) -> Vec<u8> {
    nonce.to_le_bytes().to_vec()
}

fn request_randomness(
    ctx: &Context<RequestRandomness>,
    discriminator: Vec<u8>,
    client_seed: u8,
    nonce: u64,
) -> Result<()> {
    let args = callback_args(nonce);

    let ix = create_request_scoped_randomness_ix(RequestRandomnessParams {
        payer: ctx.accounts.payer.key(),
        oracle_queue: ctx.accounts.oracle_queue.key(),
        callback_program_id: ID,
        callback_discriminator: discriminator,
        caller_seed: [client_seed; 32],
        accounts_metas: Some(vec![SerializableAccountMeta {
            pubkey: ctx.accounts.game.key(),
            is_signer: false,
            is_writable: true,
        }]),
        callback_args: Some(args),
        ..Default::default()
    });

    ctx.accounts
        .invoke_signed_vrf(&ctx.accounts.payer.to_account_info(), &ix)?;
    Ok(())
}

#[derive(Accounts)]
#[instruction(code: [u8; 6])]
pub struct CreateGame<'info> {
    #[account(mut)]
    pub host: Signer<'info>,
    #[account(
        init,
        payer = host,
        space = 8 + Game::INIT_SPACE,
        seeds = [GAME_SEED, &code],
        bump
    )]
    pub game: Account<'info, Game>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinGame<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut)]
    pub game: Account<'info, Game>,
}

#[delegate]
#[derive(Accounts)]
#[instruction(code: [u8; 6])]
pub struct DelegateGame<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, del, seeds = [GAME_SEED, &code], bump)]
    pub game: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct PlayerAction<'info> {
    pub player: Signer<'info>,
    #[account(mut)]
    pub game: Account<'info, Game>,
}

#[derive(Accounts)]
pub struct AnySigner<'info> {
    pub caller: Signer<'info>,
    #[account(mut)]
    pub game: Account<'info, Game>,
}

#[vrf]
#[derive(Accounts)]
pub struct RequestRandomness<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub game: Account<'info, Game>,
    #[account(
        mut,
        constraint = oracle_queue.key() == vrf_sdk::consts::DEFAULT_QUEUE
            || oracle_queue.key() == vrf_sdk::consts::DEFAULT_EPHEMERAL_QUEUE
            || oracle_queue.key() == vrf_sdk::consts::DEFAULT_TEST_QUEUE
            || oracle_queue.key() == vrf_sdk::consts::DEFAULT_EPHEMERAL_TEST_QUEUE
    )]
    pub oracle_queue: UncheckedAccount<'info>,
}

#[vrf_callback]
#[derive(Accounts)]
pub struct CallbackRandomness<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
}

#[commit]
#[derive(Accounts)]
pub struct CommitGame<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub game: Account<'info, Game>,
}

#[event]
pub struct GameCreated {
    pub game: Pubkey,
    pub host: Pubkey,
    pub code: [u8; 6],
}

#[event]
pub struct PlayerJoined {
    pub game: Pubkey,
    pub seat: u8,
    pub wallet: Pubkey,
}

#[event]
pub struct GameStarted {
    pub game: Pubkey,
    pub first_turn: u8,
}

#[event]
pub struct DiceRequested {
    pub game: Pubkey,
    pub seat: u8,
    pub nonce: u64,
}

#[event]
pub struct DiceRolled {
    pub game: Pubkey,
    pub seat: u8,
    pub die1: u8,
    pub die2: u8,
    pub doubles: bool,
    pub square: u8,
    pub rent_paid: u32,
    pub rent_to: u8,
}

#[event]
pub struct PendingResolved {
    pub game: Pubkey,
    pub seat: u8,
    pub square: u8,
    pub rent_paid: u32,
    pub tax_paid: u32,
}

#[event]
pub struct LeftJail {
    pub game: Pubkey,
    pub seat: u8,
    pub paid: u32,
    pub used_card: bool,
}

#[event]
pub struct PropertyBought {
    pub game: Pubkey,
    pub seat: u8,
    pub square: u8,
    pub price: u32,
}

#[event]
pub struct Built {
    pub game: Pubkey,
    pub seat: u8,
    pub square: u8,
    pub hotel: bool,
}

#[event]
pub struct BuildingSold {
    pub game: Pubkey,
    pub seat: u8,
    pub square: u8,
    pub refund: u32,
}

#[event]
pub struct Mortgaged {
    pub game: Pubkey,
    pub seat: u8,
    pub square: u8,
    pub value: u32,
    pub lifted: bool,
}

#[event]
pub struct BidPlaced {
    pub game: Pubkey,
    pub seat: u8,
    pub square: u8,
    pub amount: u32,
}

#[event]
pub struct BidWithdrawn {
    pub game: Pubkey,
    pub seat: u8,
}

#[event]
pub struct TradeProposed {
    pub game: Pubkey,
    pub initiator: u8,
    pub recipient: u8,
}

#[event]
pub struct TradeResolved {
    pub game: Pubkey,
    pub seat: u8,
    pub accepted: bool,
}

#[event]
pub struct TurnEnded {
    pub game: Pubkey,
    pub previous: u8,
    pub next: u8,
}

#[event]
pub struct PlayerEliminated {
    pub game: Pubkey,
    pub seat: u8,
    pub timed_out: bool,
    pub winner: u8,
}
