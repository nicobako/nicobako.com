// Journal page layouts, as data.
//
// Numbers and labels only — no markup. Every layout here is a fixed shape, so all of
// it resolves at build time and the page ships no JavaScript.
//
// There are two kinds of page here, and they want two different models:
//
// *Grids* are pages you rule before you write on them — a daily log, a month. They are
// declared as bands and regions, because that is how you actually rule one: a stack of
// horizontal slices, each cut into columns. Weights are shares relative to siblings, so
// a grid says "the cue column is three to the notes' seven", never a millimetre, and
// holds at any page size and grid spacing.
//
// *Compositions* are pages you arrange — a field note, a travel spread, a page about a
// dream. They cannot be bands, because the whole point of them is what a band forbids:
// a sketch that runs off the edge, a caption sitting on top of a photograph, a block of
// writing set a couple of degrees off square. So the underlying model is placement —
// every element carries its own box in percentages of the page, plus an optional angle —
// and `fromBands` turns the ergonomic grid declaration into placed elements. One model
// reaches the renderer; the two ways of writing it down are for the author's benefit.
//
// An element declares what it *is* — writing, a drawing, a table, a photograph — but
// never what it says. The page stays blank: the shape is the part worth copying.
//
// A spread is not a third kind of thing. A spread is two pages, so `pages` is a list
// and a spread is the case where it has two entries.

import { A_SERIES } from "../page-sizes/page-sizes";

/** The notebook page. A5 is what most bound journals are. */
const PAGE = A_SERIES.find((size) => size.slug === "a5")!;

/** Width and height of one page, ready for a CSS `aspect-ratio`. */
export const PAGE_ASPECT = `${PAGE.widthMm} / ${PAGE.heightMm}`;

/**
 * What an element is, which is all the drawing needs to know to suggest it: ruling for
 * writing, a grid for a table, a dashed edge for something drawn by hand.
 */
export type ElementKind =
  | "open" // Ruled off and left empty — the grids are made of these.
  | "title" // A line that names the page.
  | "text" // Writing.
  | "table" // Ruled rows and columns.
  | "sketch" // Drawn by hand.
  | "photo" // Something pasted in: a print, a ticket, a leaf.
  | "quote"; // A line borrowed from somewhere else, or one saved for later.

/**
 * One element, boxed in percentages of the page. Values outside 0–100 are deliberate:
 * that is how something bleeds off an edge, and the page clips it.
 */
export interface Element {
  kind: ElementKind;
  /** What goes here. Empty when the box is one of many identical ones. */
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Degrees off square. Small angles only — this is a page, not a collage. */
  rotate?: number;
  /**
   * Where the label sits. Default is the top corner; "bottom" is for a box that runs
   * off the top of the page, whose top corner is not on the paper.
   */
  labelAt?: "bottom";
}

export interface Page {
  elements: Element[];
}

export interface JournalLayout {
  /** Stable id, used as a key and an anchor. */
  slug: string;
  name: string;
  /** What it is for, and why the shapes fall where they do. */
  why: string;
  /** One page, or two. Two is a spread. */
  pages: Page[];
}

// ---------------------------------------------------------------------------
// Ruling
//
// How many lines a ruled box gets, and how many columns a table gets. Both are counts,
// not spacings, because the drawing scales with whatever column it is placed in: ask
// for a fixed pitch and the ruling either crowds or thins out as the page resizes, ask
// for a count and it stays proportional at any size.
//
// The divisors are chosen so a box of average height reads as writing rather than as a
// barcode — roughly one line per 2.5% of the page's height, one column per 9% of its
// width — and both floor at one, since a box too small for a line is still a box.
// ---------------------------------------------------------------------------

/** Ruled lines for a box `h` percent of the page tall. */
export function ruleCount(h: number): number {
  return Math.max(1, Math.round(h / 2.5));
}

/** Table columns for a box `w` percent of the page wide. */
export function columnCount(w: number): number {
  return Math.max(1, Math.round(w / 9));
}

// ---------------------------------------------------------------------------
// Declaring a composition: placement, directly
// ---------------------------------------------------------------------------

function place(
  kind: ElementKind,
  label: string,
  x: number,
  y: number,
  w: number,
  h: number,
  rotate?: number,
  labelAt?: "bottom",
): Element {
  return {
    kind,
    label,
    x,
    y,
    w,
    h,
    ...(rotate === undefined ? {} : { rotate }),
    ...(labelAt === undefined ? {} : { labelAt }),
  };
}

function compose(...elements: Element[]): Page {
  return { elements };
}

// ---------------------------------------------------------------------------
// Declaring a grid: bands of regions, converted to placement
// ---------------------------------------------------------------------------

/** One box in a band. */
interface Region {
  label: string;
  /** Share of its band's width, relative to the other regions in that band. */
  weight: number;
}

/** A horizontal slice of the page, split into one or more regions. */
interface Band {
  /** Share of the page's height, relative to the other bands on that page. */
  weight: number;
  regions: Region[];
}

function region(label: string, weight = 1): Region {
  return { label, weight };
}

function band(weight: number, ...regions: Region[]): Band {
  return { weight, regions };
}

/** A run of identical unlabelled boxes — a week of days, a row of a grid. */
function blanks(count: number): Region[] {
  return Array.from({ length: count }, () => region(""));
}

/** The gap between two ruled boxes, in percent of the page. Half of it per edge. */
const GUTTER = 1.2;

function total(weights: { weight: number }[]): number {
  return weights.reduce((sum, item) => sum + item.weight, 0);
}

/**
 * Turn bands into placed elements. Every box is inset by half a gutter on each edge, so
 * neighbours read as two ruled lines rather than one doubled-up border.
 */
function fromBands(...bands: Band[]): Page {
  const pageWeight = total(bands);
  const elements: Element[] = [];
  let y = 0;

  for (const b of bands) {
    const h = (b.weight / pageWeight) * 100;
    const bandWeight = total(b.regions);
    let x = 0;

    for (const r of b.regions) {
      const w = (r.weight / bandWeight) * 100;
      elements.push(
        place(
          "open",
          r.label,
          x + GUTTER / 2,
          y + GUTTER / 2,
          w - GUTTER,
          h - GUTTER,
        ),
      );
      x += w;
    }
    y += h;
  }

  return { elements };
}

// ---------------------------------------------------------------------------
// Grids — pages you rule before you write on them
//
// A short, hand-picked list: each one is a shape you would actually rule, and each
// differs from the others in what it does with the page, not in its proportions.
// ---------------------------------------------------------------------------

export const GRIDS: JournalLayout[] = [
  {
    slug: "daily-log",
    name: "Daily log",
    why: "The workhorse, and the one to rule first: a band for the date and everything else left open. The band matters more than it looks — it is what stops a day from starting halfway down the page, and it gives you somewhere to write the date without stealing the first line.",
    pages: [fromBands(band(1, region("date")), band(9, region("entries")))],
  },
  {
    slug: "cornell",
    name: "Cornell",
    why: "A narrow cue column for questions and keywords, the notes beside it, and a band across the foot for the summary. The summary band is the point: reserve it before you start writing, because the whole method is having somewhere to say afterwards what the notes were supposed to add up to.",
    pages: [
      fromBands(
        band(8, region("cue", 3), region("notes", 7)),
        band(2, region("summary")),
      ),
    ],
  },
  {
    slug: "time-blocked",
    name: "Time-blocked day",
    why: "A gutter down the left for the hour and the rest of the width for the entry. Keep the gutter narrow — it holds “09:00” and nothing else — so the entry column stays wide enough to write a sentence in rather than a word.",
    pages: [
      fromBands(
        band(1, region("date")),
        band(9, region("time", 2), region("entry", 8)),
      ),
    ],
  },
  {
    slug: "quadrants",
    name: "Quadrants",
    why: "Two lines, four boxes, no hierarchy. Good for anything that sorts along two axes — urgent against important, or simply four buckets to empty your head into — and good because it is the fastest layout on this page to rule: halve it, halve it again.",
    pages: [
      fromBands(
        band(1, region("1"), region("2")),
        band(1, region("3"), region("4")),
      ),
    ],
  },
  {
    slug: "weekly",
    name: "Weekly spread",
    why: "Seven days across two pages, which is where the awkwardness of seven goes: three days on the left, two on the right, and the weekend halved into one band because Saturday and Sunday rarely need a full day's room. Every day gets the full width of its page, so the long entries have somewhere to go.",
    pages: [
      fromBands(
        band(1, region("Monday")),
        band(1, region("Tuesday")),
        band(1, region("Wednesday")),
      ),
      fromBands(
        band(1, region("Thursday")),
        band(1, region("Friday")),
        band(1, region("Saturday"), region("Sunday")),
      ),
    ],
  },
  {
    slug: "monthly",
    name: "Monthly calendar",
    why: "A month grid split down the spine: Monday to Wednesday on the left page, Thursday to Sunday on the right. The fold falls inside the week rather than between two of them, which is the trade — the grid reads across the spread, but each page is still ruled on its own, in threes and in fours.",
    pages: [
      fromBands(
        band(1, region("Mon"), region("Tue"), region("Wed")),
        ...Array.from({ length: 5 }, () => band(3, ...blanks(3))),
      ),
      fromBands(
        band(1, region("Thu"), region("Fri"), region("Sat"), region("Sun")),
        ...Array.from({ length: 5 }, () => band(3, ...blanks(4))),
      ),
    ],
  },
];

// ---------------------------------------------------------------------------
// Compositions — pages you arrange
//
// Three moves do nearly all the work here, and none of them is available to a grid:
// let one thing run off the edge, so the page feels like a window onto something bigger
// rather than a container; set a block a degree or two off square, so it reads as put
// there by a hand; and let two things overlap, which is the only way a page says that
// one of them came after the other.
// ---------------------------------------------------------------------------

export const COMPOSITIONS: JournalLayout[] = [
  {
    slug: "field-notes",
    name: "Field notes",
    why: "One drawing, given far more room than it needs, running off the top edge so the specimen feels bigger than the page. Everything else is subordinate to it: a narrow column of notes down the side, measurements in a small hard table, and a line at the foot for the thing you noticed that the measurements will not hold. The page is mostly the drawing, which is the point — it is a record of having looked at something.",
    pages: [
      compose(
        place("sketch", "specimen", 4, -12, 54, 52, -1.5, "bottom"),
        place("title", "date · place", 60, 6, 36, 7),
        place("text", "notes", 60, 16, 36, 50),
        place("table", "measurements", 6, 48, 50, 24),
        place("text", "what I noticed", 6, 76, 88, 18, 0.5),
      ),
    ],
  },
  {
    slug: "travel",
    name: "Travel spread",
    why: "The left page is one photograph, full bleed, with the caption sitting on top of its lower edge and a ticket tucked in at an angle — the layer order is the story, because the caption and the ticket were both added after the picture was already there. The right page is the writing, kept deliberately plainer, with the map running off the outer edge so the place continues past where the page stops.",
    pages: [
      compose(
        place("photo", "", -5, -5, 110, 64),
        place("quote", "caption", 8, 54, 58, 11, -2),
        place("photo", "ticket", 62, 62, 34, 15, 6),
        place("text", "the day in three lines", 8, 80, 84, 15),
      ),
      compose(
        place("title", "place, date", 8, 6, 84, 7),
        place("text", "notes", 8, 16, 50, 50),
        place("text", "names", 62, 16, 32, 20, 1.5),
        place("sketch", "map", 58, 40, 48, 34, 3),
        place("table", "what it cost", 8, 74, 48, 20),
      ),
    ],
  },
  {
    slug: "recipe",
    name: "Recipe",
    why: "Two columns that are honestly different: a table for the things you can count, prose for the things you cannot. The dish is drawn once, at the top corner and off the edge, because a recipe page is worth keeping only if you can tell at a glance which one it is. The borrowed line near the foot is where the recipe came from — the part that makes it yours rather than a printout.",
    pages: [
      compose(
        place("title", "the dish", 6, 5, 58, 8),
        place("sketch", "", 58, 2, 48, 30, 4),
        place("table", "ingredients", 6, 17, 40, 44),
        place("text", "method", 50, 36, 44, 40),
        place("quote", "from the card", 6, 66, 40, 12, -1),
        place("text", "what I changed", 6, 82, 88, 12),
      ),
    ],
  },
  {
    slug: "practice",
    name: "Practice log",
    why: "A page that has to hold three incompatible things: a passage of music, numbers that only mean something in a row, and an honest sentence about how it went. So the stave gets a band of its own across the top, the numbers get a table, and the sentence gets the width of the page — with a row of small boxes at the foot for the one thing you will actually check back on, which is not the tempo but the mood.",
    pages: [
      compose(
        place("title", "date · what I worked on", 6, 5, 88, 7),
        place("sketch", "the passage", 6, 15, 88, 19),
        place("table", "tempo · reps", 6, 38, 46, 30),
        place("text", "what went wrong", 56, 38, 38, 30),
        place("quote", "tomorrow, first thing", 6, 72, 88, 10),
        ...Array.from({ length: 5 }, (_, i) =>
          place("open", "", 6 + i * 8.5, 86, 6.5, 8),
        ),
        place("text", "how it felt", 52, 86, 42, 8),
      ),
    ],
  },
  {
    slug: "dream",
    name: "Dream page",
    why: "No grid at all, and much more white space than feels comfortable — a page where the emptiness is doing the work. The fragments sit apart and slightly off square, the way they come back to you, and the drawing in the middle is the one image that stayed, given the centre because it earned it. Written straight into a ruled column, the same material would read as a list of things that did not happen.",
    pages: [
      compose(
        place("text", "", 8, 8, 42, 17, -2),
        place("text", "", 54, 13, 38, 14, 3),
        place("sketch", "the image that stayed", 26, 31, 50, 35, -3),
        place("text", "", 6, 70, 38, 15, 1.5),
        place("text", "", 54, 73, 38, 13, -2),
        place("quote", "what it meant, maybe", 20, 89, 60, 8, 0.5),
      ),
    ],
  },
  {
    slug: "story-arc",
    name: "Story arc",
    why: "The beats step down and outward on each page — the same move, made twice — so the spread has a direction you feel before you read a word of it, and the fold is where it restarts. A drawing hangs off each outer edge, bracketing the whole thing between two images, and the closing line at the foot is the only element on either page that is level: everything above it is still moving, and that one is not.",
    pages: [
      compose(
        place("title", "how it started", 6, 5, 56, 8),
        place("text", "", 6, 18, 44, 15, -2),
        place("text", "", 26, 37, 50, 15, 1),
        place("text", "", 44, 57, 50, 15, -1),
        place("sketch", "", -12, 60, 44, 30, -4),
      ),
      compose(
        place("text", "", 6, 10, 46, 15, 2),
        place("text", "", 26, 29, 50, 15, -1),
        place("text", "", 40, 47, 50, 15, 1),
        place("sketch", "", 64, 62, 48, 22, 4),
        place("quote", "how it ended", 10, 86, 78, 10),
      ),
    ],
  },
];

// ---------------------------------------------------------------------------
// The legend
//
// One of each kind, on a page of its own, so the vocabulary is explained in exactly the
// terms the drawings use it in — the same component draws this as draws the layouts.
// ---------------------------------------------------------------------------

export const LEGEND: Page = compose(
  place("title", "a title", 6, 4, 88, 10),
  place("text", "writing", 6, 17, 88, 12),
  place("table", "a table", 6, 31, 88, 12),
  place("sketch", "drawn by hand", 6, 45, 88, 12),
  place("photo", "pasted in", 6, 59, 88, 12),
  place("quote", "a borrowed line", 6, 73, 88, 12),
  place("open", "left empty", 6, 87, 88, 10),
);
