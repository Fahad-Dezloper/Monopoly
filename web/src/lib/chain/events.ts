import { BorshCoder, EventParser } from "@coral-xyz/anchor";
import type { PublicKey } from "@solana/web3.js";

import { PROGRAM_ID } from "@/lib/chain/config";
import { decodeName } from "@/lib/chain/client";
import type { OnchainGame } from "@/lib/chain/types";
import { createStaticBoard } from "@/lib/monopoly/staticBoard";

const BOARD = createStaticBoard();

const squareName = (index: number) => BOARD[index]?.name ?? `square ${index}`;

export function alertsFromLogs(
  coder: BorshCoder,
  logs: string[],
  game: PublicKey,
  state: OnchainGame | null,
): string[] {
  const parser = new EventParser(PROGRAM_ID, coder);
  const out: string[] = [];

  const nameOf = (seat: number): string => {
    const player = state?.players[seat];
    if (!player) return `Player ${seat}`;
    return decodeName(player.name) || `Player ${seat}`;
  };

  try {
    for (const event of parser.parseLogs(logs)) {
      const data = event.data as Record<string, unknown>;
      const subject = data.game as PublicKey | undefined;
      if (subject && !subject.equals(game)) continue;

      const line = format(event.name, data, nameOf);
      if (line) out.push(line);
    }
  } catch {}

  return out;
}

function format(
  name: string,
  data: Record<string, unknown>,
  nameOf: (seat: number) => string,
): string | null {
  const seat = () => nameOf(Number(data.seat ?? 0));
  const square = () => squareName(Number(data.square ?? 0));

  switch (name) {
    case "PlayerJoined":
      return `${nameOf(Number(data.seat))} took a seat.`;

    case "GameStarted":
      return `Game on — ${nameOf(Number(data.first_turn))} goes first.`;

    case "DiceRolled": {
      const die1 = Number(data.die1);
      const die2 = Number(data.die2);
      const doubles = data.doubles ? " (doubles)" : "";
      const rent = Number(data.rent_paid ?? 0);
      const base = `${seat()} rolled ${die1} + ${die2}${doubles} and landed on ${square()}.`;
      return rent > 0
        ? `${base} Paid $${rent} rent to ${nameOf(Number(data.rent_to))}.`
        : base;
    }

    case "PendingResolved": {
      const rent = Number(data.rent_paid ?? 0);
      const tax = Number(data.tax_paid ?? 0);
      if (tax > 0) return `${seat()} paid $${tax} in tax.`;
      if (rent > 0) return `${seat()} paid $${rent} rent.`;
      return null;
    }

    case "LeftJail":
      return data.used_card
        ? `${seat()} used a Get Out of Jail Free card.`
        : `${seat()} paid $${Number(data.paid)} to leave jail.`;

    case "PropertyBought":
      return `${seat()} bought ${square()} for $${Number(data.price)}.`;

    case "Built":
      return data.hotel
        ? `${seat()} built a hotel on ${square()}.`
        : `${seat()} built a house on ${square()}.`;

    case "BuildingSold":
      return `${seat()} sold a building on ${square()} for $${Number(data.refund)}.`;

    case "Mortgaged":
      return data.lifted
        ? `${seat()} lifted the mortgage on ${square()} for $${Number(data.value)}.`
        : `${seat()} mortgaged ${square()} for $${Number(data.value)}.`;

    case "BidPlaced":
      return `${seat()} bid $${Number(data.amount)} on ${square()}.`;

    case "BidWithdrawn":
      return `${seat()} dropped out of the auction.`;

    case "TradeProposed":
      return `${nameOf(Number(data.initiator))} offered a trade to ${nameOf(Number(data.recipient))}.`;

    case "TradeResolved":
      return data.accepted
        ? `${seat()} accepted the trade.`
        : `${seat()} turned the trade down.`;

    case "PlayerEliminated": {
      const winner = Number(data.winner ?? 0);
      const reason = data.timed_out ? "ran out of time" : "is out";
      const line = `${seat()} ${reason}.`;
      return winner > 0 ? `${line} ${nameOf(winner)} wins.` : line;
    }

    default:
      return null;
  }
}
