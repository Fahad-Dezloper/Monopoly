/**
 * End-to-end run against the REST server — the NEXT_PUBLIC_CHAIN=0 path.
 *
 * Drives a real two-player game over HTTP the way the web client does, and
 * asserts the room state that comes back.
 *
 *   node scripts/e2e-rest.mjs [baseUrl]
 */
const BASE = process.argv[2] || process.env.API_URL || "http://localhost:4000";

let passed = 0;
let failed = 0;
const failures = [];

const step = (m) => console.log(`\n▸ ${m}`);
function check(label, ok, detail = "") {
  if (ok) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

async function api(path, init) {
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  let body = {};
  try {
    body = await res.json();
  } catch {}
  return { ok: res.ok, status: res.status, body };
}

const HOST = `host-${Date.now()}`;
const GUEST = `guest-${Date.now()}`;

step("health");
{
  const r = await api("/health");
  check("server answers /api/health", r.ok, `status ${r.status}`);
}

step("create a room");
let room;
{
  const r = await api("/rooms", {
    method: "POST",
    body: JSON.stringify({
      playerId: HOST,
      name: "Host",
      color: "blue",
      maxPlayers: 4,
    }),
  });
  check("POST /rooms succeeds", r.ok, `status ${r.status}`);
  room = r.body.room;
  check("a room code comes back", typeof room?.code === "string");
  check("status is lobby", room?.status === "lobby");
  // Seats are assigned when the game starts, not in the lobby; membership is
  // what the lobby screen renders.
  check(
    "host is a member",
    room?.members?.some((m) => m.id === HOST && m.isHost),
  );
}

step("join, and reject a bad code");
{
  const r = await api(`/rooms/${room.code}`, {
    method: "POST",
    body: JSON.stringify({
      action: "join",
      playerId: GUEST,
      name: "Guest",
      color: "red",
    }),
  });
  check(
    "guest joins",
    r.ok && r.body.room?.members?.some((m) => m.id === GUEST),
  );
  room = r.body.room;

  const bad = await api("/rooms/ZZZZZZ");
  check("unknown room 404s", bad.status === 404, `status ${bad.status}`);

  const badJoin = await api("/rooms/ZZZZZZ", {
    method: "POST",
    body: JSON.stringify({
      action: "join",
      playerId: "nobody",
      name: "Nobody",
      color: "red",
    }),
  });
  check(
    "joining an unknown room fails",
    !badJoin.ok || !badJoin.body.room,
    `status ${badJoin.status}`,
  );
}

step("start the game");
{
  const r = await api(`/rooms/${room.code}`, {
    method: "POST",
    body: JSON.stringify({ action: "start", playerId: HOST }),
  });
  check("host can start", r.ok, `status ${r.status}`);
  check(
    "seats are assigned at start",
    r.body.room?.seats?.[HOST] >= 1 && r.body.room?.seats?.[GUEST] >= 1,
  );
  room = r.body.room;
  check("status flips to playing", room?.status === "playing");
  check("a game object exists", !!room?.game);
  check("40 squares", room?.game?.squares?.length === 40);
  check("two seated players", room?.game?.playerCount === 2);
  check(
    "both start on $1500",
    room.game.players[1].money === 1500 && room.game.players[2].money === 1500,
  );
  check("turn is a seated player", room.game.turn >= 1 && room.game.turn <= 2);
}

const seatOf = (id) => room.seats[id];
const idForSeat = (seat) => (seatOf(HOST) === seat ? HOST : GUEST);

async function act(playerId, gameAction) {
  const r = await api(`/rooms/${room.code}/action`, {
    method: "POST",
    body: JSON.stringify({ playerId, gameAction }),
  });
  if (r.ok && r.body.room) room = r.body.room;
  return r;
}

step("turn ownership is enforced");
{
  const offTurn = idForSeat(room.game.turn === 1 ? 2 : 1);
  const r = await act(offTurn, { type: "NEXT" });
  check(
    "a player off turn cannot roll",
    !r.ok || room.game.turn !== seatOf(offTurn),
    `status ${r.status}`,
  );
}

step("play twenty turns");
{
  let bought = false;
  let rolled = false;
  let moved = false;

  for (let i = 0; i < 20 && room.game.phase !== "game_over"; i++) {
    const seat = room.game.turn;
    const id = idForSeat(seat);
    const before = room.game.players[seat].position;

    await act(id, { type: "NEXT" });
    if (room.game.diceRolled) rolled = true;
    if (room.game.players[seat].position !== before) moved = true;

    if (room.game.popup?.open) await act(id, { type: "POPUP_OK" });

    const pos = room.game.players[seat].position;
    const square = room.game.squares[pos];
    if (
      square &&
      square.price > 0 &&
      square.owner === 0 &&
      room.game.players[seat].money >= square.price
    ) {
      const cash = room.game.players[seat].money;
      await act(id, { type: "BUY" });
      if (room.game.squares[pos].owner === seat) {
        if (!bought) {
          check("BUY transfers ownership", true);
          check("BUY debits the price", room.game.players[seat].money < cash);
        }
        bought = true;
      }
    }

    if (room.game.auction) {
      for (let g = 0; g < 8 && room.game.auction; g++) {
        await act(idForSeat(room.game.auction.currentBidder), {
          type: "AUCTION_EXIT",
        });
      }
    }

    if (room.game.popup?.open) await act(id, { type: "POPUP_OK" });
    await act(id, { type: "NEXT" });
  }

  check("dice were rolled", rolled);
  check("a token moved", moved);
  check("somebody bought a property", bought);
  check(
    "board invariants hold",
    room.game.squares.every((s) => s.owner >= 0 && s.owner <= 2) &&
      room.game.players
        .slice(1)
        .every((p) => p.position >= 0 && p.position < 40),
  );
  check("houses supply is sane", room.game.housesAvailable <= 32);
}

step("chat");
{
  const r = await api(`/rooms/${room.code}/chat`, {
    method: "POST",
    body: JSON.stringify({ playerId: HOST, text: "gg" }),
  });
  check("chat posts", r.ok, `status ${r.status}`);
  const msgs = r.body.room?.messages ?? [];
  check(
    "the message comes back",
    msgs.some((m) => m.text === "gg"),
  );
}

step("leave");
{
  const r = await api(`/rooms/${room.code}`, {
    method: "POST",
    body: JSON.stringify({ action: "leave", playerId: GUEST }),
  });
  check("leave succeeds", r.ok, `status ${r.status}`);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) console.log(`failing: ${failures.join(", ")}`);
process.exit(failed ? 1 : 0);
