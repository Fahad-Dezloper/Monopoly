/**
 * Drives a real server-mode game in the browser and exercises the in-game
 * controls that only exist once a table is running: chat, decline-to-auction,
 * and the trade dialog.
 *
 * The room is created and seated over the REST API, then the browser is handed
 * the host's player id so it joins the same table the way a real client would.
 *
 *   node scripts/ui-game-live.mjs [uiUrl] [apiUrl]
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const UI = process.argv[2] || process.env.UI_URL || "http://localhost:4314";
const API = process.argv[3] || process.env.API_URL || UI;
const CHROME =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SHOT_DIR = process.env.SHOT_DIR || "/tmp/ui-states";

let passed = 0;
let failed = 0;
const failures = [];

function check(label, ok, detail = "") {
  if (ok) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.log(`  ✗ ${label}${detail ? `\n      ${detail}` : ""}`);
  }
}

async function api(path, init) {
  const res = await fetch(`${API}/api${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  return { ok: res.ok, status: res.status, body: await res.json() };
}

const OWNER = `ui-owner-${Date.now()}`;

// The owner creates and later starts the table over the API; the browser joins
// through the UI as its own player, which is the only way a client gets a room
// (there is no room persistence across a reload).
const created = await api("/rooms", {
  method: "POST",
  body: JSON.stringify({
    playerId: OWNER,
    name: "Owner",
    color: "red",
    maxPlayers: 4,
  }),
});
const code = created.body.room.code;
console.log(`live game ${code}\n`);

mkdirSync(SHOT_DIR, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
  defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e.message ?? e)));
page.on("console", (m) => {
  if (m.type() !== "error") return;
  const t = m.text();
  if (/favicon|net::ERR_|Failed to load resource|devnet balance/.test(t)) return;
  errors.push(t);
});

const clickText = async (needle) => {
  const h = await page.evaluateHandle((n) => {
    const b = [...document.querySelectorAll("button")].find(
      (x) => (x.textContent || "").includes(n) && !x.disabled,
    );
    return b || null;
  }, needle);
  const el = h.asElement();
  if (!el) return false;
  await el.click();
  return true;
};

await page.goto(UI, { waitUntil: "networkidle2", timeout: 30_000 });
await new Promise((r) => setTimeout(r, 900));

check("join dialog opens", await clickText("Join with a code"));
await new Promise((r) => setTimeout(r, 900));

const codeInput = await page.$('input[placeholder="ABC123"]');
check("room code field is present", codeInput !== null);
if (codeInput) {
  await codeInput.click();
  await codeInput.type(code);
}
await new Promise((r) => setTimeout(r, 400));
check("submitted the join", await clickText("Join"));
await new Promise((r) => setTimeout(r, 2500));

const inLobby = await page.evaluate(() =>
  /Open seat|Waiting for|Start game|lobby is open/i.test(document.body.innerText),
);
check("browser reaches the lobby", inLobby);
await page.screenshot({ path: join(SHOT_DIR, "29-live-lobby.png") });

// Owner starts the table; the client should poll into the game.
await api(`/rooms/${code}`, {
  method: "POST",
  body: JSON.stringify({ action: "start", playerId: OWNER }),
});
await new Promise((r) => setTimeout(r, 3000));

const onBoard = await page.evaluate(() =>
  /Roll Dice|End Turn|Waiting|turn/i.test(document.body.innerText),
);
check("browser lands in the running game", onBoard);

const ME = await page.evaluate(() => localStorage.getItem("monopoly_player_id"));
const roomNow = await api(`/rooms/${code}`);
const mySeat = roomNow.body.room.seats[ME];
const ownerSeat = roomNow.body.room.seats[OWNER];
check("both players are seated", mySeat > 0 && ownerSeat > 0);
await page.screenshot({ path: join(SHOT_DIR, "30-live-game.png") });

// ----------------------------------------------------------------- chat
const composer = await page.$('input[placeholder*="Message the table"]');
check("chat composer is present and reachable", composer !== null);

if (composer) {
  await composer.click();
  await composer.type("hello from the test");
  await page.keyboard.press("Enter");
  await new Promise((r) => setTimeout(r, 1800));

  const shown = await page.evaluate(() =>
    document.body.innerText.includes("hello from the test"),
  );
  check("the sent message appears in the feed", shown);

  const onServer = await fetch(`${API}/api/rooms/${code}`).then((r) => r.json());
  check(
    "the message reached the server",
    (onServer.room?.messages ?? []).some((m) =>
      m.text.includes("hello from the test"),
    ),
    JSON.stringify(onServer.room?.messages ?? []).slice(0, 160),
  );
  await page.screenshot({ path: join(SHOT_DIR, "31-live-chat.png") });
}

// --------------------------------------------------------------- decline
// Both seats have to be driven: the owner acts over the API, the browser by
// clicking, until the browser's seat lands somewhere it can buy.
const ownerAct = (gameAction) =>
  api(`/rooms/${code}/action`, {
    method: "POST",
    body: JSON.stringify({ playerId: OWNER, gameAction }),
  });

let sawDecline = false;
for (let i = 0; i < 40 && !sawDecline; i++) {
  const snap = (await api(`/rooms/${code}`)).body.room;
  if (!snap?.game || snap.game.phase === "game_over") break;

  if (snap.game.turn === ownerSeat) {
    if (snap.game.popup?.open) await ownerAct({ type: "POPUP_OK" });
    else if (snap.game.auction) await ownerAct({ type: "AUCTION_EXIT" });
    else await ownerAct({ type: "NEXT" });
    await new Promise((r) => setTimeout(r, 350));
    continue;
  }

  // Our seat: let the UI settle, then read what it offers.
  await new Promise((r) => setTimeout(r, 1400));
  const text = await page.evaluate(() => document.body.innerText);
  if (/send to auction|Pass —/i.test(text)) {
    sawDecline = true;
    break;
  }
  if (/Got it — continue/.test(text)) await clickText("Got it — continue");
  else if (!(await clickText("Roll Dice"))) {
    if (!(await clickText("Roll Again"))) await clickText("End Turn");
  }
  await new Promise((r) => setTimeout(r, 1400));
}

check("reached a buyable square with a decline option", sawDecline);

if (sawDecline) {
  await page.screenshot({ path: join(SHOT_DIR, "32-live-buy.png") });
  const before = await page.evaluate(() => document.body.innerText);
  await clickText("auction");
  await new Promise((r) => setTimeout(r, 1800));
  const after = await page.evaluate(() => document.body.innerText);
  const buyGone = !/send to auction|Pass —/i.test(after);
  check(
    "declining clears the buy offer",
    buyGone && before !== after,
    buyGone ? "panel text unchanged" : "the buy offer is still on screen",
  );
  await page.screenshot({ path: join(SHOT_DIR, "33-live-declined.png") });
}

// ----------------------------------------------------------------- trade
const opened = await clickText("Trade");
if (opened) {
  await new Promise((r) => setTimeout(r, 1600));
  const crashed = await page.evaluate(() =>
    /Cannot read properties of undefined|Application error/i.test(
      document.body.innerText,
    ),
  );
  const dialog = await page.evaluate(() =>
    /Deal ·/.test(document.body.innerText),
  );
  check("trade dialog opens without crashing", !crashed && dialog);
  await page.screenshot({ path: join(SHOT_DIR, "34-live-trade.png") });
} else {
  check("trade button is available", false, "no enabled Trade button found");
}

check(
  "no uncaught errors during play",
  errors.length === 0,
  errors.slice(0, 3).join(" ~ "),
);

await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
if (failed) console.log(`failing: ${failures.join(", ")}`);
process.exit(failed ? 1 : 0);
