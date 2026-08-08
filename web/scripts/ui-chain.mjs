/**
 * Drives the real app in on-chain mode through the entry flow.
 *
 * The mock studio renders components with fabricated state; this exercises the
 * screens actually wired to `useOnchainGame`, including the devnet wallet card
 * and the funding message a player sees before they have any SOL.
 *
 *   node scripts/ui-chain.mjs [baseUrl]
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

const clickText = async (page, text) => {
  const handle = await page.evaluateHandle((needle) => {
    const nodes = [...document.querySelectorAll("button")];
    return nodes.find((n) => (n.textContent || "").includes(needle)) || null;
  }, text);
  const el = handle.asElement();
  if (!el) return false;
  await el.click();
  return true;
};

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
  if (/favicon|net::ERR_|Failed to load resource|devnet balance/.test(t))
    return;
  errors.push(t);
});

console.log(`chain-mode entry flow against ${BASE}\n`);

await page.goto(BASE, { waitUntil: "networkidle2", timeout: 30_000 });
await new Promise((r) => setTimeout(r, 800));

check(
  "landing renders in chain mode",
  (await page.evaluate(() => document.body.innerText)).includes(
    "Create a lobby",
  ),
);

check("opened the create dialog", await clickText(page, "Create a lobby"));
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: join(SHOT_DIR, "20-chain-create.png") });

const createText = await page.evaluate(() => document.body.innerText);
check("create dialog shows the name field", /DISPLAY NAME/i.test(createText));
check(
  "devnet wallet card is present",
  /Devnet Wallet/i.test(createText),
  createText.slice(0, 160).replace(/\n/g, " | "),
);

// The card polls the RPC; give it a round trip before asserting on it.
await new Promise((r) => setTimeout(r, 4500));
const walletText = await page.evaluate(() => document.body.innerText);
check(
  "wallet card resolves to an address or a clear prompt",
  /[1-9A-HJ-NP-Za-km-z]{4}\.\.\.[1-9A-HJ-NP-Za-km-z]{4}/.test(walletText) ||
    /need ≥/i.test(walletText),
  walletText.slice(0, 200).replace(/\n/g, " | "),
);
check(
  "funding state is stated either way",
  /funded|need ≥|checking sol/i.test(walletText),
);
const createDisabled = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((n) =>
    /Create lobby/i.test(n.textContent || ""),
  );
  return b ? b.disabled : null;
});
check(
  "create is blocked until the wallet is funded",
  createDisabled === true || /funded/i.test(walletText),
  `disabled=${createDisabled}`,
);
await page.screenshot({ path: join(SHOT_DIR, "21-chain-wallet.png") });

// Back out, then the join path.
await page.goto(BASE, { waitUntil: "networkidle2", timeout: 30_000 });
await new Promise((r) => setTimeout(r, 800));
check("opened the join dialog", await clickText(page, "Join with a code"));
await new Promise((r) => setTimeout(r, 1200));
const joinText = await page.evaluate(() => document.body.innerText);
check("join dialog shows the code field", /ROOM CODE/i.test(joinText));
await page.screenshot({ path: join(SHOT_DIR, "22-chain-join.png") });

check(
  "no uncaught errors in the entry flow",
  errors.length === 0,
  errors.slice(0, 3).join(" ~ "),
);

await browser.close();

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) console.log(`failing: ${failures.join(", ")}`);
process.exit(failed ? 1 : 0);
