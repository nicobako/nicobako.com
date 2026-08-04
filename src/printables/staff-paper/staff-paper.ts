// Pure staff-paper layout maths for the Printables blank sheet music page.
//
// This module holds numbers only — no markup. The staves are written declaratively
// in `blank-sheet-music.astro` and every dimension is applied through CSS custom
// properties, so changing a control restyles the existing DOM instead of rebuilding it.

export interface StaffPaperOptions {
  /** Number of pages to generate. */
  pages: number;
  /** Left page margin, in millimetres. */
  leftMarginMm: number;
  /** Right page margin, in millimetres. */
  rightMarginMm: number;
  /** Gap between adjacent lines *within* one five-line staff, in millimetres. */
  lineSpacingMm: number;
  /** Gap between the bottom line of one staff and the top line of the next, in millimetres. */
  staffSpacingMm: number;
  /** Stroke width of each staff line, in millimetres. */
  lineThicknessMm: number;
}

/**
 * Range of every control on the page. The `.astro` template spreads these onto the
 * `<input>` elements and the client script clamps against them, so the bounds are
 * declared exactly once.
 */
export const CONTROLS = {
  pages: { min: 1, max: 50, step: 1 },
  leftMarginMm: { min: 0, max: 40, step: 1 },
  rightMarginMm: { min: 0, max: 40, step: 1 },
  lineSpacingMm: { min: 1, max: 8, step: 0.25 },
  staffSpacingMm: { min: 4, max: 40, step: 1 },
  lineThicknessMm: { min: 0.1, max: 1, step: 0.05 },
} as const;

export const DEFAULT_OPTIONS: StaffPaperOptions = {
  pages: 1,
  leftMarginMm: 15,
  rightMarginMm: 15,
  lineSpacingMm: 1.75,
  staffSpacingMm: 10,
  lineThicknessMm: 0.25,
};

// A4 portrait. The page box is rendered at its true physical size (mm), so screen
// preview and print output are identical — margins live entirely in `.sp-page`
// padding rather than in `@page`, which stays fixed.
export const PAGE_WIDTH_MM = 210;
export const PAGE_HEIGHT_MM = 297;

// Top/bottom margin is fixed rather than user-configurable, matching the page's scope
// (left/right margin, spacing, thickness, and page count only).
export const PAGE_MARGIN_MM = 15;

export const LINES_PER_STAFF = 5;

/**
 * Height of one staff, top edge of the first line to bottom edge of the last —
 * four gaps plus the thickness of the final line.
 */
export function staffHeightMm(options: StaffPaperOptions): number {
  return (LINES_PER_STAFF - 1) * options.lineSpacingMm + options.lineThicknessMm;
}

/** How many staves fit in the printable area at the given spacing. */
export function stavesPerPage(options: StaffPaperOptions): number {
  const contentHeightMm = PAGE_HEIGHT_MM - PAGE_MARGIN_MM * 2;
  // The last staff on a page needs no trailing gap, so lend one to the numerator.
  const strideMm = staffHeightMm(options) + options.staffSpacingMm;
  return Math.max(1, Math.floor((contentHeightMm + options.staffSpacingMm) / strideMm));
}

/**
 * The most staves that can ever fit on one page — reached at the tightest setting
 * every control allows. Each page carries exactly this many staves in the markup;
 * CSS then clips the page's content box to a whole number of staves, so the ones
 * that do not fit at the current spacing are hidden without any DOM being rebuilt.
 */
export const MAX_STAVES_PER_PAGE = stavesPerPage({
  ...DEFAULT_OPTIONS,
  lineSpacingMm: CONTROLS.lineSpacingMm.min,
  staffSpacingMm: CONTROLS.staffSpacingMm.min,
  lineThicknessMm: CONTROLS.lineThicknessMm.min,
});

/** Formats a millimetre measurement for the on-screen controls (10mm, 1.75mm, 0.25mm). */
export function formatMm(valueMm: number): string {
  return `${Number(valueMm.toFixed(2))}mm`;
}

/** Human-readable summary of what will print, for the on-screen controls. */
export function describeSheet(options: StaffPaperOptions): string {
  const perPage = stavesPerPage(options);
  const staveWord = perPage === 1 ? "staff" : "staves";
  const pageWord = options.pages === 1 ? "page" : "pages";
  const total = perPage * options.pages;
  return `${perPage} ${staveWord} per page × ${options.pages} ${pageWord} = ${total} staves total.`;
}
