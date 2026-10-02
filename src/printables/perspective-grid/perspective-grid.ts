// Perspective drawing grids: the kinds of perspective, the hand-picked layouts of
// each that get a page, and the geometry that turns a layout into strokes.
//
// This module holds numbers only — no markup. Every stroke is resolved here at
// build time, in millimetres on an A4 landscape sheet, and the component maps them
// to SVG elements. A stroke may run far off the sheet (a ray to a vanishing point
// beyond the edge, an arc of a huge circle); the component clips them to the frame,
// so nothing here has to work out where a line meets the border.

export const PAGE_WIDTH_MM = 297;
export const PAGE_HEIGHT_MM = 210;

/** Blank border around the frame, wide enough to clear any printer's dead margin. */
export const PAGE_MARGIN_MM = 12;

/** Distance between neighbouring rays, measured where they are spaced evenly. */
const RAY_STEP_MM = 8;

/** Distance between the plain verticals of a two-point grid. */
const VERTICAL_STEP_MM = 10;

/** Far enough that a ray from any vanishing point leaves the sheet. */
const FAR_MM = 5000;

export interface Point {
  x: number;
  y: number;
}

/**
 * How heavily a stroke prints. `major` is the horizon, the frame and the lines
 * through the vanishing points; `ray` is the grid you draw along; `minor` is the
 * fainter grid behind it, there to measure against rather than to follow.
 */
export type Tone = "major" | "ray" | "minor";

export interface LineStroke {
  kind: "line";
  from: Point;
  to: Point;
  tone: Tone;
}

/** A circular arc from `from` to `to`, in the terms of an SVG `A` command. */
export interface ArcStroke {
  kind: "arc";
  from: Point;
  to: Point;
  radius: number;
  large: boolean;
  /** True when the arc runs in the direction of increasing angle (clockwise on screen). */
  sweep: boolean;
  tone: Tone;
}

export type Stroke = LineStroke | ArcStroke;

export interface Drawing {
  strokes: Stroke[];
  /** Vanishing points that land inside the frame, to be marked with a ring. */
  vanishingPoints: Point[];
  /** A circle drawn as part of the grid — the edge of the five-point fisheye. */
  circle?: { centre: Point; radius: number };
}

/**
 * Where the vanishing points sit, as fractions of the frame: `0` is the left or top
 * edge, `1` the right or bottom one. Values outside 0–1 put a point off the sheet.
 */
export type Layout =
  | { kind: "one-point"; vanishing: Point }
  | { kind: "two-point"; horizon: number; left: number; right: number }
  | {
      kind: "three-point";
      horizon: number;
      left: number;
      right: number;
      /** Height of the third, vertical vanishing point, centred across the sheet. */
      third: number;
    }
  | {
      kind: "four-point";
      /** Distance from the centre to the side points, as a fraction of half the width. */
      spanX: number;
      /** Distance from the centre to the top and bottom points, as a fraction of half the height. */
      spanY: number;
    }
  | { kind: "five-point" };

/** One hand-picked layout of a perspective — a page of its own. */
export interface Variant {
  slug: string;
  name: string;
  description: string;
  layout: Layout;
}

/** A kind of perspective, and the layouts of it worth printing. */
export interface Perspective {
  slug: string;
  name: string;
  description: string;
  variants: Variant[];
}

/**
 * Every perspective and layout that gets a page. Each one is a real, precached
 * page, so the list is short: one, two and three-point get the three layouts a
 * drawing actually reaches for, and the curvilinear four and five-point grids —
 * fisheye views, rarer in practice — get what distinguishes them and no more.
 */
export const PERSPECTIVES: Perspective[] = [
  {
    slug: "one-point",
    name: "One-point",
    description:
      "Everything that recedes runs to a single vanishing point on the horizon: a road, a corridor, a room seen straight on.",
    variants: [
      {
        slug: "centre",
        name: "Centre",
        description:
          "The vanishing point in the middle of the sheet, for a room or a corridor looked at head-on.",
        layout: { kind: "one-point", vanishing: { x: 0.5, y: 0.5 } },
      },
      {
        slug: "low-horizon",
        name: "Low horizon",
        description:
          "A low eye level, so most of the sheet is sky and walls — a street or a landscape seen from the ground.",
        layout: { kind: "one-point", vanishing: { x: 0.5, y: 0.7 } },
      },
      {
        slug: "off-centre",
        name: "Off-centre",
        description:
          "The vanishing point pushed to one side, which shows one wall far more than the other.",
        layout: { kind: "one-point", vanishing: { x: 0.3, y: 0.42 } },
      },
    ],
  },
  {
    slug: "two-point",
    name: "Two-point",
    description:
      "A box seen corner-on: its sides run to two vanishing points on the horizon, and its uprights stay upright.",
    variants: [
      {
        slug: "eye-level",
        name: "Eye level",
        description:
          "The horizon across the middle with a vanishing point at each edge — the everyday view of a building or a box.",
        layout: { kind: "two-point", horizon: 0.5, left: 0, right: 1 },
      },
      {
        slug: "wide",
        name: "Wide",
        description:
          "Both vanishing points well off the sheet, for gentler convergence and less distortion at the edges.",
        layout: { kind: "two-point", horizon: 0.5, left: -0.6, right: 1.6 },
      },
      {
        slug: "low-horizon",
        name: "Low horizon",
        description:
          "Eye level near the ground, so the tops of things climb steeply away — a tall building from the pavement.",
        layout: { kind: "two-point", horizon: 0.78, left: 0, right: 1 },
      },
    ],
  },
  {
    slug: "three-point",
    name: "Three-point",
    description:
      "Two-point perspective tilted up or down, so the uprights converge too, on a third vanishing point above or below.",
    variants: [
      {
        slug: "birds-eye",
        name: "Bird's eye",
        description:
          "Looking down on things: a high horizon, with the uprights converging on a point below the sheet.",
        layout: { kind: "three-point", horizon: 0.12, left: -0.15, right: 1.15, third: 1.9 },
      },
      {
        slug: "worms-eye",
        name: "Worm's eye",
        description:
          "Looking up at things: a low horizon, with the uprights converging on a point above the sheet.",
        layout: { kind: "three-point", horizon: 0.88, left: -0.15, right: 1.15, third: -0.9 },
      },
      {
        slug: "steep",
        name: "Steep",
        description:
          "Looking almost straight down, with the third vanishing point on the sheet — a city from a tower.",
        layout: { kind: "three-point", horizon: 0.05, left: 0.05, right: 0.95, third: 0.92 },
      },
    ],
  },
  {
    slug: "four-point",
    name: "Four-point",
    description:
      "Curvilinear perspective: the horizontals bow out towards two points on the horizon and the uprights towards two more above and below, like a wide-angle lens.",
    variants: [
      {
        slug: "standard",
        name: "Standard",
        description: "All four vanishing points on the edges of the frame, for a strong fisheye bend.",
        layout: { kind: "four-point", spanX: 1, spanY: 1 },
      },
      {
        slug: "gentle",
        name: "Gentle",
        description:
          "The vanishing points pushed off the sheet, so the lines curve less — a wide panorama rather than a fisheye.",
        layout: { kind: "four-point", spanX: 1.6, spanY: 1.8 },
      },
    ],
  },
  {
    slug: "five-point",
    name: "Five-point",
    description:
      "A full fisheye: four vanishing points around a circle and a fifth at its centre, for a view that takes in everything in front of you.",
    variants: [
      {
        slug: "fisheye",
        name: "Fisheye",
        description: "The circle as tall as the frame, with lines radiating from the centre.",
        layout: { kind: "five-point" },
      },
    ],
  },
];

/** One generated page: a perspective in one of its layouts. */
export interface Grid {
  perspective: Perspective;
  variant: Variant;
}

export const GRIDS: Grid[] = PERSPECTIVES.flatMap((perspective) =>
  perspective.variants.map((variant) => ({ perspective, variant })),
);

/** The grid at the bare `/printables/perspective-grid` path: centred one-point. */
export const DEFAULT_GRID: Grid = gridFor("one-point", "centre");

/** The one entry in `GRIDS` with this perspective and variant. */
export function gridFor(perspectiveSlug: string, variantSlug: string): Grid {
  return GRIDS.find(
    (grid) => grid.perspective.slug === perspectiveSlug && grid.variant.slug === variantSlug,
  )!;
}

/** Whether a grid is the one at the bare path. Compared by slug, not identity. */
export function isDefaultGrid(grid: Grid): boolean {
  return (
    grid.perspective.slug === DEFAULT_GRID.perspective.slug &&
    grid.variant.slug === DEFAULT_GRID.variant.slug
  );
}

/** URL segment for a grid — `two-point-wide`. */
export function gridSlug(grid: Grid): string {
  return `${grid.perspective.slug}-${grid.variant.slug}`;
}

/** URL for a grid. The default keeps the bare path. */
export function gridHref(grid: Grid): string {
  const basePath = "/printables/perspective-grid";
  return isDefaultGrid(grid) ? `${basePath}/` : `${basePath}/${gridSlug(grid)}/`;
}

/** The grids that need a `[grid]` page — all of them except the one at the bare path. */
export function subPageGrids(): Grid[] {
  return GRIDS.filter((grid) => !isDefaultGrid(grid));
}

/** Name of a grid for titles — "Two-point, Wide". */
export function gridName(grid: Grid): string {
  return `${grid.perspective.name}, ${grid.variant.name}`;
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/** The frame the grid is drawn inside, in millimetres from the sheet's top-left corner. */
export const FRAME = {
  x: PAGE_MARGIN_MM,
  y: PAGE_MARGIN_MM,
  width: PAGE_WIDTH_MM - PAGE_MARGIN_MM * 2,
  height: PAGE_HEIGHT_MM - PAGE_MARGIN_MM * 2,
};

const frameX = (fraction: number) => FRAME.x + fraction * FRAME.width;
const frameY = (fraction: number) => FRAME.y + fraction * FRAME.height;

const CENTRE: Point = { x: frameX(0.5), y: frameY(0.5) };

function inFrame(point: Point): boolean {
  return (
    point.x >= FRAME.x &&
    point.x <= FRAME.x + FRAME.width &&
    point.y >= FRAME.y &&
    point.y <= FRAME.y + FRAME.height
  );
}

function line(from: Point, to: Point, tone: Tone): LineStroke {
  return { kind: "line", from, to, tone };
}

/** A ray from `origin` through `through`, carried on until it is well off the sheet. */
function ray(origin: Point, through: Point, tone: Tone): LineStroke {
  const dx = through.x - origin.x;
  const dy = through.y - origin.y;
  const length = Math.hypot(dx, dy);
  return line(
    origin,
    { x: origin.x + (dx / length) * FAR_MM, y: origin.y + (dy / length) * FAR_MM },
    tone,
  );
}

/** Integers from `-n` to `n`. */
function symmetric(n: number): number[] {
  return Array.from({ length: n * 2 + 1 }, (_, i) => i - n);
}

/** Evenly spaced values from `start` to `end` at roughly `step` apart, both ends included. */
function spaced(start: number, end: number, step: number): number[] {
  const count = Math.max(1, Math.round((end - start) / step));
  return Array.from({ length: count + 1 }, (_, i) => start + ((end - start) * i) / count);
}

/**
 * The arc of the circle through `a`, `b` and `c` that runs from `a` to `c` by way
 * of `b`. A straight line when the three are in a row.
 */
function arcThrough(a: Point, b: Point, c: Point, tone: Tone): Stroke {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(d) < 1e-9) return line(a, c, tone);

  const sa = a.x * a.x + a.y * a.y;
  const sb = b.x * b.x + b.y * b.y;
  const sc = c.x * c.x + c.y * c.y;
  const centre = {
    x: (sa * (b.y - c.y) + sb * (c.y - a.y) + sc * (a.y - b.y)) / d,
    y: (sa * (c.x - b.x) + sb * (a.x - c.x) + sc * (b.x - a.x)) / d,
  };
  const radius = Math.hypot(a.x - centre.x, a.y - centre.y);

  // Angles measured from `a` in the increasing direction; the arc goes whichever
  // way round reaches `b` before `c`.
  const angle = (p: Point) => Math.atan2(p.y - centre.y, p.x - centre.x);
  const turn = (p: Point) => (((angle(p) - angle(a)) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const sweep = turn(b) < turn(c);
  const extent = sweep ? turn(c) : 2 * Math.PI - turn(c);

  return { kind: "arc", from: a, to: c, radius, large: extent > Math.PI, sweep, tone };
}

/**
 * The fan of arcs through two vanishing points `p` and `q`, spaced so they cross
 * the perpendicular bisector of `pq` about `RAY_STEP_MM` apart near the middle.
 *
 * Each arc is picked by the angle it leaves `p` at, relative to the line `pq`:
 * the arc at angle θ crosses the bisector at `half · tan(θ/2)` from the midpoint.
 * Spacing the angles evenly is what makes the arcs fan out of a vanishing point
 * the way the rays of linear perspective do. The straight one, θ = 0, is left out
 * for the caller to draw as a major line.
 */
function arcFan(p: Point, q: Point, maxAngle: number): Stroke[] {
  const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
  const half = Math.hypot(q.x - p.x, q.y - p.y) / 2;
  // Unit normal to pq, the direction the bisector runs in.
  const normal = { x: -(q.y - p.y) / (2 * half), y: (q.x - p.x) / (2 * half) };
  const step = (2 * RAY_STEP_MM) / half;
  // Stop half a step short, so the last arc is not crowded against the limit.
  const count = Math.floor(maxAngle / step - 0.5);

  return symmetric(count)
    .filter((k) => k !== 0)
    .map((k) => {
      const offset = half * Math.tan((k * step) / 2);
      const crossing = { x: mid.x + normal.x * offset, y: mid.y + normal.y * offset };
      return arcThrough(p, crossing, q, "ray");
    });
}

/** The strokes of a layout. */
export function drawLayout(layout: Layout): Drawing {
  switch (layout.kind) {
    case "one-point":
      return onePoint(layout);
    case "two-point":
      return twoPoint(layout);
    case "three-point":
      return threePoint(layout);
    case "four-point":
      return fourPoint(layout);
    case "five-point":
      return fivePoint();
  }
}

/**
 * Rays from the vanishing point to evenly spaced points round the frame, and a
 * run of nested frames shrinking towards it. Each nested frame is the border
 * scaled about the vanishing point, so it meets every ray at a corner of the
 * same receding grid — the walls, floor and ceiling of a room, a step deeper each
 * time. Depth `k` is drawn at scale `1/(1 + k/2)`, which is how equal steps away
 * from the viewer shrink.
 */
function onePoint({ vanishing }: { vanishing: Point }): Drawing {
  const vp = { x: frameX(vanishing.x), y: frameY(vanishing.y) };
  const { x, y, width, height } = FRAME;
  const right = x + width;
  const bottom = y + height;

  const border: Point[] = [
    ...spaced(x, right, RAY_STEP_MM * 1.25).map((px) => ({ x: px, y })),
    ...spaced(x, right, RAY_STEP_MM * 1.25).map((px) => ({ x: px, y: bottom })),
    ...spaced(y, bottom, RAY_STEP_MM * 1.25)
      .slice(1, -1)
      .flatMap((py) => [
        { x, y: py },
        { x: right, y: py },
      ]),
  ];
  const rays = border.map((point) => line(vp, point, "ray"));

  const depths = Array.from({ length: 16 }, (_, i) => 1 / (1 + (i + 1) / 2)).filter(
    (scale) => scale > 0.12,
  );
  const frames = depths.flatMap((scale) => {
    const at = (px: number, py: number) => ({
      x: vp.x + (px - vp.x) * scale,
      y: vp.y + (py - vp.y) * scale,
    });
    const corners = [at(x, y), at(right, y), at(right, bottom), at(x, bottom)];
    return corners.map((corner, i) => line(corner, corners[(i + 1) % 4], "minor"));
  });

  const horizon = line({ x, y: vp.y }, { x: right, y: vp.y }, "major");
  return { strokes: [...frames, ...rays, horizon], vanishingPoints: [vp] };
}

/**
 * Rays from each vanishing point through evenly spaced marks on the upright
 * halfway between them — the nearest corner of a box — plus plain verticals.
 */
function twoPoint(layout: { horizon: number; left: number; right: number }): Drawing {
  const horizonY = frameY(layout.horizon);
  const left = { x: frameX(layout.left), y: horizonY };
  const right = { x: frameX(layout.right), y: horizonY };
  const cornerX = (left.x + right.x) / 2;

  const marks = symmetric(Math.ceil((FRAME.height * 1.5) / RAY_STEP_MM))
    .filter((k) => k !== 0)
    .map((k) => ({ x: cornerX, y: horizonY + k * RAY_STEP_MM }));
  const rays = marks.flatMap((mark) => [ray(left, mark, "ray"), ray(right, mark, "ray")]);

  const verticals = spaced(FRAME.x, FRAME.x + FRAME.width, VERTICAL_STEP_MM).map((x) =>
    line({ x, y: FRAME.y }, { x, y: FRAME.y + FRAME.height }, "minor"),
  );

  return {
    strokes: [...verticals, ...rays, horizonLine(horizonY)],
    vanishingPoints: [left, right].filter(inFrame),
  };
}

/**
 * Two-point's rays, with the uprights replaced by rays to a third vanishing point
 * through evenly spaced marks along the horizon.
 */
function threePoint(layout: {
  horizon: number;
  left: number;
  right: number;
  third: number;
}): Drawing {
  const horizonY = frameY(layout.horizon);
  const left = { x: frameX(layout.left), y: horizonY };
  const right = { x: frameX(layout.right), y: horizonY };
  const third = { x: CENTRE.x, y: frameY(layout.third) };

  const marks = symmetric(Math.ceil((FRAME.height * 2) / RAY_STEP_MM))
    .filter((k) => k !== 0)
    .map((k) => ({ x: third.x, y: horizonY + k * RAY_STEP_MM }))
    // A mark on the far side of the third point would send its rays back past it.
    .filter((mark) => Math.sign(mark.y - third.y) === Math.sign(horizonY - third.y));
  const sideRays = marks.flatMap((mark) => [ray(left, mark, "ray"), ray(right, mark, "ray")]);

  const uprights = spaced(
    FRAME.x - FRAME.width,
    FRAME.x + FRAME.width * 2,
    VERTICAL_STEP_MM * 1.25,
  ).map((x) => ray(third, { x, y: horizonY }, "minor"));

  return {
    strokes: [...uprights, ...sideRays, horizonLine(horizonY)],
    vanishingPoints: [left, right, third].filter(inFrame),
  };
}

/**
 * Two fans of arcs: the horizontals, through the left and right points, and the
 * uprights, through the top and bottom ones. The straight member of each fan is
 * the horizon and the centre vertical.
 */
function fourPoint({ spanX, spanY }: { spanX: number; spanY: number }): Drawing {
  const halfX = (FRAME.width / 2) * spanX;
  const halfY = (FRAME.height / 2) * spanY;
  const left = { x: CENTRE.x - halfX, y: CENTRE.y };
  const right = { x: CENTRE.x + halfX, y: CENTRE.y };
  const top = { x: CENTRE.x, y: CENTRE.y - halfY };
  const bottom = { x: CENTRE.x, y: CENTRE.y + halfY };

  // Past a right angle an arc leaves its vanishing point heading away from the
  // other one, and only comes back into the frame across a corner; arcs nearer a
  // full turn never come back at all, and the clip throws them away.
  const maxAngle = Math.PI * 0.85;

  return {
    strokes: [
      ...arcFan(left, right, maxAngle),
      ...arcFan(top, bottom, maxAngle),
      horizonLine(CENTRE.y),
      line({ x: CENTRE.x, y: FRAME.y }, { x: CENTRE.x, y: FRAME.y + FRAME.height }, "major"),
    ],
    vanishingPoints: [left, right, top, bottom].filter(inFrame),
  };
}

/**
 * Four-point's two fans, kept inside a circle that passes through all four of
 * their vanishing points, plus rays out from the fifth at the centre. An arc
 * through two opposite points of the circle stays inside it as long as it leaves
 * at less than a right angle, so the fans stop there and the circle itself is the
 * last arc of each.
 */
function fivePoint(): Drawing {
  const radius = FRAME.height / 2;
  const left = { x: CENTRE.x - radius, y: CENTRE.y };
  const right = { x: CENTRE.x + radius, y: CENTRE.y };
  const top = { x: CENTRE.x, y: CENTRE.y - radius };
  const bottom = { x: CENTRE.x, y: CENTRE.y + radius };

  const spokes = Array.from({ length: 36 }, (_, i) => (i * Math.PI) / 18)
    // The spokes along the axes are already drawn, as the straight arcs.
    .filter((_, i) => i % 9 !== 0)
    .map((angle) =>
      line(
        CENTRE,
        { x: CENTRE.x + Math.cos(angle) * radius, y: CENTRE.y + Math.sin(angle) * radius },
        "minor",
      ),
    );

  return {
    strokes: [
      ...spokes,
      ...arcFan(left, right, Math.PI / 2),
      ...arcFan(top, bottom, Math.PI / 2),
      line(left, right, "major"),
      line(top, bottom, "major"),
    ],
    vanishingPoints: [CENTRE, left, right, top, bottom],
    circle: { centre: CENTRE, radius },
  };
}

function horizonLine(y: number): LineStroke {
  return line({ x: FRAME.x, y }, { x: FRAME.x + FRAME.width, y }, "major");
}

/** How many vanishing points a layout has, and how many of them land on the sheet. */
export function describeGrid(grid: Grid): string {
  const total = pointCount(grid.variant.layout);
  const onSheet = drawLayout(grid.variant.layout).vanishingPoints.length;
  const offSheet = total - onSheet;
  const points = `${total} vanishing ${total === 1 ? "point" : "points"}`;
  const where =
    offSheet === 0
      ? "ringed on the sheet"
      : onSheet === 0
        ? "all past the edge of the sheet"
        : `${onSheet} on the sheet and ${offSheet} past its edge`;
  return `A4 landscape · ${points}, ${where}.`;
}

function pointCount(layout: Layout): number {
  const counts: Record<Layout["kind"], number> = {
    "one-point": 1,
    "two-point": 2,
    "three-point": 3,
    "four-point": 4,
    "five-point": 5,
  };
  return counts[layout.kind];
}
