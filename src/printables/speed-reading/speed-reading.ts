// Pure layout logic for the speed-reading practice sheet.
//
// Same contract as the calendar module: no DOM access, no side effects at import.
// The render function returns an HTML string, so the page can render it on the server
// (via `set:html`) and re-render it in the browser on every control change with the
// exact same code path.
//
// The drill this lays out comes from "Triple Your Reading Speed": instead of tracking
// along a line word by word, the eye fixes once on the centre of a short group of words
// and takes the whole group in at a glance, then drops straight down to the next group.
// That is why the words are set in narrow, centred columns - every line has to be short
// enough to fall inside one fixation, and the reader moves vertically, never
// horizontally.
//
// The column width is the span being trained, so it is the frame everything else obeys:
// words are packed onto a line until the next one would not fit, and there they stop.
// Group size therefore varies with the words themselves (three longs, four shorts), and
// the reader widens the column - not a word count - to ask more of their peripheral
// vision.

import { PASSAGES, RANDOM_WORDS } from "./passages.ts";

export type PageSize = "a4" | "letter";
export type Orientation = "portrait" | "landscape";

/**
 * Which way the text runs, and so which eye movement the sheet drills.
 *
 * "down" fills a whole column before starting the next, training the vertical drop that
 * the method is built around. "across" fills the first line of every column before
 * dropping to the next row, so the eye hops sideways from group to group - the same
 * fixation span, but rehearsing the horizontal jump instead.
 */
export type Flow = "down" | "across";

/** `"random"` draws from RANDOM_WORDS; any other value is a Passage id. */
export type SourceId = "random" | string;

export interface SheetOptions {
  source: SourceId;
  columns: number;
  /** Read down each column in turn, or across the row and then down. */
  flow: Flow;
  /** Width of one column, in millimetres, so it means the same on screen and on paper. */
  columnWidthMm: number;
  /** Body text size in points. Together with the column width this fixes the group size. */
  fontSizePt: number;
  /** Line height as a multiple of the font size. */
  lineSpacing: number;
  /** Draw a faint vertical rule down each column marking where the eyes should fix. */
  guide: boolean;
  pageSize: PageSize;
  orientation: Orientation;
  /** Seed for the random-word drill; changing it re-rolls the sheet. */
  seed: number;
  /**
   * Lines per column, when the sheet is not bound for paper.
   *
   * Most of the time this page is practised on, not printed, and a screen is not A4:
   * the browser passes the number of lines that fit the viewport so a block of columns
   * is one screenful, which is what makes reading *down* a column work without
   * scrolling back up. Left unset (the print path), the paper geometry decides.
   */
  columnLines?: number;
}

export const DEFAULT_OPTIONS: SheetOptions = {
  source: "random",
  columns: 2,
  flow: "down",
  columnWidthMm: 45,
  fontSizePt: 13,
  lineSpacing: 1.9,
  guide: true,
  pageSize: "a4",
  orientation: "portrait",
  seed: 1,
};

/** Printable page dimensions in millimetres, portrait-oriented. */
const PAGE_MM: Record<PageSize, { width: number; height: number }> = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
};

/** Must stay in step with the `@page` margin the page injects when printing. */
export const PAGE_MARGIN_MM = 15;

const MM_PER_PT = 25.4 / 72;
const PT_PER_PX = 72 / 96;

export function pageBoxMm(size: PageSize, orientation: Orientation) {
  const { width, height } = PAGE_MM[size];
  return orientation === "landscape"
    ? { width: height, height: width }
    : { width, height };
}

/**
 * How many lines fit down one column on a single sheet of paper.
 *
 * Deriving this from the page geometry (rather than letting the browser reflow) is what
 * keeps a column from being split across a page break: the renderer can slice the text
 * into exact page-sized chunks up front.
 */
export function linesPerColumn(opts: SheetOptions): number {
  if (opts.columnLines !== undefined) return Math.max(4, opts.columnLines);

  const { height } = pageBoxMm(opts.pageSize, opts.orientation);
  const usable = height - 2 * PAGE_MARGIN_MM;
  const lineHeightMm = opts.fontSizePt * opts.lineSpacing * MM_PER_PT;
  return Math.max(4, Math.floor(usable / lineHeightMm));
}

/** Deterministic PRNG, so a given seed always yields the same sheet. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function findPassage(id: string) {
  return PASSAGES.find((p) => p.id === id);
}

/**
 * Measures the rendered width of a string, in pixels, at the sheet's font size.
 *
 * Injected rather than imported so this module stays DOM-free: the browser passes a
 * canvas-backed measurer, and the server falls back to `estimateWidth` below.
 */
export type MeasureLine = (line: string) => number;

/**
 * Rough text width for the server render, where no font metrics exist.
 *
 * The average glyph in a proportional face runs a bit over half its point size wide;
 * 0.5em is close enough to produce a sensible first paint, and the browser re-wraps the
 * sheet with real measurements as soon as it loads.
 */
export function estimateWidth(fontSizePt: number): MeasureLine {
  const pxPerChar = (fontSizePt / PT_PER_PX) * 0.5;
  return (line) => line.length * pxPerChar;
}

/**
 * Pack words onto lines, greedily, until the next word would overrun the column.
 *
 * A group must never wrap - a group split over two lines is two glances, not one - so a
 * word too wide for the column on its own still gets a line to itself rather than being
 * broken.
 */
export function wrapIntoLines(
  words: string[],
  measure: MeasureLine,
  columnWidthPx: number,
): string[] {
  const lines: string[] = [];
  let current: string[] = [];

  for (const word of words) {
    const candidate = [...current, word].join(" ");
    if (current.length > 0 && measure(candidate) > columnWidthPx) {
      lines.push(current.join(" "));
      current = [word];
    } else {
      current.push(word);
    }
  }
  if (current.length > 0) lines.push(current.join(" "));

  return lines;
}

/**
 * The word stream for a sheet.
 *
 * Prose is used as written. The random drill has no natural length, so it generates a
 * generous pool - more than a page can hold at any plausible group size - which
 * `sheetLines` then trims to exactly one page.
 */
function wordsFor(opts: SheetOptions): string[] {
  if (opts.source !== "random") {
    const passage = findPassage(opts.source);
    return passage ? passage.text.split(/\s+/).filter(Boolean) : [];
  }

  const rand = mulberry32(opts.seed);
  const generousWordsPerLine = 8;
  const pool = linesPerColumn(opts) * opts.columns * generousWordsPerLine;
  return Array.from(
    { length: pool },
    () => RANDOM_WORDS[Math.floor(rand() * RANDOM_WORDS.length)]!,
  );
}

/** The lines of the finished sheet, wrapped to the column and trimmed to fit the paper. */
export function sheetLines(
  opts: SheetOptions,
  measure: MeasureLine,
  pxPerMm: number,
): string[] {
  const columnWidthPx = opts.columnWidthMm * pxPerMm;
  const lines = wrapIntoLines(wordsFor(opts), measure, columnWidthPx);

  // The random pool is deliberately oversized; keep only what one page can hold.
  if (opts.source !== "random") return lines;
  return lines.slice(0, linesPerColumn(opts) * opts.columns);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Deal one page's lines into its columns, in the order the eye will travel them.
 *
 * This is the whole of the flow setting: "down" hands each column a contiguous run of
 * lines, so reading a column top to bottom reads the text in order; "across" deals the
 * lines round-robin, so line 1 sits in column 1, line 2 in column 2, and reading the
 * row left to right reads the text in order.
 */
function dealIntoColumns(
  lines: string[],
  columns: number,
  flow: Flow,
): string[][] {
  const perColumn = Math.ceil(lines.length / columns);

  return Array.from({ length: columns }, (_, c) =>
    flow === "down"
      ? lines.slice(c * perColumn, (c + 1) * perColumn)
      : lines.filter((_line, i) => i % columns === c),
  );
}

/**
 * Render the full sheet: one `.sr-page` per printed page, each holding `columns`
 * columns of lines.
 */
export function renderSheetHTML(
  opts: SheetOptions,
  measure: MeasureLine,
  pxPerMm: number,
): string {
  const lines = sheetLines(opts, measure, pxPerMm);
  if (lines.length === 0) return `<p class="sr-empty">No text to show.</p>`;

  const perColumn = linesPerColumn(opts);
  const perPage = perColumn * opts.columns;
  const pageCount = Math.max(1, Math.ceil(lines.length / perPage));

  // No paper geometry here: on screen the sheet is just columns, and when printing the
  // `@page` box supplies the sheet and its margins.
  const style = [
    `--sr-cols:${opts.columns}`,
    `--sr-col-width:${opts.columnWidthMm}mm`,
    `--sr-font-size:${opts.fontSizePt}pt`,
    `--sr-line-spacing:${opts.lineSpacing}`,
  ].join(";");

  const classes = ["sr-sheet", opts.guide ? "sr-has-guide" : ""]
    .filter(Boolean)
    .join(" ");

  const pages: string[] = [];
  for (let p = 0; p < pageCount; p++) {
    const pageLines = lines.slice(p * perPage, (p + 1) * perPage);

    const columns = dealIntoColumns(pageLines, opts.columns, opts.flow)
      .map((colLines) => {
        const rendered = colLines
          .map((line) => `<p class="sr-line">${escapeHtml(line)}</p>`)
          .join("");
        return `<div class="sr-col">${rendered}</div>`;
      })
      .join("");

    pages.push(`<div class="sr-page">${columns}</div>`);
  }

  return `<div class="${classes}" style="${style}">${pages.join("")}</div>`;
}

/** One-line summary of the drill, shown under the controls (not printed). */
export function describeSheet(
  opts: SheetOptions,
  measure: MeasureLine,
  pxPerMm: number,
): string {
  const lines = sheetLines(opts, measure, pxPerMm);
  const perPage = linesPerColumn(opts) * opts.columns;
  const pageCount = Math.max(1, Math.ceil(lines.length / perPage));

  const words = lines.reduce((n, line) => n + line.split(" ").length, 0);
  const average = lines.length > 0 ? words / lines.length : 0;

  const source =
    opts.source === "random"
      ? "random words"
      : (findPassage(opts.source)?.title ?? "unknown");

  return `${lines.length} groups from ${source} — ${average.toFixed(1)} words per group on average, ${pageCount} page${pageCount === 1 ? "" : "s"}.`;
}
