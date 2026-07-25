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
  /** Gap between adjacent lines *within* one five-line staff, in millimetres. */
  lineSpacingMm: number;
  /** Gap between the bottom line of one staff and the top line of the next, in millimetres. */
  staffSpacingMm: number;
  /** Stroke width of each staff line, in millimetres. */
  lineThicknessMm: number;
}

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

// Top/bottom margin is fixed rather than user-configurable, matching the task's scope
// (left/right margin, spacing, thickness, and page count only).
const PAGE_MARGIN_MM = 15;

const LINES_PER_STAFF = 5;

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

/** Formats a millimetre measurement for the on-screen controls (10mm, 1.75mm, 0.25mm). */
export function formatMm(valueMm: number): string {
  return `${Number(valueMm.toFixed(2))}mm`;
}

function renderStaffHTML(options: StaffPaperOptions, marginBottomMm: number): string {
  // Lines are drawn as borders rather than backgrounds so they survive printing
  // with "background graphics" disabled — see the print rules in the page's CSS.
  const lines = Array.from(
    { length: LINES_PER_STAFF },
    (_, i) =>
      `<span class="sp-line" style="top:${(i * options.lineSpacingMm).toFixed(3)}mm;border-top-width:${options.lineThicknessMm}mm"></span>`,
  ).join("");
  const height = staffHeightMm(options).toFixed(3);
  return `<div class="sp-staff" style="height:${height}mm;margin-bottom:${marginBottomMm}mm">${lines}</div>`;
}

function renderStaffPaperPageHTML(options: StaffPaperOptions, count: number): string {
  const staves = Array.from({ length: count }, (_, i) =>
    renderStaffHTML(options, i === count - 1 ? 0 : options.staffSpacingMm),
  ).join("");
  const padding = `${PAGE_MARGIN_MM}mm ${options.rightMarginMm}mm ${PAGE_MARGIN_MM}mm ${options.leftMarginMm}mm`;
  return `<div class="sp-page" style="padding:${padding}">${staves}</div>`;
}

/** Renders `options.pages` full pages of blank staves as a single HTML string. */
export function renderStaffPaperHTML(options: StaffPaperOptions): string {
  const count = stavesPerPage(options);
  return Array.from({ length: options.pages }, () => renderStaffPaperPageHTML(options, count)).join("");
}

/** Human-readable summary of what will print, for the on-screen controls. */
export function describeSheet(options: StaffPaperOptions): string {
  const perPage = stavesPerPage(options);
  const staveWord = perPage === 1 ? "staff" : "staves";
  const pageWord = options.pages === 1 ? "page" : "pages";
  const total = perPage * options.pages;
  return `${perPage} ${staveWord} per page × ${options.pages} ${pageWord} = ${total} staves total.`;
}
