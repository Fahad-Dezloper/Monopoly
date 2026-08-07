use crate::board::{
    tile, TileKind, BOARD_SIZE, GO_SALARY, GO_TO_JAIL_INDEX, JAIL_FINE, JAIL_INDEX, TOTAL_HOTELS,
    TOTAL_HOUSES,
};
use crate::state::{
    AuctionState, Game, Pending, PlayerState, SquareState, TradeState, VrfPurpose, BANK,
    FORTUNE_COUNT, SEATS, TREASURY_COUNT, TURN_LIMIT_SECONDS,
};

pub const GRAND_PROMENADE: u8 = 39;
pub const PACIFICA: u8 = 24;
pub const CENTRAL_STATION: u8 = 5;

pub const GROUP_TRANSPORT: u8 = 1;
pub const GROUP_UTILITY: u8 = 2;

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct LandOutcome {
    pub square: u8,
    pub rent_paid: u32,
    pub rent_to: u8,
    pub tax_paid: u32,
    pub salary_collected: u32,
    pub queued_for_auction: bool,
    pub went_broke: bool,
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct RollOutcome {
    pub die1: u8,
    pub die2: u8,
    pub doubles: bool,
    pub sent_to_jail: bool,
    pub left_jail: bool,
    pub land: LandOutcome,
}

pub fn fresh_squares() -> [SquareState; BOARD_SIZE] {
    [SquareState::empty(); BOARD_SIZE]
}

pub fn fresh_players() -> [PlayerState; SEATS] {
    [PlayerState::empty(); SEATS]
}

fn shuffle(deck: &mut [u8], randomness: &[u8; 32], salt: u8) {
    let len = deck.len();
    if len < 2 {
        return;
    }
    let mut cursor = salt as usize;
    for i in (1..len).rev() {
        let byte = randomness[cursor % 32] as usize;
        cursor = cursor.wrapping_add(1);
        let j = (byte.wrapping_mul(31).wrapping_add(cursor)) % (i + 1);
        deck.swap(i, j);
    }
}

pub fn apply_setup_randomness(game: &mut Game, randomness: &[u8; 32], now: i64) {
    let mut fortune: [u8; FORTUNE_COUNT] = core::array::from_fn(|i| i as u8);
    let mut treasury: [u8; TREASURY_COUNT] = core::array::from_fn(|i| i as u8);
    shuffle(&mut fortune, randomness, 0);
    shuffle(&mut treasury, randomness, 7);
    game.fortune_deck = fortune;
    game.treasury_deck = treasury;
    game.fortune_index = 0;
    game.treasury_index = 0;

    let count = game.player_count as usize;
    if count > 1 {
        let mut order: [u8; SEATS] = core::array::from_fn(|i| i as u8);
        shuffle(&mut order[1..=count], randomness, 19);
        let snapshot = game.players;
        for (slot, seat) in order.iter().enumerate().take(count + 1).skip(1) {
            game.players[slot] = snapshot[*seat as usize];
        }
    }

    game.vrf_pending = false;
    game.vrf_purpose = VrfPurpose::None;
    game.turn = 0;
    begin_turn(game, now);
}

pub fn begin_turn(game: &mut Game, now: i64) {
    let count = game.player_count;
    if count == 0 {
        return;
    }
    let mut guard = 0;
    loop {
        game.turn += 1;
        if game.turn > count {
            game.turn -= count;
        }
        guard += 1;
        if guard > count || game.players[game.turn as usize].active {
            break;
        }
    }

    game.dice_rolled = false;
    game.double_count = 0;
    game.phase = crate::state::Phase::TurnStart;
    game.pending = Pending::None;
    game.turn_deadline = now + TURN_LIMIT_SECONDS;
}

pub fn pay(game: &mut Game, seat: u8, amount: u32, creditor: u8) -> bool {
    let player = &mut game.players[seat as usize];
    player.cash -= amount as i64;
    if player.cash < 0 {
        player.creditor = creditor;
        return false;
    }
    true
}

pub fn credit(game: &mut Game, seat: u8, amount: u32) {
    game.players[seat as usize].cash += amount as i64;
}

pub fn owns_full_group(game: &Game, square: u8) -> bool {
    let spec = tile(square);
    if spec.group < 3 || spec.group_size == 0 {
        return false;
    }
    let owner = game.squares[square as usize].owner;
    if owner == BANK {
        return false;
    }
    spec.members().all(|i| game.squares[i].owner == owner)
}

pub fn group_has_mortgage(game: &Game, square: u8) -> bool {
    tile(square).members().any(|i| game.squares[i].mortgaged)
}

fn group_min_houses(game: &Game, square: u8) -> u8 {
    tile(square)
        .members()
        .map(|i| game.squares[i].houses)
        .min()
        .unwrap_or(0)
}

fn transport_owned_by(game: &Game, owner: u8) -> u32 {
    (0..BOARD_SIZE)
        .filter(|i| tile(*i as u8).group == GROUP_TRANSPORT && game.squares[*i].owner == owner)
        .count() as u32
}

fn rent_for_houses(square: u8, state: &SquareState) -> u32 {
    let spec = tile(square);
    if state.hotel {
        return spec.rents[6];
    }
    match state.houses {
        1 => spec.rents[2],
        2 => spec.rents[3],
        3 => spec.rents[4],
        4 => spec.rents[5],
        _ => spec.rents[0],
    }
}

pub fn calculate_rent(game: &Game, square: u8, die1: u8, die2: u8, increased_rent: bool) -> u32 {
    let state = game.squares[square as usize];
    let spec = tile(square);
    if state.owner == BANK || state.mortgaged {
        return 0;
    }

    match spec.group {
        GROUP_TRANSPORT => {
            let owned = transport_owned_by(game, state.owner);
            let base = match owned {
                0 | 1 => spec.rents[0],
                2 => spec.rents[1],
                3 => spec.rents[2],
                _ => spec.rents[3],
            };
            base * if increased_rent { 2 } else { 1 }
        }
        GROUP_UTILITY => {
            let both = spec.members().all(|i| game.squares[i].owner == state.owner);
            let factor = if increased_rent || both {
                spec.rents[1]
            } else {
                spec.rents[0]
            };
            (die1 as u32 + die2 as u32) * factor
        }
        group if group >= 3 => {
            if !owns_full_group(game, square) {
                return spec.rents[0];
            }
            if state.houses == 0 && !state.hotel {
                let monopoly = spec.rents[1];
                if monopoly > 0 {
                    monopoly
                } else {
                    spec.rents[0] * 2
                }
            } else {
                rent_for_houses(square, &state)
            }
        }
        _ => 0,
    }
}

fn queue_for_auction(game: &mut Game, square: u8) -> bool {
    let len = game.auction_queue_len as usize;
    if game.auction_queue[..len].contains(&square) || len >= BOARD_SIZE {
        return false;
    }
    game.auction_queue[len] = square;
    game.auction_queue_len += 1;
    true
}

pub fn go_to_jail(game: &mut Game) {
    let turn = game.turn;
    {
        let player = game.current_mut();
        player.in_jail = true;
        player.position = JAIL_INDEX;
    }
    let _ = turn;
    game.double_count = 0;
    game.dice_rolled = true;
    game.pending = Pending::None;
    game.phase = crate::state::Phase::Rolled;
}

pub fn pay_jail_fine(game: &mut Game) {
    let turn = game.turn;
    pay(game, turn, JAIL_FINE, BANK);
    let player = &mut game.players[turn as usize];
    player.in_jail = false;
    player.jail_rolls = 0;
}

pub fn use_jail_card(game: &mut Game) -> bool {
    let turn = game.turn;
    let player = &mut game.players[turn as usize];
    if player.treasury_jail_card {
        player.treasury_jail_card = false;
    } else if player.fortune_jail_card {
        player.fortune_jail_card = false;
    } else {
        return false;
    }
    player.in_jail = false;
    player.jail_rolls = 0;
    true
}

pub fn land(game: &mut Game, increased_rent: bool) -> LandOutcome {
    let turn = game.turn;
    let position = game.players[turn as usize].position;
    let spec = tile(position);
    let mut outcome = LandOutcome {
        square: position,
        ..Default::default()
    };

    game.squares[position as usize].land_count =
        game.squares[position as usize].land_count.saturating_add(1);

    if spec.is_ownable() && game.squares[position as usize].owner == BANK {
        outcome.queued_for_auction = queue_for_auction(game, position);
    }

    let owner = game.squares[position as usize].owner;
    if owner != BANK && owner != turn && !game.squares[position as usize].mortgaged {
        let rent = calculate_rent(game, position, game.die1, game.die2, increased_rent);
        if rent > 0 {
            let settled = pay(game, turn, rent, owner);
            credit(game, owner, rent);
            outcome.rent_paid = rent;
            outcome.rent_to = owner;
            outcome.went_broke = !settled;
        }
    }

    if spec.tax_amount > 0 {
        let settled = pay(game, turn, spec.tax_amount, BANK);
        outcome.tax_paid = spec.tax_amount;
        outcome.went_broke |= !settled;
    }

    if position == GO_TO_JAIL_INDEX || spec.kind == TileKind::GoToJail {
        game.pending = Pending::GoToJail;
        return outcome;
    }

    if spec.kind == TileKind::Treasury {
        draw_treasury(game);
        return outcome;
    }
    if spec.kind == TileKind::Fortune {
        draw_fortune(game);
        return outcome;
    }

    game.phase = crate::state::Phase::Rolled;
    outcome
}

fn advance_to(game: &mut Game, destination: u8, increased_rent: bool) -> LandOutcome {
    let turn = game.turn;
    let mut salary = 0;
    if game.players[turn as usize].position > destination {
        credit(game, turn, GO_SALARY);
        salary = GO_SALARY;
    }
    game.players[turn as usize].position = destination;
    let mut outcome = land(game, increased_rent);
    outcome.salary_collected = salary;
    outcome
}

fn advance_to_nearest(game: &mut Game, group: u8) -> LandOutcome {
    let turn = game.turn;
    let position = game.players[turn as usize].position;
    let members: Vec<u8> = (0..BOARD_SIZE as u8)
        .filter(|i| tile(*i).group == group)
        .collect();
    if members.is_empty() {
        return LandOutcome::default();
    }
    let mut salary = 0;
    let destination = match members.iter().find(|i| **i > position) {
        Some(found) => *found,
        None => {
            credit(game, turn, GO_SALARY);
            salary = GO_SALARY;
            members[0]
        }
    };
    game.players[turn as usize].position = destination;
    let mut outcome = land(game, true);
    outcome.salary_collected = salary;
    outcome
}

pub fn apply_dice(game: &mut Game, randomness: &[u8; 32]) -> RollOutcome {
    let die1 = (randomness[0] % 6) + 1;
    let die2 = (randomness[1] % 6) + 1;
    resolve_roll(game, die1, die2)
}

pub fn resolve_roll(game: &mut Game, die1: u8, die2: u8) -> RollOutcome {
    game.die1 = die1;
    game.die2 = die2;
    game.dice_rolled = true;
    game.vrf_pending = false;
    game.vrf_purpose = VrfPurpose::None;
    game.phase = crate::state::Phase::Rolled;

    let doubles = die1 == die2;
    let turn = game.turn;
    let in_jail = game.players[turn as usize].in_jail;
    let mut outcome = RollOutcome {
        die1,
        die2,
        doubles,
        ..Default::default()
    };

    game.double_count += 1;

    if doubles && !in_jail {
        if game.double_count >= 3 {
            game.double_count = 0;
            game.pending = Pending::GoToJail;
            outcome.sent_to_jail = true;
            return outcome;
        }
    } else if !doubles {
        game.double_count = 0;
    }

    if in_jail {
        game.players[turn as usize].jail_rolls += 1;
        if doubles {
            {
                let player = &mut game.players[turn as usize];
                player.in_jail = false;
                player.jail_rolls = 0;
                player.position = JAIL_INDEX + die1 + die2;
            }
            game.double_count = 0;
            outcome.left_jail = true;
            outcome.land = land(game, false);
        } else if game.players[turn as usize].jail_rolls >= 3 {
            game.pending = Pending::JailFine;
        }
        return outcome;
    }

    let moved = game.players[turn as usize].position as u16 + die1 as u16 + die2 as u16;
    if moved >= BOARD_SIZE as u16 {
        game.players[turn as usize].position = (moved - BOARD_SIZE as u16) as u8;
        credit(game, turn, GO_SALARY);
        outcome.land.salary_collected = GO_SALARY;
    } else {
        game.players[turn as usize].position = moved as u8;
    }

    let salary = outcome.land.salary_collected;
    outcome.land = land(game, false);
    outcome.land.salary_collected += salary;
    outcome
}

pub fn resolve_pending(game: &mut Game) -> LandOutcome {
    let pending = game.pending;
    game.pending = Pending::None;

    match pending {
        Pending::GoToJail => {
            go_to_jail(game);
            LandOutcome::default()
        }
        Pending::JailFine => {
            let turn = game.turn;
            pay(game, turn, JAIL_FINE, BANK);
            {
                let player = &mut game.players[turn as usize];
                player.in_jail = false;
                player.jail_rolls = 0;
                player.position = JAIL_INDEX + game.die1 + game.die2;
            }
            land(game, false)
        }
        Pending::Card { fortune, index } => {
            if fortune {
                apply_fortune_card(game, index)
            } else {
                apply_treasury_card(game, index)
            }
        }
        Pending::None => LandOutcome::default(),
    }
}

fn draw_fortune(game: &mut Game) {
    let index = game.fortune_deck[game.fortune_index as usize % FORTUNE_COUNT];
    game.fortune_index = (game.fortune_index + 1) % FORTUNE_COUNT as u8;
    game.pending = Pending::Card {
        fortune: true,
        index,
    };
    game.phase = crate::state::Phase::Card;
}

fn draw_treasury(game: &mut Game) {
    let index = game.treasury_deck[game.treasury_index as usize % TREASURY_COUNT];
    game.treasury_index = (game.treasury_index + 1) % TREASURY_COUNT as u8;
    game.pending = Pending::Card {
        fortune: false,
        index,
    };
    game.phase = crate::state::Phase::Card;
}

fn street_repairs(game: &mut Game, per_house: u32, per_hotel: u32) -> u32 {
    let turn = game.turn;
    let mut cost = 0;
    for square in 0..BOARD_SIZE {
        let state = game.squares[square];
        if state.owner != turn {
            continue;
        }
        if state.hotel {
            cost += per_hotel;
        } else {
            cost += state.houses as u32 * per_house;
        }
    }
    if cost > 0 {
        pay(game, turn, cost, BANK);
    }
    cost
}

pub fn apply_treasury_card(game: &mut Game, index: u8) -> LandOutcome {
    let turn = game.turn;
    let mut outcome = LandOutcome::default();

    match index {
        0 => return advance_to(game, 0, false),
        1 => credit(game, turn, 200),
        2 => {
            pay(game, turn, 50, BANK);
            outcome.tax_paid = 50;
        }
        3 => credit(game, turn, 50),
        4 => game.players[turn as usize].treasury_jail_card = true,
        5 => {
            go_to_jail(game);
            return outcome;
        }
        6 | 9 | 15 => credit(game, turn, 100),
        7 => credit(game, turn, 20),
        8 => {
            let mut total = 0;
            for seat in 1..=game.player_count {
                if seat == turn || !game.players[seat as usize].active {
                    continue;
                }
                let available = game.players[seat as usize].cash.max(0).min(10) as u32;
                game.players[seat as usize].cash -= available as i64;
                total += available;
            }
            credit(game, turn, total);
        }
        10 => {
            pay(game, turn, 100, BANK);
            outcome.tax_paid = 100;
        }
        11 => {
            pay(game, turn, 150, BANK);
            outcome.tax_paid = 150;
        }
        12 => credit(game, turn, 25),
        13 => outcome.tax_paid = street_repairs(game, 40, 115),
        14 => credit(game, turn, 10),
        _ => {}
    }

    outcome.went_broke = game.players[turn as usize].is_broke();
    game.phase = crate::state::Phase::Rolled;
    outcome
}

pub fn apply_fortune_card(game: &mut Game, index: u8) -> LandOutcome {
    let turn = game.turn;
    let mut outcome = LandOutcome::default();

    match index {
        0 => return advance_to(game, 0, false),
        1 | 12 => return advance_to(game, GRAND_PROMENADE, false),
        2 => return advance_to(game, PACIFICA, false),
        3 => return advance_to_nearest(game, GROUP_TRANSPORT),
        4 => return advance_to_nearest(game, GROUP_UTILITY),
        5 => credit(game, turn, 50),
        6 => game.players[turn as usize].fortune_jail_card = true,
        7 => {
            let position = game.players[turn as usize].position;
            game.players[turn as usize].position = position.saturating_sub(3);
            return land(game, false);
        }
        8 => {
            go_to_jail(game);
            return outcome;
        }
        9 => outcome.tax_paid = street_repairs(game, 25, 100),
        10 => {
            pay(game, turn, 15, BANK);
            outcome.tax_paid = 15;
        }
        11 => return advance_to(game, CENTRAL_STATION, false),
        13 => {
            let mut total = 0;
            for seat in 1..=game.player_count {
                if seat == turn || !game.players[seat as usize].active {
                    continue;
                }
                credit(game, seat, 50);
                pay(game, turn, 50, seat);
                total += 50;
            }
            outcome.tax_paid = total;
        }
        14 => credit(game, turn, 150),
        15 => credit(game, turn, 100),
        _ => {}
    }

    outcome.went_broke = game.players[turn as usize].is_broke();
    game.phase = crate::state::Phase::Rolled;
    outcome
}

fn drop_from_auction_queue(game: &mut Game, square: u8) {
    let len = game.auction_queue_len as usize;
    let mut write = 0;
    for read in 0..len {
        if game.auction_queue[read] != square {
            game.auction_queue[write] = game.auction_queue[read];
            write += 1;
        }
    }
    game.auction_queue_len = write as u8;
}

pub fn can_buy(game: &Game, seat: u8) -> bool {
    let position = game.players[seat as usize].position;
    let spec = tile(position);
    spec.is_ownable()
        && game.squares[position as usize].owner == BANK
        && game.players[seat as usize].cash >= spec.price as i64
        && game.dice_rolled
}

pub fn buy_current_square(game: &mut Game, seat: u8) -> u32 {
    let position = game.players[seat as usize].position;
    let price = tile(position).price;
    pay(game, seat, price, BANK);
    game.squares[position as usize].owner = seat;
    drop_from_auction_queue(game, position);
    price
}

pub fn can_build_house(game: &Game, seat: u8, square: u8) -> bool {
    let spec = tile(square);
    let state = game.squares[square as usize];
    if state.owner != seat || spec.group < 3 {
        return false;
    }
    if state.mortgaged || state.hotel || state.houses >= 4 {
        return false;
    }
    if !owns_full_group(game, square) || group_has_mortgage(game, square) {
        return false;
    }
    if state.houses > group_min_houses(game, square) {
        return false;
    }
    game.players[seat as usize].cash >= spec.house_cost as i64 && game.houses_available > 0
}

pub fn can_build_hotel(game: &Game, seat: u8, square: u8) -> bool {
    let spec = tile(square);
    let state = game.squares[square as usize];
    if state.owner != seat || spec.group < 3 {
        return false;
    }
    if state.mortgaged || state.hotel || state.houses != 4 {
        return false;
    }
    if !owns_full_group(game, square) || group_has_mortgage(game, square) {
        return false;
    }
    if !spec
        .members()
        .all(|i| game.squares[i].hotel || game.squares[i].houses == 4)
    {
        return false;
    }
    let cost = if spec.hotel_cost > 0 {
        spec.hotel_cost
    } else {
        spec.house_cost
    };
    game.players[seat as usize].cash >= cost as i64 && game.hotels_available > 0
}

pub fn build_house(game: &mut Game, seat: u8, square: u8) {
    let cost = tile(square).house_cost;
    pay(game, seat, cost, BANK);
    game.squares[square as usize].houses += 1;
    game.houses_available -= 1;
}

pub fn build_hotel(game: &mut Game, seat: u8, square: u8) {
    let spec = tile(square);
    let cost = if spec.hotel_cost > 0 {
        spec.hotel_cost
    } else {
        spec.house_cost
    };
    pay(game, seat, cost, BANK);
    let state = &mut game.squares[square as usize];
    state.houses = 0;
    state.hotel = true;
    game.houses_available += 4;
    game.hotels_available -= 1;
}

pub fn can_sell_building(game: &Game, square: u8) -> bool {
    let state = game.squares[square as usize];
    if state.hotel {
        return game.houses_available >= 4;
    }
    state.houses > 0
}

pub fn sell_building(game: &mut Game, seat: u8, square: u8) -> u32 {
    let spec = tile(square);
    let state = game.squares[square as usize];
    if state.hotel {
        let refund = if spec.hotel_cost > 0 {
            spec.hotel_cost
        } else {
            spec.house_cost
        } / 2;
        game.squares[square as usize].hotel = false;
        game.squares[square as usize].houses = 4;
        game.hotels_available += 1;
        game.houses_available = game.houses_available.saturating_sub(4);
        credit(game, seat, refund);
        refund
    } else if state.houses > 0 {
        let refund = spec.house_cost / 2;
        game.squares[square as usize].houses -= 1;
        game.houses_available += 1;
        credit(game, seat, refund);
        refund
    } else {
        0
    }
}

pub fn mortgage(game: &mut Game, seat: u8, square: u8) -> u32 {
    let value = tile(square).mortgage_value;
    game.squares[square as usize].mortgaged = true;
    credit(game, seat, value);
    value
}

pub fn unmortgage_cost(square: u8) -> u32 {
    let value = tile(square).mortgage_value;
    value + (value / 10)
}

pub fn unmortgage(game: &mut Game, seat: u8, square: u8) -> u32 {
    let cost = unmortgage_cost(square);
    pay(game, seat, cost, BANK);
    game.squares[square as usize].mortgaged = false;
    cost
}

pub fn end_turn_or_auction(game: &mut Game, now: i64) {
    while game.auction_queue_len > 0 {
        let square = game.auction_queue[0];
        drop_from_auction_queue(game, square);

        let spec = tile(square);
        if !spec.is_ownable() || game.squares[square as usize].owner != BANK {
            continue;
        }

        let mut bidder = game.turn + 1;
        if bidder > game.player_count {
            bidder -= game.player_count;
        }

        game.auction = AuctionState {
            active: true,
            square,
            highest_bid: 0,
            highest_bidder: BANK,
            current_bidder: bidder,
        };
        game.phase = crate::state::Phase::Auction;
        for seat in 1..=game.player_count {
            game.players[seat as usize].bidding = game.players[seat as usize].active;
        }
        game.turn_deadline = now + TURN_LIMIT_SECONDS;
        return;
    }

    begin_turn(game, now);
}

fn finalize_auction(game: &mut Game, now: i64) {
    let auction = game.auction;
    if auction.highest_bid > 0 && auction.highest_bidder != BANK {
        pay(game, auction.highest_bidder, auction.highest_bid, BANK);
        game.squares[auction.square as usize].owner = auction.highest_bidder;
    }
    game.auction = AuctionState::idle();
    for seat in 1..=game.player_count {
        game.players[seat as usize].bidding = game.players[seat as usize].active;
    }
    end_turn_or_auction(game, now);
}

pub fn advance_auction_bidder(game: &mut Game, now: i64) {
    if game.auction.highest_bidder == BANK {
        game.auction.highest_bidder = game.auction.current_bidder;
    }

    let mut guard = 0;
    loop {
        game.auction.current_bidder += 1;
        if game.auction.current_bidder > game.player_count {
            game.auction.current_bidder -= game.player_count;
        }

        if game.auction.current_bidder == game.auction.highest_bidder {
            finalize_auction(game, now);
            return;
        }

        let seat = game.auction.current_bidder as usize;
        if game.players[seat].bidding && game.players[seat].active {
            return;
        }

        guard += 1;
        if guard > game.player_count as u32 * 2 {
            finalize_auction(game, now);
            return;
        }
    }
}

pub fn place_bid(game: &mut Game, amount: u32, now: i64) {
    game.auction.highest_bid = amount;
    game.auction.highest_bidder = game.auction.current_bidder;
    advance_auction_bidder(game, now);
}

pub fn withdraw_from_auction(game: &mut Game, now: i64) {
    let seat = game.auction.current_bidder as usize;
    game.players[seat].bidding = false;
    advance_auction_bidder(game, now);
}

fn transfer_assets(game: &mut Game, from: u8, to: u8) {
    for square in 0..BOARD_SIZE {
        if game.squares[square].owner != from {
            continue;
        }
        game.squares[square].owner = to;
        if to == BANK {
            game.squares[square].mortgaged = false;
            game.squares[square].houses = 0;
            game.squares[square].hotel = false;
        }
    }

    let loser = game.players[from as usize];
    if to != BANK {
        let spare = loser.cash.max(0);
        game.players[to as usize].cash += spare;
        if loser.treasury_jail_card {
            game.players[to as usize].treasury_jail_card = true;
        }
        if loser.fortune_jail_card {
            game.players[to as usize].fortune_jail_card = true;
        }
    }

    let loser = &mut game.players[from as usize];
    loser.cash = 0;
    loser.treasury_jail_card = false;
    loser.fortune_jail_card = false;
}

pub fn eliminate(game: &mut Game, seat: u8, now: i64) {
    if !game.players[seat as usize].active {
        return;
    }

    let creditor = game.players[seat as usize].creditor;
    let creditor = if creditor != BANK && game.players[creditor as usize].active {
        creditor
    } else {
        BANK
    };

    transfer_assets(game, seat, creditor);
    game.players[seat as usize].active = false;
    game.players[seat as usize].bidding = false;

    let live: Vec<u8> = game.live_seats().collect();
    if live.len() == 1 {
        game.winner = live[0];
        game.phase = crate::state::Phase::GameOver;
        return;
    }
    if live.is_empty() {
        game.winner = BANK;
        game.phase = crate::state::Phase::GameOver;
        return;
    }

    game.auction = AuctionState::idle();
    game.trade = TradeState::idle();
    game.pending = Pending::None;

    if seat == game.turn {
        game.dice_rolled = true;
        game.double_count = 0;
        end_turn_or_auction(game, now);
    }
}

pub fn trade_is_valid(game: &Game, trade: &TradeState) -> bool {
    if !trade.active || trade.initiator == BANK || trade.recipient == BANK {
        return false;
    }
    if trade.initiator == trade.recipient {
        return false;
    }
    if game.players[trade.initiator as usize].cash < trade.initiator_cash as i64 {
        return false;
    }
    if game.players[trade.recipient as usize].cash < trade.recipient_cash as i64 {
        return false;
    }

    for square in 0..BOARD_SIZE {
        let side = trade.squares[square];
        if side == 0 {
            continue;
        }
        let state = game.squares[square];
        if state.houses > 0 || state.hotel {
            return false;
        }
        if tile(square as u8)
            .members()
            .any(|i| game.squares[i].houses > 0 || game.squares[i].hotel)
        {
            return false;
        }
        let expected = if side == 1 {
            trade.initiator
        } else {
            trade.recipient
        };
        if state.owner != expected {
            return false;
        }
    }
    true
}

pub fn apply_trade(game: &mut Game, trade: &TradeState) {
    let initiator = trade.initiator;
    let recipient = trade.recipient;

    if trade.initiator_cash > 0 {
        game.players[initiator as usize].cash -= trade.initiator_cash as i64;
        game.players[recipient as usize].cash += trade.initiator_cash as i64;
    }
    if trade.recipient_cash > 0 {
        game.players[recipient as usize].cash -= trade.recipient_cash as i64;
        game.players[initiator as usize].cash += trade.recipient_cash as i64;
    }

    for square in 0..BOARD_SIZE {
        match trade.squares[square] {
            1 => game.squares[square].owner = recipient,
            2 => game.squares[square].owner = initiator,
            _ => {}
        }
    }
}

pub fn net_worth(game: &Game, seat: u8) -> i64 {
    let mut total = game.players[seat as usize].cash;
    for square in 0..BOARD_SIZE {
        let state = game.squares[square];
        if state.owner != seat {
            continue;
        }
        let spec = tile(square as u8);
        total += if state.mortgaged {
            spec.mortgage_value as i64
        } else {
            spec.price as i64
        };
        if state.hotel {
            total += spec.hotel_cost as i64;
        } else {
            total += state.houses as i64 * spec.house_cost as i64;
        }
    }
    total
}

pub fn liquidation_value(game: &Game, seat: u8) -> i64 {
    let mut total = game.players[seat as usize].cash;
    for square in 0..BOARD_SIZE {
        let state = game.squares[square];
        if state.owner != seat {
            continue;
        }
        let spec = tile(square as u8);
        if state.hotel {
            total += (spec.hotel_cost / 2) as i64;
            total += 4 * (spec.house_cost / 2) as i64;
        } else {
            total += state.houses as i64 * (spec.house_cost / 2) as i64;
        }
        if !state.mortgaged {
            total += spec.mortgage_value as i64;
        }
    }
    total
}

pub fn is_bankrupt(game: &Game, seat: u8) -> bool {
    game.players[seat as usize].is_broke() && liquidation_value(game, seat) < 0
}

pub fn default_houses() -> u8 {
    TOTAL_HOUSES
}

pub fn default_hotels() -> u8 {
    TOTAL_HOTELS
}
