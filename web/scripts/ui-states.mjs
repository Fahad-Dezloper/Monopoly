/**
 * Loads every UI state in a real browser and asserts what rendered.
 *
 * A React component that throws still returns HTTP 200, so status codes prove
 * nothing here. Each state is driven to completion, then checked for the text
 * it should show, for console errors, and for the error-boundary text that
 * appears when a render blew up.
 *
 *   node scripts/ui-states.mjs [baseUrl]
 *   SHOTS=1 node scripts/ui-states.mjs      # also write PNGs
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.argv[2] || process.env.UI_URL || "http://localhost:4313";
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

/** Text React/Next render in place of a component that threw. */
const CRASH_MARKERS = [
  "Application error: a client-side exception",
  "Unhandled Runtime Error",
];

/** Console noise that is expected without a funded wallet or a live server. */
const IGNORED_CONSOLE = [
  /Failed to fetch devnet balance/,
  /Download the React DevTools/,
  /favicon/i,
  /net::ERR_/,
  /Failed to load resource/,
];

const STATES = [
  ["welcome modal", "/", ["Create a lobby", "Join with a code"], "01-welcome"],

  [
    "full game surface",
    "/mock?only=topbar,board,rail,actionbar,panel,dock&panel=0",
    ["Mumbai", "Delhi", "Sochi"],
    "02-game",
  ],
  ["board", "/mock?only=board&panel=0", ["game board"], "03-board"],
  ["player rail", "/mock?only=rail&panel=0", ["Emma"], "04-rail"],
  ["property panel", "/mock?only=panel&panel=0", ["Rent"], "06-panel"],

  ["auction dialog", "/mock?only=auction&panel=0", ["uction"], "08-auction"],
  ["card dialog", "/mock?only=card&panel=0", ["ortune"], "09-card"],
  ["trade dialog", "/mock?only=trade&panel=0", ["rade"], "10-trade"],
  ["stats dialog", "/mock?only=stats&panel=0", ["tat"], "11-stats"],
  ["rules dialog", "/mock?only=rules&panel=0", ["ule"], "12-rules"],
  ["game over", "/mock?only=gameover&panel=0", ["win"], "13-gameover"],

  [
    "entry welcome",
    "/mock?screen=entry&only=welcome&panel=0",
    ["Create a lobby"],
    "14-entry-welcome",
  ],
  [
    "create room",
    "/mock?screen=entry&only=create&panel=0",
    ["DISPLAY NAME"],
    "15-entry-create",
  ],
  [
    "join room",
    "/mock?screen=entry&only=join&panel=0",
    ["ROOM CODE"],
    "16-entry-join",
  ],
  [
    "lobby",
    "/mock?screen=entry&only=lobby&panel=0",
    ["ROOM CODE"],
    "17-entry-lobby",
  ],

  ["studio controls", "/mock", ["Mock studio", "GameBoard"], "18-studio"],
];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
  defaultViewport: { width: 1440, height: 900 },
});

if (process.env.SHOTS) mkdirSync(SHOT_DIR, { recursive: true });

console.log(`UI states against ${BASE}\n`);

for (const [label, path, expected, shot] of STATES) {
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const text = m.text();
    if (IGNORED_CONSOLE.some((re) => re.test(text))) return;
    consoleErrors.push(text);
  });
  page.on("pageerror", (e) => consoleErrors.push(String(e.message ?? e)));

  try {
    await page.goto(`${BASE}${path}`, {
      waitUntil: "networkidle2",
      timeout: 30_000,
    });
    // Give React a beat past hydration for state-driven content.
    await new Promise((r) => setTimeout(r, 800));

    const body = await page.evaluate(() => document.body.innerText);
    const html = await page.content();

    if (process.env.SHOTS && shot) {
      await page.screenshot({ path: join(SHOT_DIR, `${shot}.png`) });
    }

    const crashed = CRASH_MARKERS.find((m) => html.includes(m));
    if (crashed) {
      check(label, false, `render crashed: ${crashed}`);
    } else {
      const haystack = `${body}\n${html}`;
      const missing = expected.filter((n) => !haystack.includes(n));
      const problems = [];
      if (missing.length) problems.push(`missing: ${missing.join(" | ")}`);
      if (consoleErrors.length)
        problems.push(`console: ${consoleErrors.slice(0, 2).join(" ~ ")}`);
      check(label, problems.length === 0, problems.join("\n      "));
    }
  } catch (cause) {
    check(label, false, `navigation failed: ${String(cause).slice(0, 140)}`);
  } finally {
    await page.close();
  }
}

await browser.close();

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) console.log(`failing: ${failures.join(", ")}`);
if (process.env.SHOTS) console.log(`screenshots in ${SHOT_DIR}`);
process.exit(failed ? 1 : 0);
