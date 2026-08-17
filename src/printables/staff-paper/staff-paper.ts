// Staff-paper geometry and the fixed set of sheets that get a page.
//
// This module holds numbers only — no markup. Every sheet is a named, hand-picked
// preset: nothing here is configured in the browser, so all of it resolves at build
// time and the pages ship no JavaScript beyond `window.print()`.

/** The dimensions that define how one sheet of staff paper looks. */
export interface StaffGeometry {
  /** Staves printed on the page. */
  staves: number;
  /** Gap between adjacent lines *within* one five-line staff, in millimetres. */
  lineSpacingMm: number;
  /** Stroke width of each staff line, in millimetres. */
  lineThicknessMm: number;
}

/** A staff-paper preset: geometry plus the words and URL that go with it. */
export interface Sheet extends StaffGeometry {
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
 * Every sheet that gets a page, largest staves first. Kept deliberately short: each
 * entry is a real generated page and the whole site is precached by the service
 * worker, so the list trades directly against install size.
 *
 * Line spacing is the rastral size — roughly 1.75mm for engraved music, wider for
 * hand-written practice paper. The staff count is chosen to suit it; the gap between
 * staves is then derived so the staves fill the printable area exactly.
 */
export const SHEETS: Sheet[] = [
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
 * The sheet shown at the bare `/printables/blank-sheet-music` path. Every other sheet
 * lives under it, the same way the calendars put the build year at their bare path.
 */
export const DEFAULT_SHEET: Sheet = SHEETS.find((sheet) => sheet.slug === "standard")!;

/** The sheets that need a `[sheet]` page — all of them except the one at the bare path. */
export function subPageSheets(): Sheet[] {
  return SHEETS.filter((sheet) => sheet !== DEFAULT_SHEET);
}

/** URL for a sheet. The default keeps the bare path so existing links still resolve. */
export function sheetHref(sheet: Sheet): string {
  const basePath = "/printables/blank-sheet-music";
  return sheet === DEFAULT_SHEET ? `${basePath}/` : `${basePath}/${sheet.slug}/`;
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

/** The measurements of a sheet, for the line of small print under the intro. */
export function describeSheet(sheet: Sheet): string {
  const staveWord = sheet.staves === 1 ? "staff" : "staves";
  return `${sheet.staves} ${staveWord} · ${formatMm(staffHeightMm(sheet))} staff height · ${formatMm(staffGapMm(sheet))} between staves.`;
}
