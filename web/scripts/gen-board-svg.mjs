import { readFileSync, writeFileSync } from "node:fs";

const DATA = new URL("../src/lib/monopoly/boardData.json", import.meta.url);
const OUT = new URL("../public/board/board.svg", import.meta.url);

const data = JSON.parse(readFileSync(DATA, "utf8"));

const PAPER = "#F4F0E4";
const INK = "#141414";
const FELT = "#23262B";
const MUTED = "#141414";
const RED = "#C4232B";

const GROUP_COLORS = {
  india: "#8B4513",
  china: "#87CEEB",
  brazil: "#FF0080",
  russia: "#FFA500",
  germany: "#FF0000",
  australia: "#FFFF00",
  uk: "#008000",
  usa: "#0000FF",
};

const SIZE = 1000;
const CORNER = 138;
const TILE = (SIZE - CORNER * 2) / 9;
const BAND = 26;
const FRAME = 7;

const SPEC = {
  start: +((CORNER / SIZE) * 100).toFixed(4),
  tile: +((TILE / SIZE) * 100).toFixed(4),
  depth: +((CORNER / SIZE) * 100).toFixed(4),
};

const ICONS = {
  bolt: "M13.6 1 L4 13.6 h6 L8.4 23 L20 10.2 h-6.6 z",
  drop: "M12 2 C7 8.5 4.5 12.6 4.5 15.9 A7.5 7.5 0 0 0 19.5 15.9 C19.5 12.6 17 8.5 12 2 z",
  train:
    "M5 2 h14 a3 3 0 0 1 3 3 v9 a3 3 0 0 1 -3 3 h-14 a3 3 0 0 1 -3 -3 v-9 a3 3 0 0 1 3 -3 z " +
    "M6.6 5.6 h10.8 v5 h-10.8 z " +
    "M5.2 18.6 a2 2 0 1 0 0.01 0 z M18.8 18.6 a2 2 0 1 0 0.01 0 z",
  plane:
    "M12 1 c1.2 0 2.1 1 2.1 2.2 v5.6 l8.4 4.9 v2.6 l-8.4 -2.7 v4.8 l3 2.1 v1.9 " +
    "l-5.1 -1.5 l-5.1 1.5 v-1.9 l3 -2.1 v-4.8 l-8.4 2.7 v-2.6 l8.4 -4.9 v-5.6 " +
    "c0 -1.2 .9 -2.2 2.1 -2.2 z",
  anchor:
    "M12 2 a2.6 2.6 0 0 0 -1.1 4.95 V8.6 H8.4 v2.1 h2.5 v8.1 a6.9 6.9 0 0 1 -5.2 -5.6 h2 " +
    "L4.4 9.5 L1.5 13.2 h1.9 A9 9 0 0 0 12 21.9 A9 9 0 0 0 20.6 13.2 h1.9 L19.6 9.5 " +
    "l-2.9 3.7 h2 a6.9 6.9 0 0 1 -5.2 5.6 v-8.1 h2.5 V8.6 h-2.5 V6.95 A2.6 2.6 0 0 0 12 2 z " +
    "m0 1.9 a.75 .75 0 1 1 0 1.5 a.75 .75 0 0 1 0 -1.5 z",
  chest:
    "M12 3.4 A8.6 8.6 0 0 0 3.4 12 v1.2 h17.2 V12 A8.6 8.6 0 0 0 12 3.4 z " +
    "M3 13.8 h18 v7.2 h-18 z M10.9 11.6 h2.2 v5.6 h-2.2 z",
  car:
    "M4.6 12.2 l1.7 -4.5 A2.6 2.6 0 0 1 8.8 6 h6.4 a2.6 2.6 0 0 1 2.5 1.7 l1.7 4.5 h1.1 " +
    "a1 1 0 0 1 1 1 v3.4 a1 1 0 0 1 -1 1 h-1.2 a2.3 2.3 0 0 1 -4.6 0 H8.3 a2.3 2.3 0 0 1 -4.6 0 " +
    "H2.5 a1 1 0 0 1 -1 -1 v-3.4 a1 1 0 0 1 1 -1 z M8 8.2 l-1.2 3.4 h10.4 L16 8.2 z",
  arrow: "M1 9 h13 V3.5 l9 8.5 l-9 8.5 V15 H1 z",
};

function transportIcon(name) {
  if (/sky|air|port$|flight/i.test(name)) return "plane";
  if (/harbor|harbour|dock|marine|port/i.test(name)) return "anchor";
  return "train";
}

function utilityIcon(name) {
  return /solar|electric|power|grid|energy/i.test(name) ? "bolt" : "drop";
}

function icon(name, cx, cy, box, fill = INK) {
  const s = box / 24;
  const d = ICONS[name];
  return `<path d="${d}" fill="${fill}" fill-rule="evenodd" transform="translate(${r(cx - box / 2)} ${r(cy - box / 2)}) scale(${r(s, 4)})"/>`;
}

const r = (n, digits = 2) => Number(n.toFixed(digits));
const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const widthOf = (text, size) => text.length * size * 0.7;

function fitLines(text, maxWidth, startSize, maxLines, minSize = 7) {
  for (let size = startSize; size >= minSize; size -= 0.5) {
    const words = text.toUpperCase().split(/\s+/);
    const lines = [];
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && widthOf(candidate, size) > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    const fits =
      lines.length <= maxLines &&
      lines.every((l) => widthOf(l, size) <= maxWidth);
    if (fits) return { lines, size };
  }
  return { lines: [text.toUpperCase()], size: minSize };
}

function textBlock(lines, cx, baseline, size, opts = {}) {
  const { weight = 700, fill = INK, letter = 0.3 } = opts;
  const lead = size * 1.08;
  return lines
    .map(
      (line, i) =>
        `<text x="${r(cx)}" y="${r(baseline + i * lead)}" font-size="${r(size)}" font-weight="${weight}" ` +
        `letter-spacing="${letter}" fill="${fill}" text-anchor="middle">${esc(line)}</text>`,
    )
    .join("");
}

function tileGeometry(index) {
  if (index === 20) return { x: 0, y: 0, w: CORNER, h: CORNER, side: "corner" };
  if (index === 30)
    return { x: SIZE - CORNER, y: 0, w: CORNER, h: CORNER, side: "corner" };
  if (index === 10)
    return { x: 0, y: SIZE - CORNER, w: CORNER, h: CORNER, side: "corner" };
  if (index === 0)
    return {
      x: SIZE - CORNER,
      y: SIZE - CORNER,
      w: CORNER,
      h: CORNER,
      side: "corner",
    };

  if (index > 20 && index < 30)
    return {
      x: CORNER + (index - 21) * TILE,
      y: 0,
      w: TILE,
      h: CORNER,
      side: "top",
    };
  if (index > 30)
    return {
      x: SIZE - CORNER,
      y: CORNER + (index - 31) * TILE,
      w: CORNER,
      h: TILE,
      side: "right",
    };
  if (index > 0 && index < 10)
    return {
      x: CORNER + (9 - index) * TILE,
      y: SIZE - CORNER,
      w: TILE,
      h: CORNER,
      side: "bottom",
    };
  return {
    x: 0,
    y: CORNER + (19 - index) * TILE,
    w: CORNER,
    h: TILE,
    side: "left",
  };
}

function bandRect(g) {
  switch (g.side) {
    case "top":
      return { x: g.x, y: g.y + g.h - BAND, w: g.w, h: BAND };
    case "bottom":
      return { x: g.x, y: g.y, w: g.w, h: BAND };
    case "left":
      return { x: g.x + g.w - BAND, y: g.y, w: BAND, h: g.h };
    default:
      return { x: g.x, y: g.y, w: BAND, h: g.h };
  }
}

function insetForFrame(rect, sides) {
  const out = { ...rect };
  if (sides.includes("top")) {
    out.y += FRAME;
    out.h -= FRAME;
  }
  if (sides.includes("bottom")) out.h -= FRAME;
  if (sides.includes("left")) {
    out.x += FRAME;
    out.w -= FRAME;
  }
  if (sides.includes("right")) out.w -= FRAME;
  return out;
}

function faceRect(g, hasBand) {
  const base = hasBand
    ? {
        top: { x: g.x, y: g.y, w: g.w, h: g.h - BAND },
        bottom: { x: g.x, y: g.y + BAND, w: g.w, h: g.h - BAND },
        left: { x: g.x, y: g.y, w: g.w - BAND, h: g.h },
        right: { x: g.x + BAND, y: g.y, w: g.w - BAND, h: g.h },
      }[g.side]
    : { x: g.x, y: g.y, w: g.w, h: g.h };
  return insetForFrame(base, [g.side]);
}

function priceLabel(tile) {
  if (tile.type === "tax") return `PAY $${tile.amount}`;
  if (typeof tile.price === "number") return `$${tile.price}`;
  return null;
}

function glyphFor(tile) {
  if (tile.type === "transport") return transportIcon(tile.name);
  if (tile.type === "utility") return utilityIcon(tile.name);
  if (tile.type === "treasury") return "chest";
  return null;
}

function edgeTile(tile) {
  const g = tileGeometry(tile.id);
  const color = GROUP_COLORS[tile.group];
  const band = color ? bandRect(g) : null;
  const face = faceRect(g, !!color);

  const out = [
    `<rect x="${r(g.x)}" y="${r(g.y)}" width="${r(g.w)}" height="${r(g.h)}" fill="${PAPER}" stroke="${INK}" stroke-width="1.6"/>`,
  ];
  if (band) {
    out.push(
      `<rect x="${r(band.x)}" y="${r(band.y)}" width="${r(band.w)}" height="${r(band.h)}" fill="${color}" stroke="${INK}" stroke-width="1.6"/>`,
    );
  }

  const cx = face.x + face.w / 2;
  const wide = g.side === "left" || g.side === "right";
  const pad = 6;
  const inner = face.w - pad * 2;

  out.push(
    `<text x="${r(cx)}" y="${r(face.y + 14)}" font-size="9.5" font-weight="700" ` +
      `fill="${MUTED}" fill-opacity="0.5" text-anchor="middle">${tile.id}</text>`,
  );

  const name = fitLines(tile.name, inner, wide ? 13 : 12, wide ? 2 : 3);
  const nameTop = face.y + (wide ? 18 : 22);
  out.push(textBlock(name.lines, cx, nameTop + name.size, name.size));

  const price = priceLabel(tile);
  const priceSize = 10.5;
  let slotBottom = face.y + face.h - pad;

  if (price) {
    const fit = fitLines(price, inner, priceSize, 1);
    out.push(
      textBlock(fit.lines, cx, slotBottom - 2, fit.size, { weight: 800 }),
    );
    slotBottom -= fit.size + 5;
  }

  const slotTop = nameTop + name.lines.length * name.size * 1.08 + 3;
  const slot = slotBottom - slotTop;
  const slotMid = slotTop + slot / 2;
  const glyph = glyphFor(tile);

  if (glyph && slot >= 12) {
    out.push(icon(glyph, cx, slotMid, Math.min(30, slot, inner)));
  } else if (tile.type === "fortune" && slot >= 12) {
    const size = Math.min(32, slot * 1.2);
    out.push(
      `<text x="${r(cx)}" y="${r(slotMid + size * 0.36)}" font-size="${r(size)}" ` +
        `font-weight="800" fill="${RED}" text-anchor="middle">?</text>`,
    );
  }

  return out.join("");
}

const CORNER_SIDES = {
  0: ["bottom", "right"],
  10: ["bottom", "left"],
  20: ["top", "left"],
  30: ["top", "right"],
};

function cornerTile(id, title) {
  const rect = tileGeometry(id);
  const g = insetForFrame(rect, CORNER_SIDES[id]);
  const cx = g.x + g.w / 2;
  const out = [
    `<rect x="${r(rect.x)}" y="${r(rect.y)}" width="${r(rect.w)}" height="${r(rect.h)}" fill="${PAPER}" stroke="${INK}" stroke-width="1.6"/>`,
    `<text x="${r(cx)}" y="${r(g.y + 15)}" font-size="9.5" font-weight="700" fill="${MUTED}" fill-opacity="0.5" text-anchor="middle">${id}</text>`,
  ];

  if (id === 0) {
    out.push(
      textBlock(["COLLECT $200"], cx, g.y + 34, 9.5, { weight: 700 }),
      textBlock(["SALARY AS YOU PASS"], cx, g.y + 45, 7.5, { weight: 600 }),
      `<text x="${r(cx)}" y="${r(g.y + 92)}" font-size="42" font-weight="800" fill="${RED}" text-anchor="middle">GO</text>`,
      `<g transform="translate(${r(cx)} ${r(g.y + g.h - 18)}) scale(-1 1)">${icon("arrow", 0, 0, 28, RED)}</g>`,
    );
    return out.join("");
  }

  if (id === 10) {
    const box = 60;
    const bx = cx - box / 2 + 5;
    const by = g.y + (g.h - box) / 2 + 4;
    out.push(
      textBlock(["JUST"], g.x + 26, g.y + 30, 9, { weight: 700 }),
      textBlock(["VISITING"], g.x + g.w - 30, g.y + g.h - 6, 9, {
        weight: 700,
      }),
      textBlock(["JAIL"], bx + box / 2, by - 7, 13, { weight: 800 }),
      `<rect x="${r(bx)}" y="${r(by)}" width="${box}" height="${box}" fill="#E8942F" stroke="${INK}" stroke-width="1.8" rx="3"/>`,
    );
    for (let i = 1; i < 5; i += 1) {
      const lx = bx + (box / 5) * i;
      out.push(
        `<line x1="${r(lx)}" y1="${r(by + 5)}" x2="${r(lx)}" y2="${r(by + box - 5)}" stroke="${INK}" stroke-width="3"/>`,
      );
    }
    return out.join("");
  }

  const lines = title.split("|");
  out.push(textBlock(lines, cx, g.y + 42, 13, { weight: 800 }));

  const artY = g.y + g.h - 34;
  if (id === 20) out.push(icon("car", cx, artY, 44));
  if (id === 30) {
    out.push(
      `<g transform="translate(${r(cx)} ${r(artY)}) rotate(135)">${icon("arrow", 0, 0, 40)}</g>`,
    );
  }
  return out.join("");
}

const byId = new Map(data.board.map((tile) => [tile.id, tile]));
const parts = [];

parts.push(
  `<rect x="0" y="0" width="${SIZE}" height="${SIZE}" fill="${INK}"/>`,
  `<rect x="${CORNER}" y="${CORNER}" width="${r(SIZE - CORNER * 2)}" height="${r(SIZE - CORNER * 2)}" fill="${FELT}"/>`,
);

for (const tile of data.board) {
  parts.push(tile.id % 10 === 0 ? "" : edgeTile(tile));
}

parts.push(
  cornerTile(0, byId.get(0)?.name ?? "GO"),
  cornerTile(10, "JAIL"),
  cornerTile(20, "FREE|PARKING"),
  cornerTile(30, "GO TO|JAIL"),
  `<rect x="${FRAME / 2}" y="${FRAME / 2}" width="${SIZE - FRAME}" height="${SIZE - FRAME}" fill="none" stroke="${INK}" stroke-width="${FRAME}"/>`,
);

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" ` +
  `font-family="'Helvetica Neue',Helvetica,Arial,sans-serif" shape-rendering="geometricPrecision">` +
  `<title>RobinVerse board</title>` +
  parts.join("") +
  `</svg>\n`;

writeFileSync(OUT, svg);

console.log(`wrote ${OUT.pathname} (${svg.length} bytes)`);
console.log(
  `DEFAULT_BOARD_SPEC side = { start: ${SPEC.start}, tile: ${SPEC.tile}, depth: ${SPEC.depth} }`,
);
