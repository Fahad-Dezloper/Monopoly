//! Rule-set tests. These run on the host with plain `cargo test` — no
//! validator, no ER, no oracle — because `engine.rs` is free of syscalls.

use anchor_lang::prelude::Pubkey;

use crate::board::{tile, BOARD_SIZE, GO_SALARY, JAIL_INDEX, TOTAL_HOTELS, TOTAL_HOUSES};
use crate::engine::*;
use crate::state::*;

const NOW: i64 = 1_700_000_000;

/// A started game with `count` seats, all holding $1500 on GO.
fn game_with(count: u8) -> Game {
    let mut game = Game {
        code: *b"ABC123",
        host: Pubkey::new_unique(),
        bump: 255,
        phase: Phase::TurnStart,
        player_count: count,
        turn: 1,
        double_count: 0,
        die1: 0,
        die2: 0,
        dice_rolled: false,
        winner: BANK,
        houses_available: TOTAL_HOUSES,
        hotels_available: TOTAL_HOTELS,
        turn_deadline: NOW + TURN_LIMIT_SECONDS,
        pending: Pending::None,
        players: fresh_players(),
        squares: fresh_squares(),
        fortune_deck: core::array::from_fn(|i| i as u8),
        fortune_index: 0,
        treasury_deck: core::array::from_fn(|i| i as u8),
        treasury_index: 0,
        auction_queue: [0; BOARD_SIZE],
        auction_queue_len: 0,
        auction: AuctionState::idle(),
        trade: TradeState::idle(),
        vrf_nonce: 0,
        vrf_pending: false,
        vrf_purpose: VrfPurpose::None,
    };

    for seat in 1..=count {
        let player = &mut game.players[seat as usize];
        player.wallet = Pubkey::new_unique();
        player.cash = 1500;
        player.active = true;
        player.bidding = true;
    }
    game
}

/// Indices of the cheapest full colour group (Mumbai / Delhi, group 3).
fn india() -> Vec<u8> {
    (0..BOARD_SIZE as u8)
        .filter(|i| tile(*i).group == 3)
        .collect()
}

fn give(game: &mut Game, seat: u8, squares: &[u8]) {
    for square in squares {
        game.squares[*square as usize].owner = seat;
    }
}

// ---------------------------------------------------------------------------
// account layout
// ---------------------------------------------------------------------------

#[test]
fn the_whole_game_fits_in_one_modest_account() {
    use anchor_lang::Space;
    let size = 8 + Game::INIT_SPACE;
    // One account keeps delegation and ER routing simple; keep it that way.
    assert!(
        size < 4096,
        "game account grew to {size} bytes — check it still suits a single delegation"
    );
    println!("Game account: {size} bytes");
}

// ---------------------------------------------------------------------------
// board data
// ---------------------------------------------------------------------------

#[test]
fn board_has_forty_tiles_with_consistent_indices() {
    for index in 0..BOARD_SIZE {
        assert_eq!(tile(index as u8).index as usize, index);
    }
}

#[test]
fn colour_groups_are_closed_under_membership() {
    for index in 0..BOARD_SIZE as u8 {
        let spec = tile(index);
        if spec.group == 0 {
            continue;
        }
        assert!(
            spec.members().any(|i| i == index as usize),
            "tile {index} missing from its own group"
        );
        for member in spec.members() {
            assert_eq!(
                tile(member as u8).group,
                spec.group,
                "tile {member} listed in the wrong group"
            );
        }
    }
}

#[test]
fn transport_and_utility_counts_match_the_dataset() {
    let transport = (0..BOARD_SIZE as u8).filter(|i| tile(*i).group == 1).count();
    let utility = (0..BOARD_SIZE as u8).filter(|i| tile(*i).group == 2).count();
    assert_eq!(transport, 4);
    assert_eq!(utility, 2);
}

// ---------------------------------------------------------------------------
// rent
// ---------------------------------------------------------------------------

#[test]
fn unowned_and_mortgaged_squares_charge_nothing() {
    let mut game = game_with(2);
    let square = india()[0];
    assert_eq!(calculate_rent(&game, square, 3, 4, false), 0);

    give(&mut game, 2, &[square]);
    game.squares[square as usize].mortgaged = true;
    assert_eq!(calculate_rent(&game, square, 3, 4, false), 0);
}

#[test]
fn a_full_colour_group_doubles_base_rent() {
    let mut game = game_with(2);
    let group = india();
    let square = group[0];
    let spec = tile(square);

    give(&mut game, 2, &[square]);
    assert_eq!(calculate_rent(&game, square, 3, 4, false), spec.rents[0]);

    give(&mut game, 2, &group);
    let monopoly = calculate_rent(&game, square, 3, 4, false);
    assert_eq!(monopoly, spec.rents[1]);
    assert!(monopoly > spec.rents[0]);
}

#[test]
fn house_and_hotel_rent_climb_through_the_table() {
    let mut game = game_with(2);
    let group = india();
    let square = group[0];
    let spec = tile(square);
    give(&mut game, 2, &group);

    let mut previous = calculate_rent(&game, square, 0, 0, false);
    for houses in 1..=4u8 {
        game.squares[square as usize].houses = houses;
        let rent = calculate_rent(&game, square, 0, 0, false);
        assert!(rent > previous, "rent should rise at {houses} houses");
        assert_eq!(rent, spec.rents[1 + houses as usize]);
        previous = rent;
    }

    game.squares[square as usize].houses = 0;
    game.squares[square as usize].hotel = true;
    let hotel_rent = calculate_rent(&game, square, 0, 0, false);
    assert_eq!(hotel_rent, spec.rents[6]);
    assert!(hotel_rent > previous);
}

#[test]
fn transport_rent_scales_with_hubs_owned() {
    let mut game = game_with(2);
    let hubs: Vec<u8> = (0..BOARD_SIZE as u8).filter(|i| tile(*i).group == 1).collect();
    let spec = tile(hubs[0]);

    for owned in 1..=hubs.len() {
        give(&mut game, 2, &hubs[..owned]);
        assert_eq!(
            calculate_rent(&game, hubs[0], 0, 0, false),
            spec.rents[owned - 1],
            "wrong rent holding {owned} hubs"
        );
    }
}

#[test]
fn transport_rent_doubles_on_the_fortune_card() {
    let mut game = game_with(2);
    let hubs: Vec<u8> = (0..BOARD_SIZE as u8).filter(|i| tile(*i).group == 1).collect();
    give(&mut game, 2, &hubs[..1]);
    let normal = calculate_rent(&game, hubs[0], 0, 0, false);
    let boosted = calculate_rent(&game, hubs[0], 0, 0, true);
    assert_eq!(boosted, normal * 2);
}

#[test]
fn utility_rent_multiplies_the_dice() {
    let mut game = game_with(2);
    let utilities: Vec<u8> = (0..BOARD_SIZE as u8).filter(|i| tile(*i).group == 2).collect();

    give(&mut game, 2, &utilities[..1]);
    assert_eq!(calculate_rent(&game, utilities[0], 3, 4, false), 7 * 4);

    give(&mut game, 2, &utilities);
    assert_eq!(calculate_rent(&game, utilities[0], 3, 4, false), 7 * 10);
}

// ---------------------------------------------------------------------------
// movement, GO and jail
// ---------------------------------------------------------------------------

#[test]
fn passing_go_pays_a_salary() {
    let mut game = game_with(2);
    game.players[1].position = 38;
    let before = game.players[1].cash;

    resolve_roll(&mut game, 3, 1);

    assert_eq!(game.players[1].position, 2);
    assert!(game.players[1].cash >= before + GO_SALARY as i64 - 200);
}

#[test]
fn landing_exactly_on_go_still_pays() {
    let mut game = game_with(2);
    game.players[1].position = 36;
    let before = game.players[1].cash;
    resolve_roll(&mut game, 2, 2);
    assert_eq!(game.players[1].position, 0);
    assert_eq!(game.players[1].cash, before + GO_SALARY as i64);
}

#[test]
fn three_doubles_in_a_row_sends_you_to_jail() {
    let mut game = game_with(2);

    resolve_roll(&mut game, 2, 2);
    assert!(!game.current().in_jail);
    resolve_roll(&mut game, 3, 3);
    assert!(!game.current().in_jail);

    let outcome = resolve_roll(&mut game, 4, 4);
    assert!(outcome.sent_to_jail);
    assert_eq!(game.pending, Pending::GoToJail);

    resolve_pending(&mut game);
    assert!(game.current().in_jail);
    assert_eq!(game.current().position, JAIL_INDEX);
}

#[test]
fn a_non_double_resets_the_doubles_counter() {
    let mut game = game_with(2);
    resolve_roll(&mut game, 2, 2);
    assert_eq!(game.double_count, 1);
    resolve_roll(&mut game, 1, 2);
    assert_eq!(game.double_count, 0);
}

#[test]
fn doubles_release_you_from_jail() {
    let mut game = game_with(2);
    game.players[1].in_jail = true;
    game.players[1].position = JAIL_INDEX;

    let outcome = resolve_roll(&mut game, 5, 5);

    assert!(outcome.left_jail);
    assert!(!game.players[1].in_jail);
    assert_eq!(game.players[1].position, JAIL_INDEX + 10);
    assert_eq!(game.players[1].jail_rolls, 0);
}

#[test]
fn a_third_failed_jail_roll_forces_the_fine() {
    let mut game = game_with(2);
    game.players[1].in_jail = true;
    game.players[1].position = JAIL_INDEX;

    resolve_roll(&mut game, 1, 2);
    resolve_roll(&mut game, 1, 3);
    assert_eq!(game.pending, Pending::None);
    assert!(game.players[1].in_jail);

    resolve_roll(&mut game, 2, 5);
    assert_eq!(game.pending, Pending::JailFine);

    let before = game.players[1].cash;
    resolve_pending(&mut game);
    assert!(!game.players[1].in_jail);
    assert_eq!(game.players[1].cash, before - 50);
    assert_eq!(game.players[1].position, JAIL_INDEX + 7);
}

#[test]
fn a_player_in_jail_does_not_move_on_a_failed_roll() {
    let mut game = game_with(2);
    game.players[1].in_jail = true;
    game.players[1].position = JAIL_INDEX;
    resolve_roll(&mut game, 1, 2);
    assert_eq!(game.players[1].position, JAIL_INDEX);
}

// ---------------------------------------------------------------------------
// buying and the auction queue
// ---------------------------------------------------------------------------

#[test]
fn landing_on_an_unowned_property_queues_it_for_auction() {
    let mut game = game_with(2);
    game.players[1].position = 0;
    let outcome = resolve_roll(&mut game, 1, 0);
    assert_eq!(outcome.land.square, 1);
    assert!(outcome.land.queued_for_auction);
    assert_eq!(game.auction_queue_len, 1);
}

#[test]
fn buying_takes_the_square_off_the_auction_queue() {
    let mut game = game_with(2);
    game.players[1].position = 1;
    game.dice_rolled = true;
    let _ = land(&mut game, false);
    assert_eq!(game.auction_queue_len, 1);

    let price = buy_current_square(&mut game, 1);

    assert_eq!(price, tile(1).price);
    assert_eq!(game.squares[1].owner, 1);
    assert_eq!(game.auction_queue_len, 0);
    assert_eq!(game.players[1].cash, 1500 - price as i64);
}

#[test]
fn rent_moves_cash_from_visitor_to_owner() {
    let mut game = game_with(2);
    let square = india()[0];
    give(&mut game, 2, &[square]);
    game.players[1].position = square - 1;

    let owner_before = game.players[2].cash;
    let visitor_before = game.players[1].cash;
    let outcome = resolve_roll(&mut game, 1, 0);

    let rent = outcome.land.rent_paid;
    assert!(rent > 0);
    assert_eq!(outcome.land.rent_to, 2);
    assert_eq!(game.players[2].cash, owner_before + rent as i64);
    assert_eq!(game.players[1].cash, visitor_before - rent as i64);
}

#[test]
fn you_never_pay_rent_to_yourself() {
    let mut game = game_with(2);
    let square = india()[0];
    give(&mut game, 1, &[square]);
    game.players[1].position = square - 1;

    let before = game.players[1].cash;
    let outcome = resolve_roll(&mut game, 1, 0);

    assert_eq!(outcome.land.rent_paid, 0);
    assert_eq!(game.players[1].cash, before);
}

#[test]
fn tax_squares_charge_the_listed_amount() {
    let mut game = game_with(2);
    let tax_square = (0..BOARD_SIZE as u8)
        .find(|i| tile(*i).tax_amount > 0)
        .expect("dataset has tax tiles");
    let amount = tile(tax_square).tax_amount;

    game.players[1].position = tax_square;
    let before = game.players[1].cash;
    let outcome = land(&mut game, false);

    assert_eq!(outcome.tax_paid, amount);
    assert_eq!(game.players[1].cash, before - amount as i64);
}

// ---------------------------------------------------------------------------
// building
// ---------------------------------------------------------------------------

#[test]
fn building_requires_the_whole_colour_group() {
    let mut game = game_with(2);
    let group = india();
    give(&mut game, 1, &group[..1]);
    assert!(!can_build_house(&game, 1, group[0]));

    give(&mut game, 1, &group);
    assert!(can_build_house(&game, 1, group[0]));
}

#[test]
fn houses_must_be_built_evenly() {
    let mut game = game_with(2);
    let group = india();
    give(&mut game, 1, &group);

    build_house(&mut game, 1, group[0]);
    // The first square is now ahead of its neighbour, so it must wait.
    assert!(!can_build_house(&game, 1, group[0]));
    assert!(can_build_house(&game, 1, group[1]));

    build_house(&mut game, 1, group[1]);
    assert!(can_build_house(&game, 1, group[0]));
}

#[test]
fn a_mortgage_anywhere_in_the_group_blocks_building() {
    let mut game = game_with(2);
    let group = india();
    give(&mut game, 1, &group);
    game.squares[group[1] as usize].mortgaged = true;
    assert!(!can_build_house(&game, 1, group[0]));
}

#[test]
fn a_hotel_needs_four_houses_everywhere_in_the_group() {
    let mut game = game_with(2);
    let group = india();
    give(&mut game, 1, &group);
    game.players[1].cash = 10_000;

    for square in &group {
        game.squares[*square as usize].houses = 4;
    }
    game.squares[group[1] as usize].houses = 3;
    assert!(!can_build_hotel(&game, 1, group[0]));

    game.squares[group[1] as usize].houses = 4;
    assert!(can_build_hotel(&game, 1, group[0]));
}

#[test]
fn building_a_hotel_returns_four_houses_to_the_bank() {
    let mut game = game_with(2);
    let group = india();
    give(&mut game, 1, &group);
    game.players[1].cash = 10_000;
    for square in &group {
        game.squares[*square as usize].houses = 4;
    }
    game.houses_available -= 4 * group.len() as u8;

    let houses_before = game.houses_available;
    let hotels_before = game.hotels_available;
    build_hotel(&mut game, 1, group[0]);

    assert!(game.squares[group[0] as usize].hotel);
    assert_eq!(game.squares[group[0] as usize].houses, 0);
    assert_eq!(game.houses_available, houses_before + 4);
    assert_eq!(game.hotels_available, hotels_before - 1);
}

#[test]
fn the_bank_can_run_out_of_houses() {
    let mut game = game_with(2);
    let group = india();
    give(&mut game, 1, &group);
    game.houses_available = 0;
    assert!(!can_build_house(&game, 1, group[0]));
}

#[test]
fn selling_a_hotel_puts_four_houses_back_on_the_square() {
    let mut game = game_with(2);
    let group = india();
    give(&mut game, 1, &group);
    game.squares[group[0] as usize].hotel = true;
    game.hotels_available -= 1;

    let refund = sell_building(&mut game, 1, group[0]);

    assert!(refund > 0);
    assert!(!game.squares[group[0] as usize].hotel);
    assert_eq!(game.squares[group[0] as usize].houses, 4);
    assert_eq!(game.hotels_available, TOTAL_HOTELS);
}

#[test]
fn a_hotel_cannot_be_broken_when_the_bank_is_short_of_houses() {
    let mut game = game_with(2);
    let group = india();
    give(&mut game, 1, &group);
    game.squares[group[0] as usize].hotel = true;

    game.houses_available = 3;
    assert!(!can_sell_building(&game, group[0]));

    game.houses_available = 4;
    assert!(can_sell_building(&game, group[0]));
}

#[test]
fn selling_a_house_refunds_half_price() {
    let mut game = game_with(2);
    let group = india();
    give(&mut game, 1, &group);
    build_house(&mut game, 1, group[0]);

    let cash_before = game.players[1].cash;
    let refund = sell_building(&mut game, 1, group[0]);

    assert_eq!(refund, tile(group[0]).house_cost / 2);
    assert_eq!(game.players[1].cash, cash_before + refund as i64);
    assert_eq!(game.squares[group[0] as usize].houses, 0);
}

// ---------------------------------------------------------------------------
// mortgages
// ---------------------------------------------------------------------------

#[test]
fn mortgaging_pays_out_and_lifting_costs_ten_percent_more() {
    let mut game = game_with(2);
    let square = india()[0];
    give(&mut game, 1, &[square]);
    let value = tile(square).mortgage_value;

    let cash_before = game.players[1].cash;
    assert_eq!(mortgage(&mut game, 1, square), value);
    assert!(game.squares[square as usize].mortgaged);
    assert_eq!(game.players[1].cash, cash_before + value as i64);

    let cost = unmortgage(&mut game, 1, square);
    assert_eq!(cost, value + value / 10);
    assert!(!game.squares[square as usize].mortgaged);
    assert_eq!(game.players[1].cash, cash_before - (value / 10) as i64);
}

// ---------------------------------------------------------------------------
// cards
// ---------------------------------------------------------------------------

#[test]
fn fortune_card_zero_advances_to_go() {
    let mut game = game_with(2);
    game.players[1].position = 25;
    let before = game.players[1].cash;

    apply_fortune_card(&mut game, 0);

    assert_eq!(game.players[1].position, 0);
    assert_eq!(game.players[1].cash, before + GO_SALARY as i64);
}

#[test]
fn the_grand_promenade_cards_resolve_to_a_real_square() {
    for card in [1u8, 12] {
        let mut game = game_with(2);
        game.players[1].position = 5;
        apply_fortune_card(&mut game, card);
        assert_eq!(
            game.players[1].position, GRAND_PROMENADE,
            "fortune card {card} should move the player"
        );
    }

    let mut game = game_with(2);
    game.players[1].position = 5;
    apply_fortune_card(&mut game, 2);
    assert_eq!(game.players[1].position, PACIFICA);
}

#[test]
fn go_back_three_spaces_walks_backwards() {
    let mut game = game_with(2);
    game.players[1].position = 22;
    apply_fortune_card(&mut game, 7);
    assert_eq!(game.players[1].position, 19);
}

#[test]
fn the_jail_cards_are_kept_by_the_drawing_player() {
    let mut game = game_with(2);
    apply_fortune_card(&mut game, 6);
    assert!(game.players[1].fortune_jail_card);

    let mut game = game_with(2);
    apply_treasury_card(&mut game, 4);
    assert!(game.players[1].treasury_jail_card);
}

#[test]
fn go_to_jail_cards_actually_jail_you() {
    let mut game = game_with(2);
    game.players[1].position = 22;
    apply_fortune_card(&mut game, 8);
    assert!(game.players[1].in_jail);
    assert_eq!(game.players[1].position, JAIL_INDEX);

    let mut game = game_with(2);
    apply_treasury_card(&mut game, 5);
    assert!(game.players[1].in_jail);
}

#[test]
fn the_birthday_card_collects_from_every_other_player() {
    let mut game = game_with(4);
    let before = game.players[1].cash;

    apply_treasury_card(&mut game, 8);

    assert_eq!(game.players[1].cash, before + 30);
    for seat in 2..=4 {
        assert_eq!(game.players[seat as usize].cash, 1500 - 10);
    }
}

#[test]
fn the_birthday_card_cannot_take_more_than_a_player_has() {
    let mut game = game_with(3);
    game.players[2].cash = 4;
    game.players[3].cash = 0;
    let before = game.players[1].cash;

    apply_treasury_card(&mut game, 8);

    assert_eq!(game.players[1].cash, before + 4);
    assert_eq!(game.players[2].cash, 0);
    assert_eq!(game.players[3].cash, 0);
}

#[test]
fn the_chairperson_card_pays_every_other_player() {
    let mut game = game_with(3);
    let before = game.players[1].cash;

    apply_fortune_card(&mut game, 13);

    assert_eq!(game.players[1].cash, before - 100);
    assert_eq!(game.players[2].cash, 1550);
    assert_eq!(game.players[3].cash, 1550);
}

#[test]
fn street_repairs_charge_per_building() {
    let mut game = game_with(2);
    let group = india();
    give(&mut game, 1, &group);
    game.squares[group[0] as usize].houses = 3;
    game.squares[group[1] as usize].hotel = true;

    let before = game.players[1].cash;
    apply_treasury_card(&mut game, 13);

    // Treasury card 13 is 40 per house, 115 per hotel.
    assert_eq!(game.players[1].cash, before - (3 * 40 + 115));
}

#[test]
fn every_card_index_is_handled_without_panicking() {
    for index in 0..16u8 {
        let mut game = game_with(4);
        game.players[1].position = 12;
        apply_fortune_card(&mut game, index);

        let mut game = game_with(4);
        game.players[1].position = 12;
        apply_treasury_card(&mut game, index);
    }
}

// ---------------------------------------------------------------------------
// auctions
// ---------------------------------------------------------------------------

fn open_auction(game: &mut Game, square: u8) {
    game.auction_queue[0] = square;
    game.auction_queue_len = 1;
    end_turn_or_auction(game, NOW);
}

#[test]
fn an_unbought_square_opens_an_auction_at_end_of_turn() {
    let mut game = game_with(3);
    game.turn = 1;
    open_auction(&mut game, india()[0]);

    assert!(game.auction.active);
    assert_eq!(game.phase, Phase::Auction);
    // Bidding opens to the left of the player whose turn it was.
    assert_eq!(game.auction.current_bidder, 2);
}

#[test]
fn the_last_bidder_standing_wins_the_square() {
    let mut game = game_with(3);
    let square = india()[0];
    open_auction(&mut game, square);

    place_bid(&mut game, 50, NOW);
    assert_eq!(game.auction.highest_bidder, 2);
    assert_eq!(game.auction.current_bidder, 3);

    withdraw_from_auction(&mut game, NOW);
    withdraw_from_auction(&mut game, NOW);

    assert!(!game.auction.active);
    assert_eq!(game.squares[square as usize].owner, 2);
    assert_eq!(game.players[2].cash, 1500 - 50);
}

#[test]
fn an_auction_nobody_bids_on_leaves_the_square_with_the_bank() {
    let mut game = game_with(3);
    let square = india()[0];
    open_auction(&mut game, square);

    withdraw_from_auction(&mut game, NOW);
    withdraw_from_auction(&mut game, NOW);
    withdraw_from_auction(&mut game, NOW);

    assert!(!game.auction.active);
    assert_eq!(game.squares[square as usize].owner, BANK);
}

#[test]
fn a_bid_passes_the_chance_to_respond_to_the_other_player() {
    let mut game = game_with(2);
    let square = india()[0];
    open_auction(&mut game, square);

    place_bid(&mut game, 100, NOW);

    // The opponent still gets a chance to outbid before it closes.
    assert!(game.auction.active);
    assert_eq!(game.auction.highest_bidder, 2);
    assert_eq!(game.auction.current_bidder, 1);

    withdraw_from_auction(&mut game, NOW);

    assert!(!game.auction.active);
    assert_eq!(game.squares[square as usize].owner, 2);
    assert_eq!(game.players[2].cash, 1400);
}

#[test]
fn bidding_wraps_back_to_the_leader_and_closes() {
    let mut game = game_with(3);
    let square = india()[0];
    open_auction(&mut game, square);

    place_bid(&mut game, 60, NOW);
    assert_eq!(game.auction.current_bidder, 3);

    place_bid(&mut game, 90, NOW);
    assert_eq!(game.auction.current_bidder, 1);

    // Everyone still in keeps getting a chance until it wraps to the leader.
    withdraw_from_auction(&mut game, NOW);
    assert_eq!(game.auction.current_bidder, 2);
    assert!(game.auction.active);

    withdraw_from_auction(&mut game, NOW);

    assert!(!game.auction.active);
    assert_eq!(game.squares[square as usize].owner, 3);
    assert_eq!(game.players[3].cash, 1500 - 90);
}

#[test]
fn the_turn_moves_on_once_the_auction_queue_is_empty() {
    let mut game = game_with(3);
    game.turn = 1;
    end_turn_or_auction(&mut game, NOW);
    assert_eq!(game.turn, 2);
    assert_eq!(game.phase, Phase::TurnStart);
}

// ---------------------------------------------------------------------------
// trades
// ---------------------------------------------------------------------------

fn draft(initiator: u8, recipient: u8) -> TradeState {
    TradeState {
        active: true,
        initiator,
        recipient,
        initiator_cash: 0,
        recipient_cash: 0,
        squares: [0; BOARD_SIZE],
        awaiting_response: true,
    }
}

#[test]
fn a_valid_trade_swaps_deeds_and_cash() {
    let mut game = game_with(2);
    let group = india();
    give(&mut game, 1, &[group[0]]);
    give(&mut game, 2, &[group[1]]);

    let mut trade = draft(1, 2);
    trade.squares[group[0] as usize] = 1;
    trade.squares[group[1] as usize] = 2;
    trade.initiator_cash = 100;

    assert!(trade_is_valid(&game, &trade));
    apply_trade(&mut game, &trade);

    assert_eq!(game.squares[group[0] as usize].owner, 2);
    assert_eq!(game.squares[group[1] as usize].owner, 1);
    assert_eq!(game.players[1].cash, 1400);
    assert_eq!(game.players[2].cash, 1600);
}

#[test]
fn you_cannot_trade_a_square_you_do_not_own() {
    let mut game = game_with(2);
    let group = india();
    give(&mut game, 2, &[group[0]]);

    let mut trade = draft(1, 2);
    trade.squares[group[0] as usize] = 1;
    assert!(!trade_is_valid(&game, &trade));
}

#[test]
fn you_cannot_trade_a_built_up_group() {
    let mut game = game_with(2);
    let group = india();
    give(&mut game, 1, &group);
    game.squares[group[1] as usize].houses = 1;

    let mut trade = draft(1, 2);
    trade.squares[group[0] as usize] = 1;
    assert!(!trade_is_valid(&game, &trade));
}

#[test]
fn a_trade_you_cannot_fund_is_rejected() {
    let mut game = game_with(2);
    game.players[1].cash = 50;

    let mut trade = draft(1, 2);
    trade.initiator_cash = 500;
    assert!(!trade_is_valid(&game, &trade));
}

// ---------------------------------------------------------------------------
// elimination and settlement
// ---------------------------------------------------------------------------

#[test]
fn a_creditor_inherits_the_bankrupt_players_estate() {
    let mut game = game_with(3);
    let group = india();
    give(&mut game, 1, &group);
    game.players[1].cash = -50;
    game.players[1].creditor = 2;
    let creditor_before = game.players[2].cash;

    eliminate(&mut game, 1, NOW);

    assert!(!game.players[1].active);
    for square in &group {
        assert_eq!(game.squares[*square as usize].owner, 2);
    }
    // Nothing to hand over from a negative balance.
    assert_eq!(game.players[2].cash, creditor_before);
}

#[test]
fn the_bank_reclaims_and_clears_an_estate_with_no_creditor() {
    let mut game = game_with(3);
    let group = india();
    give(&mut game, 1, &group);
    game.squares[group[0] as usize].houses = 2;
    game.squares[group[1] as usize].mortgaged = true;

    eliminate(&mut game, 1, NOW);

    for square in &group {
        let state = game.squares[*square as usize];
        assert_eq!(state.owner, BANK);
        assert_eq!(state.houses, 0);
        assert!(!state.mortgaged);
    }
}

#[test]
fn the_last_player_standing_wins() {
    let mut game = game_with(2);
    eliminate(&mut game, 2, NOW);

    assert_eq!(game.phase, Phase::GameOver);
    assert_eq!(game.winner, 1);
}

#[test]
fn eliminating_the_active_player_hands_the_turn_on() {
    let mut game = game_with(3);
    game.turn = 2;
    eliminate(&mut game, 2, NOW);

    assert_eq!(game.winner, BANK);
    assert!(!game.players[2].active);
    assert_eq!(game.turn, 3);
}

#[test]
fn turn_rotation_skips_eliminated_seats() {
    let mut game = game_with(3);
    game.players[2].active = false;
    game.turn = 1;

    begin_turn(&mut game, NOW);

    assert_eq!(game.turn, 3);
}

#[test]
fn a_player_is_only_bankrupt_when_they_cannot_raise_the_money() {
    let mut game = game_with(2);
    let group = india();
    give(&mut game, 1, &group);
    game.players[1].cash = -10;

    // Mortgaging the group would cover a $10 debt.
    assert!(!is_bankrupt(&game, 1));

    game.players[1].cash = -100_000;
    assert!(is_bankrupt(&game, 1));
}

#[test]
fn net_worth_counts_cash_deeds_and_buildings() {
    let mut game = game_with(2);
    let group = india();
    give(&mut game, 1, &group);
    game.squares[group[0] as usize].houses = 2;

    let expected: i64 = 1500
        + group.iter().map(|s| tile(*s).price as i64).sum::<i64>()
        + 2 * tile(group[0]).house_cost as i64;

    assert_eq!(net_worth(&game, 1), expected);
}

// ---------------------------------------------------------------------------
// randomness
// ---------------------------------------------------------------------------

#[test]
fn dice_always_land_between_one_and_six() {
    for byte in 0..=255u8 {
        let mut game = game_with(2);
        let randomness = [byte; 32];
        let outcome = apply_dice(&mut game, &randomness);
        assert!((1..=6).contains(&outcome.die1), "die1 out of range");
        assert!((1..=6).contains(&outcome.die2), "die2 out of range");
    }
}

#[test]
fn the_same_randomness_always_produces_the_same_game() {
    let randomness: [u8; 32] = core::array::from_fn(|i| (i as u8).wrapping_mul(7).wrapping_add(3));

    let mut first = game_with(4);
    let mut second = game_with(4);
    apply_setup_randomness(&mut first, &randomness, NOW);
    apply_setup_randomness(&mut second, &randomness, NOW);

    assert_eq!(first.fortune_deck, second.fortune_deck);
    assert_eq!(first.treasury_deck, second.treasury_deck);
    assert_eq!(first.turn, second.turn);
}

#[test]
fn shuffling_keeps_every_card_exactly_once() {
    let randomness: [u8; 32] = core::array::from_fn(|i| (i as u8).wrapping_mul(13).wrapping_add(1));
    let mut game = game_with(4);
    apply_setup_randomness(&mut game, &randomness, NOW);

    let mut fortune = game.fortune_deck;
    fortune.sort_unstable();
    assert_eq!(fortune, core::array::from_fn::<u8, 16, _>(|i| i as u8));

    let mut treasury = game.treasury_deck;
    treasury.sort_unstable();
    assert_eq!(treasury, core::array::from_fn::<u8, 16, _>(|i| i as u8));
}

#[test]
fn setup_keeps_every_seat_exactly_once() {
    let randomness: [u8; 32] = core::array::from_fn(|i| (i as u8).wrapping_mul(29).wrapping_add(5));
    let mut game = game_with(6);
    let wallets: Vec<Pubkey> = (1..=6).map(|s| game.players[s as usize].wallet).collect();

    apply_setup_randomness(&mut game, &randomness, NOW);

    let mut seated: Vec<Pubkey> = (1..=6).map(|s| game.players[s as usize].wallet).collect();
    seated.sort();
    let mut expected = wallets;
    expected.sort();
    assert_eq!(seated, expected, "a player was lost or duplicated");
}

#[test]
fn setup_leaves_the_first_seat_ready_to_roll() {
    let randomness = [17u8; 32];
    let mut game = game_with(3);
    game.phase = Phase::Lobby;
    apply_setup_randomness(&mut game, &randomness, NOW);

    assert_eq!(game.phase, Phase::TurnStart);
    assert_eq!(game.turn, 1);
    assert!(!game.dice_rolled);
    assert!(!game.vrf_pending);
    assert_eq!(game.turn_deadline, NOW + TURN_LIMIT_SECONDS);
}

// ---------------------------------------------------------------------------
// full game shape
// ---------------------------------------------------------------------------

#[test]
fn a_long_random_game_never_corrupts_its_own_state() {
    let mut game = game_with(4);
    apply_setup_randomness(&mut game, &[91u8; 32], NOW);

    for step in 0..400u32 {
        if game.phase == Phase::GameOver {
            break;
        }

        if game.pending != Pending::None {
            resolve_pending(&mut game);
            continue;
        }

        if game.auction.active {
            withdraw_from_auction(&mut game, NOW);
            continue;
        }

        let die1 = ((step % 6) + 1) as u8;
        let die2 = (((step / 6) % 6) + 1) as u8;
        resolve_roll(&mut game, die1, die2);

        if game.pending != Pending::None {
            resolve_pending(&mut game);
        }

        let seat = game.turn;
        if can_buy(&game, seat) {
            buy_current_square(&mut game, seat);
        }

        if game.players[seat as usize].is_broke() {
            eliminate(&mut game, seat, NOW);
            continue;
        }

        end_turn_or_auction(&mut game, NOW);

        // Invariants that must hold after every single turn.
        assert!(game.turn >= 1 && game.turn <= game.player_count);
        assert!(game.houses_available <= TOTAL_HOUSES);
        assert!(game.hotels_available <= TOTAL_HOTELS);
        for seat in 1..=game.player_count {
            assert!(game.players[seat as usize].position < BOARD_SIZE as u8);
        }
        for square in 0..BOARD_SIZE {
            assert!(game.squares[square].owner <= game.player_count);
            assert!(game.squares[square].houses <= 4);
        }
    }
}
