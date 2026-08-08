"use client";

import { COLOR_HEX } from "@/components/entry/PlayerIdentityFields";
import type { HeldCard } from "@/components/game/dock/CardHand";
import { money } from "@/lib/monopoly/panelView";
import type { GameAction } from "@/lib/monopoly/engine";
import {
  currentRent,
  groupProgress,
  ownedBy,
  playerHoldings,
} from "@/lib/monopoly/stats";
import type { GameState, Player, PlayerColor } from "@/lib/monopoly/types";
import { cx } from "@/lib/ui";

interface RightRailProps {
  state: GameState;
  mySeat: number | null;
  focusSeat: number | null;
  onFocusSeat: (seat: number | null) => void;
  onSelectSquare: (index: number) => void;
  act?: (action: GameAction) => void;
}

function BoardStateCard({
  state,
  seat,
  isYou,
}: {
  state: GameState;
  seat: number | null;
  isYou: boolean;
}) {
  const player = seat != null ? state.players[seat] : null;
  const holdings = seat != null ? playerHoldings(state, seat) : null;
  const tile =
    player && player.position >= 0 ? state.squares[player.position] : null;

  if (!player || !holdings) {
    return (
      <section className="rounded-2xl border border-[#e9e2ff] bg-white p-3.5 shadow-sm">
        <div className="text-[11px] font-extrabold tracking-wider text-[#7c3aed] uppercase">
          Board state
        </div>
        <p className="mt-2 text-[12px] text-slate-400">
          Hover a player name to inspect their empire.
        </p>
      </section>
    );
  }

  const hex =
    COLOR_HEX[player.color as PlayerColor] ??
    (player.color as string) ??
    "#7c3aed";

  return (
    <section className="rounded-2xl border border-[#e9e2ff] bg-white p-3.5 shadow-sm">
      <div className="text-[11px] font-extrabold tracking-wider text-[#7c3aed] uppercase">
        Board state
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span
          className="size-2.5 rounded-full ring-2 ring-white"
          style={{ background: hex }}
          aria-hidden
        />
        <div className="min-w-0">
          <div className="truncate text-[15px] font-black text-slate-900">
            {isYou ? "You" : player.name}
          </div>
          {tile && (
            <div className="text-[11px] font-semibold text-slate-400">
              On {tile.name}
              {player.jail ? " · Jail" : ""}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1.5 border-t border-[#f0ebff] pt-2.5">
        <Row label="Cash" value={money(holdings.cash)} tone="good" />
        <Row label="Places" value={String(holdings.deeds)} />
        <Row label="Invested" value={money(holdings.invested)} />
        <Row
          label="Rent / landing"
          value={money(holdings.rentPerLanding)}
        />
        <Row
          label="Net worth"
          value={money(holdings.cash + holdings.invested)}
          bold
        />
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  tone,
  bold,
}: {
  label: string;
  value: string;
  tone?: "good";
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-[12px]">
      <span className="font-semibold text-slate-500">{label}</span>
      <span
        className={cx(
          "tabular-nums",
          bold ? "font-black text-slate-900" : "font-bold text-slate-800",
          tone === "good" && "text-emerald-600",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function RightRail({
  state,
  mySeat,
  focusSeat,
  onFocusSeat,
  onSelectSquare,
  act,
}: RightRailProps) {
  const players = state.players.filter(
    (p) => p.index > 0 && p.index <= state.playerCount && p.name,
  );

  const displaySeat = focusSeat ?? state.turn;
  const displayPlayer = state.players[displaySeat];

  const me = mySeat != null ? state.players[mySeat] : null;
  const deeds = mySeat != null ? ownedBy(state, mySeat) : [];
  const holdings = mySeat != null ? playerHoldings(state, mySeat) : null;

  const cards: HeldCard[] = [];
  if (me?.communityChestJailCard) {
    cards.push({ key: "treasury", label: "Treasury" });
  }
  if (me?.chanceJailCard) {
    cards.push({ key: "fortune", label: "Fortune" });
  }

  const canUseCard = !!me?.jail && !!act;
  const sorted = [...deeds].sort(
    (a, b) => a.groupNumber - b.groupNumber || a.index - b.index,
  );

  return (
    <aside className="flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden">
      <BoardStateCard
        state={state}
        seat={
          displayPlayer && displayPlayer.index > 0 ? displaySeat : null
        }
        isYou={mySeat != null && displaySeat === mySeat}
      />

      {/* PLAYER NAMES */}
      <section className="shrink-0 rounded-2xl border border-[#e9e2ff] bg-white p-2.5 shadow-sm">
        <div className="mb-2 text-[10px] font-extrabold tracking-wider text-[#7c3aed] uppercase">
          Players
        </div>
        <div className="flex flex-wrap gap-1.5">
          {players.map((player: Player) => {
            const hex =
              COLOR_HEX[player.color as PlayerColor] ??
              (player.color as string);
            const active = focusSeat === player.index;
            const isTurn = state.turn === player.index;
            const isYou = mySeat === player.index;
            const isOut =
              player.position < 0 || !Number.isFinite(player.money);

            return (
              <button
                key={player.index}
                type="button"
                onMouseEnter={() => onFocusSeat(player.index)}
                onMouseLeave={() => onFocusSeat(null)}
                onFocus={() => onFocusSeat(player.index)}
                onBlur={() => onFocusSeat(null)}
                className={cx(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-bold transition-all",
                  active
                    ? "border-[#7c3aed] bg-[#f0ebff] text-[#6d28d9] shadow-sm"
                    : "border-[#e9e2ff] bg-[#fdfcff] text-slate-700 hover:border-[#7c3aed]/40 hover:bg-[#f8f6ff]",
                  isOut && "opacity-40 line-through",
                )}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ background: hex }}
                  aria-hidden
                />
                {isYou ? "You" : player.name}
                {isTurn && (
                  <span className="text-[9px] font-extrabold tracking-wide text-[#7c3aed] uppercase">
                    turn
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[10px] text-slate-400">
          Hover a name to highlight their cities on the board.
        </p>
      </section>

      {/* MY PROPERTIES */}
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#e9e2ff] bg-white p-2.5 shadow-sm">
        <header className="mb-1.5 flex shrink-0 items-center gap-1.5">
          <span className="text-[10px] font-extrabold tracking-wider text-[#7c3aed] uppercase">
            My properties
          </span>
          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[#7c3aed] px-1 text-[9px] font-bold text-white">
            {deeds.length}
          </span>
          {holdings && holdings.sets > 0 && (
            <span className="ml-auto text-[9px] font-semibold text-slate-400">
              {holdings.sets} set{holdings.sets > 1 ? "s" : ""}
            </span>
          )}
        </header>

        <div className="scrollless min-h-0 flex-1 space-y-1 overflow-y-auto">
          {sorted.length === 0 && (
            <p className="rounded-xl border border-dashed border-[#e9e2ff] bg-[#f8f6ff] px-2 py-2 text-[11px] text-slate-400">
              No deeds yet.
            </p>
          )}
          {sorted.map((square) => {
            const progress = groupProgress(state, square);
            const complete =
              progress.total > 0 && progress.owned === progress.total;
            return (
              <button
                key={square.index}
                type="button"
                onClick={() => onSelectSquare(square.index)}
                className={cx(
                  "flex w-full items-center gap-2 rounded-xl border border-[#e9e2ff] bg-[#fdfcff] px-2 py-1.5 text-left hover:border-[#7c3aed]/40 hover:bg-[#f8f6ff]",
                  square.mortgage && "opacity-55",
                )}
              >
                <span
                  className="h-7 w-1.5 shrink-0 rounded-full"
                  style={{ background: square.color }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-bold text-slate-800">
                    {square.name}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600">
                    {square.mortgage
                      ? "Mortgaged"
                      : `Rent ${money(currentRent(state, square))}`}
                  </span>
                </span>
                {complete && !square.mortgage && (
                  <span className="shrink-0 rounded-md bg-[#7c3aed]/12 px-1 text-[8px] font-extrabold text-[#7c3aed] uppercase">
                    Set
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* MY CARDS */}
      <section className="shrink-0 rounded-2xl border border-[#e9e2ff] bg-white p-2.5 shadow-sm">
        <header className="mb-1.5 flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold tracking-wider text-[#7c3aed] uppercase">
            My cards
          </span>
          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[#7c3aed] px-1 text-[9px] font-bold text-white">
            {cards.length}
          </span>
        </header>
        {cards.length === 0 ? (
          <p className="text-[11px] text-slate-400">No jail cards held.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {cards.map((card) => (
              <div
                key={card.key}
                className={cx(
                  "flex items-center justify-between gap-2 rounded-xl px-2.5 py-2",
                  card.key === "treasury" ? "bg-sky-100" : "bg-purple-100",
                )}
              >
                <div>
                  <div className="text-[11px] font-extrabold text-slate-800">
                    {card.label}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Get out of jail free
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!canUseCard}
                  onClick={() => act?.({ type: "USE_JAIL_CARD" })}
                  className={cx(
                    "rounded-full px-2 py-1 text-[10px] font-bold",
                    canUseCard
                      ? "bg-slate-900 text-white"
                      : "cursor-not-allowed bg-white/70 text-slate-400",
                  )}
                >
                  {canUseCard ? "Use" : "Jail only"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}
