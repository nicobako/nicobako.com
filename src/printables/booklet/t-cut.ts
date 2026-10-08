// The T-cut booklet: sixteen pages from one side of one sheet of paper.
//
// The sheet is folded into a 4 × 4 grid of panels, eight of the panel edges are
// cut, and what is left is a single ring of sixteen panels that collapses into a
// booklet with no staples. Printing is one-sided: every panel's back is blank,
// and each leaf of the booklet is two panels folded blank side to blank side.
//
// Only the page layout is declared. Which edges are folds, which are cuts, and
// which way each fold goes all follow from it, because the ring runs through the
// pages in reading order:
//
// - two panels side by side on the sheet are joined exactly when their pages are
//   consecutive (16 and 1 count as consecutive: the covers meet at the spine);
//   every other shared edge is cut;
// - an odd page and the even page after it are the two sides of one leaf, folded
//   with the printing outside — a mountain fold, seen from the printed side;
// - an even page and the odd page after it face each other across a spread, so
//   the printing goes inside — a valley fold. The exception is the covers, which
//   fold round the outside of the booklet, so 16 → 1 is a mountain again.
//
// Working through every way sixteen pages can be laid on a 4 × 4 sheet under
// those rules, there is only one set of cuts, up to where page 1 sits. Folded in
// half along the middle, it is the T the booklet is named for — up the centre
// from the folded edge, then along the middle crease across the centre two
// panels — plus a snip along the fold, one panel in from each side edge.
//
// This module holds numbers only; `TCutBooklet.astro` turns them into a sheet.

export const ROWS = 4;
export const COLUMNS = 4;

/** One panel of the sheet. */
export interface Panel {
  /** Booklet page printed in this panel, 1–16. */
  page: number;
  /** Whether the page is printed upside down on the sheet. */
  inverted: boolean;
  row: number;
  column: number;
}

/**
 * The page layout, row by row from the top of the sheet. A minus sign marks a
 * page printed upside down. The front cover sits bottom right, upright, with the
 * back cover beside it — the same corner the eight-page mini zine puts it in.
 */
const LAYOUT: number[][] = [
  [-9, -8, -7, -6],
  [10, 11, 4, 5],
  [-13, -12, -3, -2],
  [14, 15, 16, 1],
];

export const PANELS: Panel[] = LAYOUT.flatMap((cells, row) =>
  cells.map((cell, column) => ({
    page: Math.abs(cell),
    inverted: cell < 0,
    row,
    column,
  })),
);

/** An interior edge between two panels, in grid units from the top left. */
export interface Edge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  kind: "cut" | "mountain" | "valley";
}

const PAGE_COUNT = ROWS * COLUMNS;

function next(page: number): number {
  return (page % PAGE_COUNT) + 1;
}

function at(row: number, column: number): Panel {
  return PANELS[row * COLUMNS + column];
}

// A layout that does not form the ring cannot be folded, so a mistake in
// `LAYOUT` fails the build instead of printing a sheet that will not close.
function fail(a: Panel, b: Panel, why: string): never {
  throw new Error(`T-cut layout: pages ${a.page} and ${b.page} ${why}`);
}

/**
 * Classifies the edge between two neighbouring panels, `b` being to the right
 * of `a` or below it.
 */
function classify(a: Panel, b: Panel, sideBySide: boolean): Edge["kind"] {
  const [from, to] =
    next(a.page) === b.page ? [a, b] : next(b.page) === a.page ? [b, a] : [];
  if (!from || !to) return "cut";
  const leaf = from.page % 2 === 1;
  if (sideBySide) {
    // Folding across a vertical line keeps a page the right way up, and the
    // next page always lies further along the line of reading: to the right of
    // an upright page, to the left of an upside-down one.
    if (a.inverted !== b.inverted) fail(a, b, "are side by side but face opposite ways");
    if ((to === b) === from.inverted) fail(a, b, "are side by side in the wrong order");
  } else {
    // Folding across a horizontal line turns a page upside down, and is only
    // ever the head or foot of a leaf: a spine always runs down the page.
    if (a.inverted === b.inverted) fail(a, b, "are stacked but face the same way");
    if (!leaf) fail(a, b, "would meet at the spine across a horizontal fold");
  }
  return leaf || to.page === 1 ? "mountain" : "valley";
}

/** Every interior edge of the grid: the folds and the cuts. */
export const EDGES: Edge[] = PANELS.flatMap(({ row, column }) => [
  ...(column + 1 < COLUMNS
    ? [
        {
          x1: column + 1,
          y1: row,
          x2: column + 1,
          y2: row + 1,
          kind: classify(at(row, column), at(row, column + 1), true),
        },
      ]
    : []),
  ...(row + 1 < ROWS
    ? [
        {
          x1: column,
          y1: row + 1,
          x2: column + 1,
          y2: row + 1,
          kind: classify(at(row, column), at(row + 1, column), false),
        },
      ]
    : []),
]);

// Sixteen folds and eight cuts is a single ring: with every page joined to both
// of its neighbours in reading order, nothing is loose and nothing is closed.
const folds = EDGES.filter((edge) => edge.kind !== "cut").length;
if (folds !== PAGE_COUNT) {
  throw new Error(`T-cut layout: ${folds} folds, where a ring needs ${PAGE_COUNT}`);
}
