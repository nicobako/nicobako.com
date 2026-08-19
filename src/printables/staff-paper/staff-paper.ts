// Staff-paper geometry and the fixed set of sheets that get a page.
//
// This module holds numbers only — no markup. Every sheet is a named, hand-picked
// preset: nothing here is configured in the browser, so all of it resolves at build
// time and the pages ship no JavaScript beyond `window.print()`.

/** The dimensions that define how one page of staff paper looks. */
export interface StaffGeometry {
  /** Staves printed on the page. */
  staves: number;
  /** Gap between adjacent lines *within* one five-line staff, in millimetres. */
  lineSpacingMm: number;
  /** Stroke width of each staff line, in millimetres. */
  lineThicknessMm: number;
}

/** A staff size: geometry plus the words and URL segment that go with it. */
export interface StaffSize extends StaffGeometry {
  /** URL segment under `/printables/blank-sheet-music`. */
  slug: string;
  /** Label shown in the picker and the page title. */
  name: string;
  /** One line of prose about who the size suits. */
  description: string;
}

// A4 portrait. The page box is rendered at its true physical size (mm), so screen
// preview and print output are identical — margins live entirely in `.sp-page`
// padding rather than in `@page`, which stays fixed.
export const PAGE_WIDTH_MM = 210;
export const PAGE_HEIGHT_MM = 297;

/** Margin on all four sides. Fixed rather than configurable, like everything here. */
export const PAGE_MARGIN_MM = 15;

export const LINES_PER_STAFF = 5;

/**
 * Every staff size that gets pages, largest staves first. Kept deliberately short:
 * each size is generated once per page count below, and the whole site is precached
 * by the service worker, so this list trades directly against install size.
 *
 * Line spacing is the rastral size — roughly 1.75mm for engraved music, wider for
 * hand-written practice paper. The staff count is chosen to suit it; the gap between
 * staves is then derived so the staves fill the printable area exactly.
 */
export const SIZES: StaffSize[] = [
  {
    slug: "beginner",
    name: "Beginner",
    description: "Oversized staves with plenty of room to write between them.",
    staves: 6,
    lineSpacingMm: 3,
    lineThicknessMm: 0.3,
  },
  {
    slug: "large",
    name: "Large",
    description: "Wide staves, comfortable for pencil and eraser work.",
    staves: 8,
    lineSpacingMm: 2.5,
    lineThicknessMm: 0.3,
  },
  {
    slug: "standard",
    name: "Standard",
    description: "Engraving size — the usual manuscript page.",
    staves: 12,
    lineSpacingMm: 1.75,
    lineThicknessMm: 0.25,
  },
  {
    slug: "compact",
    name: "Compact",
    description: "Tight staves for sketching a long passage on one page.",
    staves: 16,
    lineSpacingMm: 1.4,
    lineThicknessMm: 0.2,
  },
];

/**
 * Page counts each size is generated in. Two is the double-sided variant: printed
 * duplex it fills both faces of a single sheet of paper, which is the only reason a
 * second page is worth its own route — anything more is the print dialog's copy count.
 */
export const PAGE_COUNTS = [1, 2];

/** One generated page: a staff size printed a given number of times. */
export interface Sheet {
  size: StaffSize;
  pages: number;
}

/** The cross product — every size in every page count, and nothing else. */
export const SHEETS: Sheet[] = SIZES.flatMap((size) =>
  PAGE_COUNTS.map((pages) => ({ size, pages })),
);

/**
 * The sheet shown at the bare `/printables/blank-sheet-music` path. Every other sheet
 * lives under it, the same way the calendars put the build year at their bare path.
 */
export const DEFAULT_SHEET: Sheet = sheetFor("standard", 1);

/** The one entry in `SHEETS` with this size and page count. */
export function sheetFor(sizeSlug: string, pages: number): Sheet {
  return SHEETS.find((sheet) => sheet.size.slug === sizeSlug && sheet.pages === pages)!;
}

/** Whether a sheet is the one at the bare path. Compared by value, not identity. */
export function isDefaultSheet(sheet: Sheet): boolean {
  return sheet.size.slug === DEFAULT_SHEET.size.slug && sheet.pages === DEFAULT_SHEET.pages;
}

/** URL segment for a sheet — `compact`, `compact-2-pages`. */
export function sheetSlug(sheet: Sheet): string {
  return sheet.pages === 1 ? sheet.size.slug : `${sheet.size.slug}-${sheet.pages}-pages`;
}

/** URL for a sheet. The default keeps the bare path so existing links still resolve. */
export function sheetHref(sheet: Sheet): string {
  const basePath = "/printables/blank-sheet-music";
  return isDefaultSheet(sheet) ? `${basePath}/` : `${basePath}/${sheetSlug(sheet)}/`;
}

/** The sheets that need a `[sheet]` page — all of them except the one at the bare path. */
export function subPageSheets(): Sheet[] {
  return SHEETS.filter((sheet) => !isDefaultSheet(sheet));
}

/** Name of a sheet for titles — "Compact", "Compact, 2 pages". */
export function sheetName(sheet: Sheet): string {
  return sheet.pages === 1 ? sheet.size.name : `${sheet.size.name}, ${sheet.pages} pages`;
}

/**
 * Height of one staff, top edge of the first line to bottom edge of the last —
 * four gaps plus the thickness of the final line.
 */
export function staffHeightMm(geometry: StaffGeometry): number {
  return (LINES_PER_STAFF - 1) * geometry.lineSpacingMm + geometry.lineThicknessMm;
}

/**
 * Gap between one staff and the next, derived so the staves span the printable area
 * exactly. Deriving it rather than declaring it is what lets a preset be written as
 * "twelve staves this big" and still print a page with no ragged space at the foot.
 */
export function staffGapMm(geometry: StaffGeometry): number {
  const contentHeightMm = PAGE_HEIGHT_MM - PAGE_MARGIN_MM * 2;
  const inkMm = geometry.staves * staffHeightMm(geometry);
  return (contentHeightMm - inkMm) / (geometry.staves - 1);
}

/** Formats a millimetre measurement for display (10mm, 1.75mm, 0.25mm). */
export function formatMm(valueMm: number): string {
  return `${Number(valueMm.toFixed(2))}mm`;
}

/** What the sheet prints on, for the intro line. */
export function describePaper(sheet: Sheet): string {
  return sheet.pages === 1
    ? "Fits one A4 page — ask for more copies in the print dialog."
    : `${sheet.pages} identical A4 pages — print double-sided to fill one sheet of paper.`;
}

/** The measurements of a sheet, for the line of small print under the intro. */
export function describeSheet(sheet: Sheet): string {
  const { size } = sheet;
  const staveWord = size.staves === 1 ? "staff" : "staves";
  return `${size.staves} ${staveWord} per page · ${formatMm(staffHeightMm(size))} staff height · ${formatMm(staffGapMm(size))} between staves.`;
}
