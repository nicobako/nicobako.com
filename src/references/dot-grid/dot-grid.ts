// Dividing a dot grid along one axis.
//
// Numbers only — no markup. The whole reference is one small piece of arithmetic
// (how does a run of cells split into equal parts, and what is left over?) applied
// to every dot count someone is likely to have counted, so all of it resolves at
// build time and the pages ship no JavaScript.
//
// The unit that matters is the *cell*, not the dot: you write between dots, so a
// row of 27 dots is 26 cells wide. Everything below is in cells, and the pages are
// keyed on dots, because dots are what you can count.

/** Leuchtturm, Rhodia, Moleskine and most others print a 5 mm grid. */
export const SPACING_MM = 5;

/**
 * Dot counts that get a page. One page each, all precached by the service worker, so
 * this range is a real cost: it stops where a page stops being a page. Twenty dots is
 * about the narrowest pocket notebook, forty-five about the widest A4 grid, and a
 * spread is looked up from its single-page count rather than needing its own page.
 */
export const DOT_COUNTS: number[] = Array.from(
  { length: 26 },
  (_, i) => i + 20,
);

export const MIN_DOTS = DOT_COUNTS[0]!;
export const MAX_DOTS = DOT_COUNTS[DOT_COUNTS.length - 1]!;

/** Parts worth tabulating. Beyond a dozen columns a page stops being writable. */
const MAX_PARTS = 12;

export interface Division {
  /** How many equal parts the run is cut into. */
  parts: number;
  /** Cells in each part. */
  each: number;
  /** Cells that do not fit into any part. */
  spare: number;
  /** Spare cells before the first part — half the remainder, rounded down. */
  leadingSpare: number;
  /** Spare cells after the last part. */
  trailingSpare: number;
  /** True when the run divides exactly. */
  exact: boolean;
}

/** Split `cells` into `parts` equal parts, and say what is left over. */
export function divide(cells: number, parts: number): Division {
  const each = Math.floor(cells / parts);
  const spare = cells - each * parts;
  const leadingSpare = Math.floor(spare / 2);
  return {
    parts,
    each,
    spare,
    leadingSpare,
    trailingSpare: spare - leadingSpare,
    exact: spare === 0,
  };
}

/** Every division from halves up, for the table. Parts that leave nothing to write in are dropped. */
export function divisions(cells: number, maxParts = MAX_PARTS): Division[] {
  const rows: Division[] = [];
  for (let parts = 2; parts <= maxParts; parts += 1) {
    const division = divide(cells, parts);
    // A part narrower than one cell is not a column, it is a line.
    if (division.each < 1) break;
    rows.push(division);
  }
  return rows;
}

/** The part counts that divide the run exactly — the ones worth building a layout around. */
export function exactParts(cells: number, maxParts = MAX_PARTS): number[] {
  const parts: number[] = [];
  for (let n = 2; n <= Math.min(maxParts, cells); n += 1) {
    if (cells % n === 0) parts.push(n);
  }
  return parts;
}

/** A division someone actually asks for by name, rather than by number. */
export interface NamedLayout {
  label: string;
  parts: number;
  /** Why this one comes up. */
  note: string;
}

const NAMED: NamedLayout[] = [
  { label: "Halves", parts: 2, note: "A before/after, or two lists." },
  { label: "Thirds", parts: 3, note: "Morning / afternoon / evening." },
  { label: "Quarters", parts: 4, note: "Four quadrants, or a month of weeks." },
  { label: "Weekdays", parts: 5, note: "Monday to Friday." },
  { label: "Week", parts: 7, note: "One part per day of the week." },
  {
    label: "Month",
    parts: 31,
    note: "One part per day of the month — a habit tracker.",
  },
];

/** The named layouts that fit a run of `cells` cells, with the division each lands on. */
export function namedFor(
  cells: number,
): (NamedLayout & { division: Division })[] {
  return NAMED.filter((layout) => layout.parts <= cells).map((layout) => ({
    ...layout,
    division: divide(cells, layout.parts),
  }));
}

/** Cells in a run of `dots` dots. You write between the dots, so it is one fewer. */
export function cellsFor(dots: number): number {
  return dots - 1;
}

/** Millimetres across a run of `cells` cells, at 5 mm spacing. */
export function millimetres(cells: number): number {
  return cells * SPACING_MM;
}

// ---------------------------------------------------------------------------
// Layouts that are not evenly divided
//
// An equal split is the obvious answer and often the wrong one: a label column and
// the text beside it do not want the same width, and the cells left over from an
// even division are usually better spent as a sidebar than as margin. These are the
// asymmetric splits worth knowing, sized to whatever run they are asked about.
// ---------------------------------------------------------------------------

/** One block of a drawn strip. */
export interface StripSegment {
  cells: number;
  /** major = the content side, minor = a label or gutter, part = one of many equals. */
  kind: "major" | "minor" | "part" | "spare";
  label?: string;
}

export interface SpaceLayout {
  name: string;
  /** What it is for, and why the split falls where it does. */
  why: string;
  segments: StripSegment[];
}

/** Round to the nearest cell, never below `min`. */
function cellsAt(fraction: number, cells: number, min = 1): number {
  return Math.max(min, Math.round(cells * fraction));
}

/**
 * The asymmetric layouts that fit a run of `cells` cells. Each is skipped when the
 * run is too short for it to mean anything — a two-cell content column is not a
 * layout — so a narrow page simply offers fewer.
 */
export function spaceLayouts(cells: number): SpaceLayout[] {
  const layouts: SpaceLayout[] = [];

  if (cells >= 8) {
    // 1 : 1.618, so the narrow side is the whole divided by 2.618.
    const minor = cellsAt(1 / 2.618, cells, 2);
    layouts.push({
      name: "Golden section",
      why: "The default when two parts hold different things. The wide part takes the content, the narrow one whatever annotates it — a notes column beside the text, or a title band above it.",
      segments: [
        { cells: cells - minor, kind: "major", label: "content" },
        { cells: minor, kind: "minor", label: "notes" },
      ],
    });
  }

  if (cells >= 10) {
    const cue = cellsAt(0.3, cells, 3);
    layouts.push({
      name: "Cornell",
      why: "A cue column down the left for questions and keywords, notes to the right. Pairs with the summary band in the rows below.",
      segments: [
        { cells: cue, kind: "minor", label: "cue" },
        { cells: cells - cue, kind: "major", label: "notes" },
      ],
    });
  }

  if (cells >= 12) {
    layouts.push({
      name: "Time gutter",
      why: "Three cells is 15 mm — exactly enough for “09:00” — and the rest of the run stays whole for the entry.",
      segments: [
        { cells: 3, kind: "minor", label: "time" },
        { cells: cells - 3, kind: "major", label: "entry" },
      ],
    });
  }

  if (cells >= 8) {
    layouts.push({
      name: "Bullet gutter",
      why: "One cell for the bullet, box or signifier. Costs 5 mm and keeps every line of text starting on the same dot.",
      segments: [
        { cells: 1, kind: "minor", label: "•" },
        { cells: cells - 1, kind: "major", label: "text" },
      ],
    });
  }

  const weekEach = Math.floor(cells / 7);
  const weekSidebar = cells - weekEach * 7;
  if (weekEach >= 2 && weekSidebar >= 2) {
    layouts.push({
      name: "Week and sidebar",
      why: `Seven equal days of ${weekEach} cells leave ${weekSidebar} over. Keep them together as a sidebar instead of splitting them into margin — that is where the week's notes go.`,
      segments: [
        ...Array.from({ length: 7 }, () => ({
          cells: weekEach,
          kind: "part" as const,
        })),
        { cells: weekSidebar, kind: "minor", label: "notes" },
      ],
    });
  }

  if (cells >= 20) {
    const numbers = 4;
    layouts.push({
      name: "Ledger",
      why: "A wide description column and narrow number columns. Four cells holds five digits at 5 mm spacing, which is enough for most sums.",
      segments: [
        { cells: cells - numbers * 3, kind: "major", label: "description" },
        { cells: numbers, kind: "part", label: "in" },
        { cells: numbers, kind: "part", label: "out" },
        { cells: numbers, kind: "part", label: "balance" },
      ],
    });
  }

  if (cells >= 10) {
    layouts.push({
      name: "Header band",
      why: "Two cells is 10 mm, which is a date or a title written comfortably. Everything below it is body, and the band gives the page somewhere to start.",
      segments: [
        { cells: 2, kind: "minor", label: "title" },
        { cells: cells - 2, kind: "major", label: "body" },
      ],
    });
  }

  if (cells >= 14) {
    layouts.push({
      name: "Header and total",
      why: "The same band top and bottom: a title above, a total or conclusion below. Anything that has to be added up wants the closing band reserved before you start writing into it.",
      segments: [
        { cells: 2, kind: "minor", label: "title" },
        { cells: cells - 4, kind: "major", label: "body" },
        { cells: 2, kind: "minor", label: "total" },
      ],
    });
  }

  if (cells >= 15) {
    const summary = cellsAt(0.2, cells, 3);
    layouts.push({
      name: "Cornell summary",
      why: "The row half of Cornell: a band across the foot of the page, written after the fact, for the summary the notes above are supposed to add up to.",
      segments: [
        { cells: cells - summary, kind: "major", label: "notes" },
        { cells: summary, kind: "minor", label: "summary" },
      ],
    });
  }

  const weekBand = Math.floor((cells - 1) / 5);
  if (weekBand >= 2) {
    const monthSpare = cells - 1 - weekBand * 5;
    layouts.push({
      name: "Month of weeks",
      why: `One header row for the weekday names, then five bands of ${weekBand} cells — the shape of a month grid. Six bands if the month starts awkwardly, which costs ${weekBand} cells from the body.`,
      segments: [
        { cells: 1, kind: "minor", label: "days" },
        ...Array.from({ length: 5 }, () => ({
          cells: weekBand,
          kind: "part" as const,
        })),
        ...(monthSpare > 0
          ? [{ cells: monthSpare, kind: "spare" as const }]
          : []),
      ],
    });
  }

  const hours = Math.floor(cells / 2);
  if (hours >= 6) {
    const hourSpare = cells - hours * 2;
    layouts.push({
      name: "Hour blocks",
      why: `Two cells to the hour is 10 mm, the smallest band you can still write an appointment into. ${hours} hours fits this run${hourSpare > 0 ? `, with ${hourSpare} cell${hourSpare === 1 ? "" : "s"} left for a header` : " exactly"}.`,
      segments: [
        ...Array.from({ length: hours }, () => ({
          cells: 2,
          kind: "part" as const,
        })),
        ...(hourSpare > 0
          ? [{ cells: hourSpare, kind: "spare" as const }]
          : []),
      ],
    });
  }

  return layouts;
}
