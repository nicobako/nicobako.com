// Journal page layouts, as data.
//
// Numbers and labels only — no markup. Every layout here is a fixed shape, so all of
// it resolves at build time and the page ships no JavaScript.
//
// A layout is deliberately *blank*: bands and regions, nothing written in them and no
// ruling drawn. What the page is for lives in `why`; what it looks like is the boxes.
//
// The model is two levels deep, because that is as deep as a page you rule by hand
// wants to go: a page is a stack of bands, and a band is a row of regions. Weights are
// shares, relative to their siblings only — a layout says "the cue column is three to
// the notes' seven", never a millimetre, so the same shape holds on any size of page
// and any spacing of grid. For the arithmetic of landing those shares on real dots,
// see the dot grid reference.
//
// A spread is not a third kind of thing. A spread is two pages, so `pages` is a list
// and a spread is the case where it has two entries.

import { A_SERIES } from "../page-sizes/page-sizes";

/** The notebook page. A5 is what most bound journals are. */
const PAGE = A_SERIES.find((size) => size.slug === "a5")!;

/** Width and height of one page, ready for a CSS `aspect-ratio`. */
export const PAGE_ASPECT = `${PAGE.widthMm} / ${PAGE.heightMm}`;

/** One box on the page: something you rule off and write in. */
export interface Region {
  /** What goes here. Empty when the box is one of many identical ones. */
  label: string;
  /** Share of its band's width, relative to the other regions in that band. */
  weight: number;
}

/** A horizontal slice of the page, split into one or more regions. */
export interface Band {
  /** Share of the page's height, relative to the other bands on that page. */
  weight: number;
  regions: Region[];
}

export interface Page {
  bands: Band[];
}

export interface JournalLayout {
  /** Stable id, used as a key and an anchor. */
  slug: string;
  name: string;
  /** What it is for, and why the lines fall where they do. */
  why: string;
  /** One page, or two. Two is a spread. */
  pages: Page[];
}

function region(label: string, weight = 1): Region {
  return { label, weight };
}

function band(weight: number, ...regions: Region[]): Band {
  return { weight, regions };
}

function page(...bands: Band[]): Page {
  return { bands };
}

/** A run of identical unlabelled boxes — a week of days, a row of a grid. */
function blanks(count: number): Region[] {
  return Array.from({ length: count }, () => region(""));
}

// ---------------------------------------------------------------------------
// The layouts
//
// A short, hand-picked list: each one is a shape you would actually rule, and each
// differs from the others in what it does with the page, not in its proportions.
// ---------------------------------------------------------------------------

export const LAYOUTS: JournalLayout[] = [
  {
    slug: "daily-log",
    name: "Daily log",
    why: "The workhorse, and the one to rule first: a band for the date and everything else left open. The band matters more than it looks — it is what stops a day from starting halfway down the page, and it gives you somewhere to write the date without stealing the first line.",
    pages: [page(band(1, region("date")), band(9, region("entries")))],
  },
  {
    slug: "cornell",
    name: "Cornell",
    why: "A narrow cue column for questions and keywords, the notes beside it, and a band across the foot for the summary. The summary band is the point: reserve it before you start writing, because the whole method is having somewhere to say afterwards what the notes were supposed to add up to.",
    pages: [
      page(
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
      page(
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
      page(
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
      page(
        band(1, region("Monday")),
        band(1, region("Tuesday")),
        band(1, region("Wednesday")),
      ),
      page(
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
      page(
        band(1, region("Mon"), region("Tue"), region("Wed")),
        ...Array.from({ length: 5 }, () => band(3, ...blanks(3))),
      ),
      page(
        band(1, region("Thu"), region("Fri"), region("Sat"), region("Sun")),
        ...Array.from({ length: 5 }, () => band(3, ...blanks(4))),
      ),
    ],
  },
];
