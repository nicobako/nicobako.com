// Pure staff-paper layout logic shared by the Printables blank sheet music page.
//
// Every value this module interpolates is a plain number, so render functions simply
// return HTML strings with no injection surface — safe to use both for the server
// render (via `set:html`) and for live client re-renders.

export interface StaffPaperOptions {
  /** Number of pages to generate. */
  pages: number;
  /** Left page margin, in millimetres. */
  leftMarginMm: number;
  /** Right page margin, in millimetres. */
  rightMarginMm: number;
  /** Gap between the bottom line of one staff and the top line of the next, in millimetres. */
  lineSpacingMm: number;
}

export const DEFAULT_OPTIONS: StaffPaperOptions = {
  pages: 1,
  leftMarginMm: 15,
  rightMarginMm: 15,
  lineSpacingMm: 10,
};

// A4 portrait. The page box is rendered at its true physical size (mm), so screen
// preview and print output are identical — margins live entirely in `.sp-page`
// padding rather than in `@page`, which stays fixed.
export const PAGE_WIDTH_MM = 210;
export const PAGE_HEIGHT_MM = 297;

// Top/bottom margin is fixed rather than user-configurable, matching the task's scope
// (left/right margin, staff spacing, and page count only).
const PAGE_MARGIN_MM = 15;

// Distance between the 5 lines within one staff — standard manuscript proportions,
// not exposed as a control. "Space between lines" in the UI refers to the gap
// *between* staves, which is what actually determines how much fits on a page.
const STAFF_LINE_GAP_MM = 1.75;
const STAFF_HEIGHT_MM = STAFF_LINE_GAP_MM * 4;

/** How many staves fit in the printable area at the given inter-staff spacing. */
export function stavesPerPage(lineSpacingMm: number): number {
  const contentHeightMm = PAGE_HEIGHT_MM - PAGE_MARGIN_MM * 2;
  const strideMm = STAFF_HEIGHT_MM + lineSpacingMm;
  return Math.max(1, Math.floor((contentHeightMm + lineSpacingMm) / strideMm));
}

function renderStaffHTML(marginBottomMm: number): string {
  const lines = Array.from(
    { length: 5 },
    (_, i) => `<span class="sp-line" style="top:${(i * STAFF_LINE_GAP_MM).toFixed(2)}mm"></span>`,
  ).join("");
  return `<div class="sp-staff" style="height:${STAFF_HEIGHT_MM}mm;margin-bottom:${marginBottomMm}mm">${lines}</div>`;
}

function renderStaffPaperPageHTML(options: StaffPaperOptions, count: number): string {
  const staves = Array.from({ length: count }, (_, i) =>
    renderStaffHTML(i === count - 1 ? 0 : options.lineSpacingMm),
  ).join("");
  const padding = `${PAGE_MARGIN_MM}mm ${options.rightMarginMm}mm ${PAGE_MARGIN_MM}mm ${options.leftMarginMm}mm`;
  return `<div class="sp-page" style="padding:${padding}">${staves}</div>`;
}

/** Renders `options.pages` full pages of blank staves as a single HTML string. */
export function renderStaffPaperHTML(options: StaffPaperOptions): string {
  const count = stavesPerPage(options.lineSpacingMm);
  return Array.from({ length: options.pages }, () => renderStaffPaperPageHTML(options, count)).join("");
}

/** Human-readable summary of what will print, for the on-screen controls. */
export function describeSheet(options: StaffPaperOptions): string {
  const perPage = stavesPerPage(options.lineSpacingMm);
  const staveWord = perPage === 1 ? "staff" : "staves";
  const pageWord = options.pages === 1 ? "page" : "pages";
  const total = perPage * options.pages;
  return `${perPage} ${staveWord} per page × ${options.pages} ${pageWord} = ${total} staves total.`;
}
