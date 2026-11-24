// The paper a planner sheet is printed on, as data.
//
// The whole section rests on one arrangement, not on one paper size: a sheet
// is printed landscape, cut once down the middle, and both halves are punched
// along that cut. A page punched on its *right* edge hangs to the left of the
// rings, so the two halves of a sheet face each other in the binder and the
// sheet is read as the spread it was laid out as. That is why
//
//   - a page's margins mirror: the gutter is the hole edge on both halves, and
//     it is the inner edge of the left page and of the right page both;
//   - the cut is drawn down the centre, because a miss costs the holes.
//
// Everything that depends on the size of the paper lives in a `SheetFormat`,
// so another size is another entry here and nothing else. `PlannerSpread`
// turns the chosen one into CSS custom properties; the pages never see
// millimetres, and the parts in `components/paper/` are sized in `em` off the
// format's own body size, so they fit whatever page they are put on.
//
// What a *page* holds is still a judgement: twenty ruled lines fit an A5 page
// and crowd a B6 one. A layout that no longer fits shows itself — see
// `PlannerSpread`'s note on overflow — rather than being quietly clipped.

export interface SheetMargins {
  /** The hole edge, at the cut. Wide enough that a punch cannot eat writing. */
  gutter: number;
  /** The sheet edge. Most printers cannot reach the last few millimetres. */
  outer: number;
  top: number;
  bottom: number;
}

export interface SheetFormat {
  /** What the sheet is called, for a page that wants to say so. */
  label: string;
  /** The whole sheet, landscape, in mm. */
  width: number;
  height: number;
  /** Pages across the sheet. Two is a spread; one is the sheet itself. */
  columns: number;
  /** Body size on a page, in mm. Everything else is `em` off this. */
  baseFont: number;
  margins: SheetMargins;
}

/**
 * How far into the page a hole can reach, measured from the cut: a Japanese
 * 20-hole punch and a 6-ring punch both centre a ~6 mm hole about 6 mm in. The
 * spare millimetres are for cutting slightly off the line. This is a property
 * of the punch, not of the paper, so it is the same for every format.
 */
export const PUNCH_DEPTH = 12;

/** The margins a bound page wants, whatever size it is. */
const BOUND_MARGINS: SheetMargins = {
  gutter: 16,
  outer: 8,
  top: 9,
  bottom: 9,
};

/**
 * The sheets there are. A4 is the one the section was built for; the others
 * are here because the arrangement does not care, and swapping a sheet is a
 * one-word change on the page that uses it.
 */
export const SHEETS = {
  /** A4 landscape, cut into two A5 pages. */
  a4: {
    label: "A4",
    width: 297,
    height: 210,
    columns: 2,
    baseFont: 3.3,
    margins: BOUND_MARGINS,
  },
  /** US Letter landscape, cut into two half-letter pages. */
  letter: {
    label: "Letter",
    width: 279.4,
    height: 215.9,
    columns: 2,
    baseFont: 3.3,
    margins: BOUND_MARGINS,
  },
  /** B5 landscape, cut into two B6 pages — a smaller page, so smaller type. */
  b5: {
    label: "B5",
    width: 250,
    height: 176,
    columns: 2,
    baseFont: 2.9,
    margins: { ...BOUND_MARGINS, top: 7, bottom: 7 },
  },
} as const satisfies Record<string, SheetFormat>;

export type SheetName = keyof typeof SHEETS;

/** The sheet a page gets if it doesn't ask for one. */
export const DEFAULT_SHEET: SheetFormat = SHEETS.a4;

/** One page of a sheet, in mm: the paper divided, margins still on. */
export function panel(sheet: SheetFormat): { width: number; height: number } {
  return { width: sheet.width / sheet.columns, height: sheet.height };
}

/** The area a page actually has to write in, in mm. */
export function writable(sheet: SheetFormat): { width: number; height: number } {
  const { width, height } = panel(sheet);
  return {
    width: width - sheet.margins.gutter - sheet.margins.outer,
    height: height - sheet.margins.top - sheet.margins.bottom,
  };
}

/**
 * Check a format before it is printed. A gutter narrower than the punch would
 * put holes through writing, and a page with no room left is not a page; both
 * are worth failing the build over rather than discovering on paper.
 */
export function checkSheet(sheet: SheetFormat): void {
  if (sheet.margins.gutter < PUNCH_DEPTH) {
    throw new Error(
      `${sheet.label}: gutter (${sheet.margins.gutter} mm) is narrower than the punch reaches (${PUNCH_DEPTH} mm)`,
    );
  }
  const area = writable(sheet);
  if (area.width <= 0 || area.height <= 0) {
    throw new Error(`${sheet.label}: margins leave no room to write`);
  }
}
