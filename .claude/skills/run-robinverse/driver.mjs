#!/usr/bin/env node
// Robinverse run driver: boots the NestJS API + Next web build, then drives a
// real multiplayer game through Chrome DevTools Protocol. Zero npm deps —
// Node 22's global WebSocket speaks CDP directly.
//
//   node .claude/skills/run-robinverse/driver.mjs up
//   node .claude/skills/run-robinverse/driver.mjs api
//   node .claude/skills/run-robinverse/driver.mjs smoke
//   node .claude/skills/run-robinverse/driver.mjs shot http://localhost:3100/ home.png
//   node .claude/skills/run-robinverse/driver.mjs down

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_DIR = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(SKILL_DIR, "../../..");
const RUN_DIR = join(SKILL_DIR, ".run");
const SHOT_DIR = join(SKILL_DIR, "shots");

const API_PORT = Number(process.env.RV_API_PORT || 4100);
const WEB_PORT = Number(process.env.RV_WEB_PORT || 3100);
const CDP_PORT = Number(process.env.RV_CDP_PORT || 9412);
const API = `http://localhost:${API_PORT}`;
const WEB = `http://localhost:${WEB_PORT}`;

const CHROME =
  process.env.CHROME ||
  ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
   "/usr/bin/google-chrome",
   "/usr/bin/chromium"].find((p) => existsSync(p));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log("[driver]", ...a);
const die = (msg) => { console.error("[driver] FAIL:", msg); process.exit(1); };

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", env: process.env });
  if (r.status !== 0) die(`${cmd} ${args.join(" ")} exited ${r.status}`);
}

async function portOpen(port) {
  try {
    await fetch(`http://localhost:${port}`, { signal: AbortSignal.timeout(600) });
    return true;
  } catch (e) {
    return String(e).includes("terminated") || String(e).includes("timeout");
  }
}

async function waitFor(label, check, timeoutMs = 60_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await check()) return;
    await sleep(400);
  }
  die(`timed out waiting for ${label}`);
}

function startBackground(name, cmd, args, cwd, env) {
  mkdirSync(RUN_DIR, { recursive: true });
  const out = join(RUN_DIR, `${name}.log`);
  writeFileSync(out, "");
  const fd = openSync(out, "a");
  const child = spawn(cmd, args, {
    cwd,
    detached: true,
    stdio: ["ignore", fd, fd],
    env: { ...process.env, ...env },
  });
  child.unref();
  writeFileSync(join(RUN_DIR, `${name}.pid`), String(child.pid));
  return child.pid;
}

async function apiJson(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: body ? "POST" : "GET",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = {};
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, ok: res.ok, json };
}

async function cmdUp() {
  if (!existsSync(join(REPO, "server/dist/main.js"))) {
    log("server build missing — building");
    run("pnpm", ["prisma:generate"], join(REPO, "server"));
    run("pnpm", ["build"], join(REPO, "server"));
  }
  if (!existsSync(join(REPO, "web/.next/BUILD_ID"))) {
    log("web build missing — building");
    run("pnpm", ["build"], join(REPO, "web"));
  }

  if (!(await healthy())) {
    log(`starting API on ${API_PORT} (REDIS_MODE=memory)`);
    startBackground("api", process.execPath, ["dist/main.js"], join(REPO, "server"), {
      PORT: String(API_PORT),
      REDIS_MODE: "memory",
      CORS_ORIGIN: `${WEB},http://localhost:3000`,
    });
    await waitFor("api health", healthy);
  }
  log("API healthy:", (await apiJson("/api/health")).json);

  if (!(await webUp())) {
    log(`starting web on ${WEB_PORT} (proxying /api -> ${API})`);
    startBackground("web", join(REPO, "web/node_modules/.bin/next"), ["start", "-p", String(WEB_PORT)], join(REPO, "web"), {
      API_PROXY_TARGET: API,
    });
    await waitFor("web server", webUp);
  }
  log("web up:", WEB);
}

async function healthy() {
  try {
    const r = await fetch(`${API}/api/health`, { signal: AbortSignal.timeout(800) });
    return r.ok;
  } catch { return false; }
}

async function webUp() {
  try {
    const r = await fetch(WEB, { signal: AbortSignal.timeout(1500) });
    return r.ok;
  } catch { return false; }
}

function cmdDown() {
  for (const name of ["api", "web", "chrome"]) {
    const pidFile = join(RUN_DIR, `${name}.pid`);
    if (!existsSync(pidFile)) continue;
    const pid = Number(readFileSync(pidFile, "utf8").trim());
    try { process.kill(pid, "SIGTERM"); log("stopped", name, pid); } catch { log("already gone:", name); }
    rmSync(pidFile, { force: true });
  }
}

async function cmdApi() {
  const create = await apiJson("/api/rooms", {
    playerId: "driver-host", name: "Emma", color: "red", maxPlayers: 4,
  });
  if (!create.json.room) die(`create room failed: ${JSON.stringify(create.json)}`);
  const code = create.json.room.code;
  log("room", code);

  await apiJson(`/api/rooms/${code}`, {
    action: "join", playerId: "driver-p2", name: "Liam", color: "lime",
  });

  const chat = await apiJson(`/api/rooms/${code}/chat`, {
    playerId: "driver-p2", text: "driver smoke",
  });
  if (!chat.json.room?.messages?.length) die("chat endpoint returned no messages");
  log("chat ok:", chat.json.room.messages.at(-1).text);

  const outsider = await apiJson(`/api/rooms/${code}/chat`, {
    playerId: "not-a-member", text: "let me in",
  });
  if (outsider.status !== 403) die(`expected 403 for non-member chat, got ${outsider.status}`);
  log("non-member chat correctly rejected (403)");

  const start = await apiJson(`/api/rooms/${code}`, { action: "start", playerId: "driver-host" });
  const room = start.json.room;
  if (room?.status !== "playing") die(`start failed: ${JSON.stringify(start.json)}`);
  log("game started · seats", JSON.stringify(room.seats), "· turn", room.game.turn);

  const seatOf = Object.entries(room.seats);
  const currentPlayerId = seatOf.find(([, seat]) => seat === room.game.turn)?.[0];
  const wrong = seatOf.find(([, seat]) => seat !== room.game.turn)?.[0];

  const denied = await apiJson(`/api/rooms/${code}/action`, {
    playerId: wrong, gameAction: { type: "NEXT" },
  });
  if (denied.status !== 403) die(`expected 403 for out-of-turn action, got ${denied.status}`);
  log("out-of-turn action correctly rejected (403)");

  const rolled = await apiJson(`/api/rooms/${code}/action`, {
    playerId: currentPlayerId, gameAction: { type: "NEXT" },
  });
  const game = rolled.json.room.game;
  if (!game.diceRolled) die("NEXT did not roll the dice");
  log(`rolled ${game.die1}+${game.die2} · ${game.alerts.at(-1)}`);
  return code;
}

class Browser {
  constructor(pid, ws) { this.pid = pid; this.ws = ws; this.id = 0; }

  static async launch() {
    if (!CHROME) die("no Chrome binary found — set CHROME=/path/to/chrome");
    mkdirSync(RUN_DIR, { recursive: true });
    const child = spawn(CHROME, [
      `--remote-debugging-port=${CDP_PORT}`,
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-first-run",
      "--window-size=1536,1000",
      `--user-data-dir=${join(RUN_DIR, "chrome-profile")}`,
      "about:blank",
    ], { detached: true, stdio: "ignore" });
    child.unref();
    writeFileSync(join(RUN_DIR, "chrome.pid"), String(child.pid));
    await waitFor("chrome devtools", async () => {
      try { return (await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`)).ok; } catch { return false; }
    }, 20_000);
    return child.pid;
  }

  static async open(url) {
    const pid = await Browser.launch();
    const res = await fetch(
      `http://127.0.0.1:${CDP_PORT}/json/new?${encodeURIComponent(url)}`,
      { method: "PUT" },
    );
    const target = await res.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    const browser = new Browser(pid, ws);
    browser.errors = [];
    ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === "Runtime.exceptionThrown") {
        browser.errors.push(String(msg.params.exceptionDetails?.exception?.description ?? "").slice(0, 200));
      }
    });
    await browser.send("Page.enable");
    await browser.send("Runtime.enable");
    return browser;
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const onMessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id !== id) return;
        this.ws.removeEventListener("message", onMessage);
        if (msg.error) reject(new Error(`${method}: ${msg.error.message}`));
        else resolve(msg.result);
      };
      this.ws.addEventListener("message", onMessage);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const r = await this.send("Runtime.evaluate", {
      expression, awaitPromise: true, returnByValue: true,
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result?.value;
  }

  async waitForSelector(selector, timeoutMs = 15_000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (await this.eval(`!!document.querySelector(${JSON.stringify(selector)})`)) return true;
      await sleep(250);
    }
    throw new Error(`selector not found: ${selector}`);
  }

  clickText(pattern, selector = "button") {
    return this.eval(`
      (() => {
        const el = [...document.querySelectorAll(${JSON.stringify(selector)})]
          .find((n) => new RegExp(${JSON.stringify(pattern)}, "i").test(n.textContent));
        if (!el) return "NOT_FOUND";
        el.click();
        return "clicked";
      })()`);
  }

  fill(selector, value) {
    return this.eval(`
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return "NOT_FOUND";
        const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value").set;
        setter.call(el, ${JSON.stringify(value)});
        el.dispatchEvent(new Event("input", { bubbles: true }));
        return "filled";
      })()`);
  }

  async shot(name) {
    mkdirSync(SHOT_DIR, { recursive: true });
    const { data } = await this.send("Page.captureScreenshot", { format: "png" });
    const file = join(SHOT_DIR, name);
    writeFileSync(file, Buffer.from(data, "base64"));
    log("screenshot", file);
    return file;
  }

  close() {
    try { this.ws.close(); } catch { /* socket already gone */ }
    try { process.kill(this.pid, "SIGTERM"); } catch { /* chrome already gone */ }
    rmSync(join(RUN_DIR, "chrome.pid"), { force: true });
  }
}

async function cmdShot(url, name = "page.png") {
  const browser = await Browser.open(url);
  await sleep(3000);
  await browser.shot(name);
  browser.close();
}

async function cmdSmoke() {
  const host = "driver-host";
  const create = await apiJson("/api/rooms", {
    playerId: host, name: "Emma", color: "red", maxPlayers: 4,
  });
  const code = create.json.room?.code;
  if (!code) die(`could not create room: ${JSON.stringify(create.json)}`);
  await apiJson(`/api/rooms/${code}`, { action: "join", playerId: "driver-p2", name: "Liam", color: "lime" });
  await apiJson(`/api/rooms/${code}/chat`, { playerId: "driver-p2", text: "ready when you are" });
  log("seeded room", code, "with 2 players");

  const browser = await Browser.open(`${WEB}/?join=${code}`);
  const checks = [];
  const check = (label, actual, expect) => {
    const pass = typeof expect === "function" ? expect(actual) : actual === expect;
    checks.push({ label, actual, pass });
    log(pass ? "PASS" : "FAIL", `${label}:`, JSON.stringify(actual));
  };

  await browser.waitForSelector(".rv-home");
  await browser.shot("01-home.png");
  check("join tab preselected from ?join=", await browser.eval(`document.querySelector(".rv-seg-btn.is-active")?.textContent`), (v) => /join/i.test(v));
  check("hero art loaded", await browser.eval(`(() => { const i = document.querySelector(".rv-hero-art img"); return !!i && i.naturalWidth > 0; })()`), true);

  await browser.eval(`document.querySelector(".rv-play")?.scrollIntoView()`);
  await sleep(500);
  await browser.fill(".rv-panel input", "Olivia");
  await browser.fill(".rv-input-code", code);
  await browser.clickText("join room");

  await browser.waitForSelector(".rv-seat-list");
  await browser.shot("02-lobby.png");
  check("lobby seats", await browser.eval(`document.querySelectorAll(".rv-seat-list .rv-player").length`), (n) => n >= 3);
  check("lobby shows seeded chat", await browser.eval(`document.querySelector(".rv-chat-text")?.textContent`), "ready when you are");

  await browser.eval(`
    (() => {
      const input = document.querySelector(".rv-lobby-chat input");
      const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value").set;
      setter.call(input, "hi from the driver");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.closest("form").requestSubmit();
    })()`);
  await sleep(1500);
  check("chat round-trips to server", await browser.eval(`[...document.querySelectorAll(".rv-chat-text")].map((n) => n.textContent).join("|")`), (v) => v.includes("hi from the driver"));

  await apiJson(`/api/rooms/${code}`, { action: "start", playerId: host });
  await browser.waitForSelector(".rv-actionbar");
  await sleep(2500);
  await browser.shot("03-game.png");
  check("board tiles rendered", await browser.eval(`document.querySelectorAll(".tile").length`), 40);
  check("player rail cards", await browser.eval(`document.querySelectorAll(".rv-players .rv-player").length`), 3);
  check("turn clock ticking", await browser.eval(`document.querySelector(".rv-capsule-value")?.textContent`), (v) => /^\d:\d\d$/.test(v ?? ""));

  const mine = await browser.eval(`/your turn/i.test(document.querySelector(".rv-turn-banner")?.textContent ?? "")`);
  if (mine) {
    await browser.clickText("roll dice");
    await sleep(3200);
    await browser.shot("04-rolled.png");
    check("log recorded the roll", await browser.eval(`[...document.querySelectorAll(".rv-log-text")].map((n) => n.textContent).join("|")`), (v) => /rolled/i.test(v));
  } else {
    const seats = (await apiJson(`/api/rooms/${code}`)).json.room;
    const turnId = Object.entries(seats.seats).find(([, seat]) => seat === seats.game.turn)?.[0];
    await apiJson(`/api/rooms/${code}/action`, { playerId: turnId, gameAction: { type: "NEXT" } });
    await sleep(2500);
    await browser.shot("04-rolled.png");
    check("log picked up the other player's roll", await browser.eval(`[...document.querySelectorAll(".rv-log-text")].map((n) => n.textContent).join("|")`), (v) => /rolled/i.test(v));
  }

  await browser.eval(`document.querySelectorAll(".tile-clickable")[3]?.click()`);
  await sleep(800);
  check("property panel opens on tile click", await browser.eval(`document.querySelectorAll(".rv-rent-row").length`), (n) => n > 0);

  await browser.clickText("chat", ".rv-tab");
  await sleep(600);
  await browser.shot("05-game-chat.png");
  check("in-game chat carries lobby history", await browser.eval(`document.querySelectorAll(".rv-chat-text").length`), (n) => n >= 2);

  check("no uncaught page exceptions", browser.errors, (e) => e.length === 0);
  browser.close();

  const failed = checks.filter((c) => !c.pass);
  log(`${checks.length - failed.length}/${checks.length} checks passed`);
  if (failed.length) die(`${failed.length} check(s) failed: ${failed.map((f) => f.label).join(", ")}`);
  log("smoke OK · screenshots in", SHOT_DIR);
}

const [command, ...rest] = process.argv.slice(2);
switch (command) {
  case "up": await cmdUp(); break;
  case "down": cmdDown(); break;
  case "api": await cmdUp(); await cmdApi(); break;
  case "smoke": await cmdUp(); await cmdSmoke(); break;
  case "shot": await cmdUp(); await cmdShot(rest[0] ?? WEB, rest[1] ?? "page.png"); break;
  default:
    console.log("usage: driver.mjs up|down|api|smoke|shot <url> [out.png]");
    process.exit(1);
}
