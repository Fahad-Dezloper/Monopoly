"use client";

import { COLOR_HEX } from "@/components/entry/PlayerIdentityFields";
import type { HeldCard } from "@/components/game/rail/CardHand";
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
      <section className="shrink-0 rounded-2xl border border-[#e9e2ff] bg-white p-2.5 shadow-sm">
        <div className="text-[10px] font-extrabold tracking-wider text-[#7c3aed] uppercase">
          Board state
        </div>
        <p className="mt-1 text-[11px] leading-snug text-slate-400">
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
    <section className="shrink-0 rounded-2xl border border-[#e9e2ff] bg-white p-2.5 shadow-sm">
      <div className="flex items-center gap-1.5">
        <span
          className="size-2.5 shrink-0 rounded-full ring-2 ring-white"
          style={{ background: hex }}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate text-[13px] leading-tight font-black text-slate-900">
          {isYou ? "You" : player.name}
        </span>
        <span className="shrink-0 text-[9px] font-extrabold tracking-wider text-[#7c3aed] uppercase">
          Board state
        </span>
      </div>

      {tile && (
        <div className="mt-0.5 truncate text-[10px] leading-tight font-semibold text-slate-400">
          On {tile.name}
          {player.jail ? " · Jail" : ""}
        </div>
      )}

      <div className="mt-1.5 flex flex-col gap-y-px border-t border-[#f0ebff] pt-1.5">
        <Row label="Cash" value={money(holdings.cash)} tone="good" />
        <Row label="Places" value={String(holdings.deeds)} />
        <Row label="Invested" value={money(holdings.invested)} />
        <Row label="Rent / landing" value={money(holdings.rentPerLanding)} />
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
    <div className="flex items-center justify-between gap-2 text-[11px] leading-[1.45]">
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
      {/* PLAYER NAMES */}
      <section className="shrink-0 rounded-2xl border border-[#e9e2ff] bg-white p-2.5 shadow-sm">
        <div className="mb-2 text-[10px] font-extrabold tracking-wider text-[#7c3aed] uppercase">
          Players
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {players.map((player: Player) => {
            const hex =
              COLOR_HEX[player.color as PlayerColor] ??
              (player.color as string);
            const active = focusSeat === player.index;
            const isYou = mySeat === player.index;
            const isOut = player.position < 0 || !Number.isFinite(player.money);

            return (
              <button
                key={player.index}
                type="button"
                onMouseEnter={() => onFocusSeat(player.index)}
                onMouseLeave={() => onFocusSeat(null)}
                onFocus={() => onFocusSeat(player.index)}
                onBlur={() => onFocusSeat(null)}
                className={cx(
                  "inline-flex items-center w-fit gap-1.5 text-center rounded-lg border px-2.5 py-1 text-[12px] font-bold transition-all",
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
              </button>
            );
          })}
        </div>
      </section>

      <BoardStateCard
        state={state}
        seat={displayPlayer && displayPlayer.index > 0 ? displaySeat : null}
        isYou={mySeat != null && displaySeat === mySeat}
      />

      {/* MY PROPERTIES */}
      <section className="flex h-fit flex-1 flex-col overflow-hidden rounded-2xl border border-[#e9e2ff] bg-white p-2.5 shadow-sm">
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

        <div className="scrollless flex min-h-0 flex-col gap-1.5 overflow-y-auto">
          {sorted.length === 0 && (
            <p className="rounded-xl border border-dashed border-[#e9e2ff] bg-[#f8f6ff] px-2 py-2 text-[11px] text-slate-400">
              No deeds yet.
            </p>
          )}
          {sorted.map((square) => {
            const progress = groupProgress(state, square);
            const complete =
              progress.total > 0 && progress.owned === progress.total;
            const buildings =
              square.hotel === 1
                ? "Hotel"
                : square.house > 0
                  ? `${square.house} house${square.house > 1 ? "s" : ""}`
                  : null;
            const value = square.mortgage
              ? square.mortgageValue || Math.floor(square.price / 2)
              : square.price;
            return (
              <button
                key={square.index}
                type="button"
                onClick={() => onSelectSquare(square.index)}
                className={cx(
                  "flex w-full items-stretch gap-2.5 rounded-xl border bg-[#fdfcff] px-2.5 py-2 text-left transition-colors hover:border-[#7c3aed]/40 hover:bg-[#f8f6ff]",
                  complete && !square.mortgage
                    ? "border-[#7c3aed]/35"
                    : "border-[#e9e2ff]",
                  square.mortgage && "opacity-60",
                )}
              >
                <span
                  className="w-2 shrink-0 self-stretch rounded-full"
                  style={{ background: square.color }}
                  aria-hidden
                />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-[12px] font-bold text-slate-800">
                    {square.name}
                  </span>

                  <span className="flex items-center gap-1.5 text-[10px] font-semibold">
                    <span
                      className={
                        square.mortgage ? "text-amber-600" : "text-emerald-600"
                      }
                    >
                      {square.mortgage
                        ? "Mortgaged"
                        : `Rent ${money(currentRent(state, square))}`}
                    </span>
                    {buildings && !square.mortgage && (
                      <>
                        <span className="text-slate-300" aria-hidden>
                          ·
                        </span>
                        <span className="text-slate-500">{buildings}</span>
                      </>
                    )}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <span className="flex items-center gap-0.5" aria-hidden>
                      {Array.from({ length: progress.total }).map((_, i) => (
                        <span
                          key={i}
                          className={cx(
                            "h-1 w-3 rounded-full",
                            i < progress.owned
                              ? "bg-[#7c3aed]"
                              : "bg-[#e9e2ff]",
                          )}
                        />
                      ))}
                    </span>
                    <span className="text-[9px] font-bold tabular-nums text-slate-400">
                      {progress.owned}/{progress.total}
                    </span>
                    <span className="ml-auto text-[9px] font-bold tabular-nums text-slate-400">
                      {money(value)}
                    </span>
                  </span>
                </span>
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
          <div className="flex min-h-19 items-center gap-2.5 rounded-xl border border-dashed border-[#e9e2ff] bg-[#f8f6ff] px-3 py-3">
            <span
              className="grid size-9 shrink-0 place-items-center rounded-full bg-[#7c3aed]/10 text-[15px] font-extrabold text-[#7c3aed]"
              aria-hidden
            >
              ?
            </span>
            <div className="min-w-0">
              <div className="text-[12px] font-bold text-slate-600">
                No cards
              </div>
              <div className="text-[10.5px] leading-snug text-slate-400">
                Fortune and Treasury decks hand these out.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {cards.map((card) => (
              <div
                key={card.key}
                className={cx(
                  "flex min-h-19 items-center gap-2.5 rounded-xl px-3 py-2.5 shadow-sm",
                  card.key === "treasury" ? "bg-sky-100" : "bg-purple-100",
                )}
              >
                <span
                  className={cx(
                    "grid size-9 shrink-0 place-items-center rounded-full text-[17px] leading-none font-extrabold text-slate-900/80",
                    card.key === "treasury"
                      ? "bg-sky-200/80"
                      : "bg-purple-200/80",
                  )}
                  aria-hidden
                >
                  {card.key === "treasury" ? "★" : "?"}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-extrabold text-slate-800">
                    {card.label}
                  </div>
                  <div className="text-[10.5px] leading-snug font-semibold text-slate-500">
                    Get out of jail free
                  </div>
                  <button
                    type="button"
                    disabled={!canUseCard}
                    onClick={() => act?.({ type: "USE_JAIL_CARD" })}
                    title={
                      canUseCard
                        ? "Play this card now"
                        : "Only usable while in jail"
                    }
                    className={cx(
                      "mt-1.5 w-full rounded-lg py-1 text-[11px] font-bold transition-colors",
                      canUseCard
                        ? "bg-slate-900 text-white hover:bg-slate-900/85"
                        : "cursor-not-allowed bg-white/70 text-slate-400",
                    )}
                  >
                    {canUseCard ? "Use now" : "In jail only"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}
