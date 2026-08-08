export interface TileRect {
  index: number;
  left: number;
  top: number;
  width: number;
  height: number;
  side: "corner" | "top" | "right" | "bottom" | "left";
}

export interface SideSpec {
  start: number;
  tile: number;
  depth: number;
}

export interface BoardSpec {
  top: SideSpec;
  right: SideSpec;
  bottom: SideSpec;
  left: SideSpec;
}

export const BOARD_IMAGE = "/board/board.svg";

export const SIDE_SPEC: SideSpec = { start: 13.8, tile: 8.0444, depth: 13.8 };

export const DEFAULT_BOARD_SPEC: BoardSpec = {
  top: { ...SIDE_SPEC },
  right: { ...SIDE_SPEC },
  bottom: { ...SIDE_SPEC },
  left: { ...SIDE_SPEC },
};

export const BOARD_SPEC_KEY = "rv_board_spec_v2";

export const SIDE_KEYS: (keyof BoardSpec)[] = [
  "top",
  "right",
  "bottom",
  "left",
];

export function tileRects(spec: BoardSpec = DEFAULT_BOARD_SPEC): TileRect[] {
  const { top, right, bottom, left } = spec;
  const rects: TileRect[] = [];

  const topEnd = top.start + top.tile * 9;
  const bottomEnd = bottom.start + bottom.tile * 9;
  const leftEnd = left.start + left.tile * 9;
  const rightEnd = right.start + right.tile * 9;

  const push = (
    index: number,
    l: number,
    t: number,
    w: number,
    h: number,
    side: TileRect["side"],
  ) => rects.push({ index, left: l, top: t, width: w, height: h, side });

  push(20, 0, 0, top.start, left.start, "corner");
  push(30, topEnd, 0, 100 - topEnd, right.start, "corner");
  push(10, 0, leftEnd, bottom.start, 100 - leftEnd, "corner");
  push(0, bottomEnd, rightEnd, 100 - bottomEnd, 100 - rightEnd, "corner");

  for (let step = 1; step <= 9; step += 1) {
    push(
      20 + step,
      top.start + (step - 1) * top.tile,
      0,
      top.tile,
      top.depth,
      "top",
    );
    push(
      30 + step,
      100 - right.depth,
      right.start + (step - 1) * right.tile,
      right.depth,
      right.tile,
      "right",
    );
    push(
      step,
      bottom.start + (9 - step) * bottom.tile,
      100 - bottom.depth,
      bottom.tile,
      bottom.depth,
      "bottom",
    );
    push(
      10 + step,
      0,
      left.start + (9 - step) * left.tile,
      left.depth,
      left.tile,
      "left",
    );
  }

  return rects.sort((a, b) => a.index - b.index);
}

export function centerRect(spec: BoardSpec = DEFAULT_BOARD_SPEC) {
  return {
    left: spec.left.depth,
    top: spec.top.depth,
    width: 100 - spec.left.depth - spec.right.depth,
    height: 100 - spec.top.depth - spec.bottom.depth,
  };
}

export function loadBoardSpec(): BoardSpec {
  if (typeof window === "undefined") return DEFAULT_BOARD_SPEC;
  try {
    const raw = window.localStorage.getItem(BOARD_SPEC_KEY);
    if (!raw) return DEFAULT_BOARD_SPEC;
    const parsed = JSON.parse(raw) as Partial<BoardSpec>;
    return {
      top: { ...DEFAULT_BOARD_SPEC.top, ...parsed.top },
      right: { ...DEFAULT_BOARD_SPEC.right, ...parsed.right },
      bottom: { ...DEFAULT_BOARD_SPEC.bottom, ...parsed.bottom },
      left: { ...DEFAULT_BOARD_SPEC.left, ...parsed.left },
    };
  } catch {
    return DEFAULT_BOARD_SPEC;
  }
}

export function saveBoardSpec(spec: BoardSpec) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BOARD_SPEC_KEY, JSON.stringify(spec));
}

export function shiftBoardSpec(
  spec: BoardSpec,
  dx: number,
  dy: number,
): BoardSpec {
  return {
    top: { ...spec.top, start: Number((spec.top.start + dx).toFixed(3)) },
    bottom: {
      ...spec.bottom,
      start: Number((spec.bottom.start + dx).toFixed(3)),
    },
    left: { ...spec.left, start: Number((spec.left.start + dy).toFixed(3)) },
    right: { ...spec.right, start: Number((spec.right.start + dy).toFixed(3)) },
  };
}
