// Paper size reference data.
//
// Numbers only — no markup. Every size here is a fixed, published standard, so all of
// it resolves at build time and the reference page ships no JavaScript.
//
// Each size is declared in the unit its own standard is written in (ISO sizes in
// millimetres, North American sizes in inches) and the other unit is derived, so the
// table shows one exact figure and one conversion rather than two roundings.
//
// This is a quick reference, not a catalogue: the lists are deliberately short. A size
// earns a row only if someone is plausibly holding it or asking for it.

const MM_PER_INCH = 25.4;

export interface PaperSize {
  /** Stable id, used as a key. */
  slug: string;
  /** Name as the standard writes it. */
  name: string;
  widthMm: number;
  heightMm: number;
  widthIn: number;
  heightIn: number;
  /** One short line about where the size is used. Optional. */
  note?: string;
}

/** A size defined in millimetres (the ISO series). */
function mm(
  slug: string,
  name: string,
  widthMm: number,
  heightMm: number,
  note?: string,
): PaperSize {
  return {
    slug,
    name,
    widthMm,
    heightMm,
    widthIn: widthMm / MM_PER_INCH,
    heightIn: heightMm / MM_PER_INCH,
    note,
  };
}

/** A size defined in inches (the North American sizes). */
function inch(
  slug: string,
  name: string,
  widthIn: number,
  heightIn: number,
  note?: string,
): PaperSize {
  return {
    slug,
    name,
    widthMm: widthIn * MM_PER_INCH,
    heightMm: heightIn * MM_PER_INCH,
    widthIn,
    heightIn,
    note,
  };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** Round to `digits` and drop trailing zeros, so 215.90 prints as "215.9". */
function trim(value: number, digits: number): string {
  return Number(value.toFixed(digits)).toString();
}

export function formatMm(size: PaperSize): string {
  return `${trim(size.widthMm, 1)} × ${trim(size.heightMm, 1)}`;
}

export function formatIn(size: PaperSize): string {
  return `${trim(size.widthIn, 2)} × ${trim(size.heightIn, 2)}`;
}

/** Long side ÷ short side — the number that decides how a page *feels*. */
export function formatRatio(size: PaperSize): string {
  return `1 : ${trim(size.heightMm / size.widthMm, 3)}`;
}

// ---------------------------------------------------------------------------
// The sizes
// ---------------------------------------------------------------------------

/** ISO 216 A series. A0 is one square metre; each step halves the one before. */
export const A_SERIES: PaperSize[] = [
  mm("a0", "A0", 841, 1189, "Full-size posters, plots. Exactly 1 m²."),
  mm("a1", "A1", 594, 841, "Posters, flip charts."),
  mm("a2", "A2", 420, 594, "Large drawings, mid-size posters."),
  mm("a3", "A3", 297, 420, "Two A4s side by side."),
  mm("a4", "A4", 210, 297, "The office page everywhere but North America."),
  mm("a5", "A5", 148, 210, "Notebooks, paperbacks, flyers."),
  mm("a6", "A6", 105, 148, "Postcards, pocket notebooks."),
  mm("a7", "A7", 74, 105, "Index cards, tickets."),
  mm("a8", "A8", 52, 74, "Card-sized."),
];

/** ISO 216 B series — the geometric mean between two A sizes. */
export const B_SERIES: PaperSize[] = [
  mm("b1", "B1", 707, 1000, "The standard European poster."),
  mm("b4", "B4", 250, 353, "Between A4 and A3."),
  mm("b5", "B5", 176, 250, "Books and academic journals."),
  mm("b6", "B6", 125, 176, "Paperbacks, notebooks."),
  mm("b7", "B7", 88, 125, "Passport size."),
];

/** ISO 269 C series — envelopes. C*n* holds an unfolded A*n*. */
export const C_SERIES: PaperSize[] = [
  mm("c4", "C4", 229, 324, "Holds an unfolded A4."),
  mm("c5", "C5", 162, 229, "Holds A4 folded once."),
  mm("c65", "C6/C5", 114, 229, "Holds A4 folded in three."),
  mm("c6", "C6", 114, 162, "Holds A4 folded twice, or an unfolded A6."),
  mm("dl", "DL", 110, 220, "The everyday European business envelope."),
];

/** The loose (cut-sheet) North American sizes. */
export const NORTH_AMERICAN: PaperSize[] = [
  inch(
    "tabloid",
    "Tabloid / Ledger",
    11,
    17,
    "Tabloid portrait, Ledger landscape.",
  ),
  inch("legal", "Legal", 8.5, 14, "Long and narrow; US legal filings."),
  inch("letter", "Letter", 8.5, 11, "The office page in the US and Canada."),
  inch("executive", "Executive", 7.25, 10.5, "Letterhead and stationery."),
  inch(
    "half-letter",
    "Half Letter",
    5.5,
    8.5,
    "Letter folded in half; digest books.",
  ),
  inch("junior-legal", "Junior Legal", 5, 8, "The legal pad."),
  inch(
    "us-envelope-10",
    "No. 10 envelope",
    4.125,
    9.5,
    "Holds Letter folded in three.",
  ),
];

/** Cards — index, business, and the one in your wallet that makes a good ruler. */
export const CARDS: PaperSize[] = [
  inch("index-5x8", "Index 5 × 8", 5, 8),
  inch("index-4x6", "Index 4 × 6", 4, 6, "Recipe and Zettelkasten card."),
  inch("index-3x5", "Index 3 × 5", 3, 5, "The classic index card."),
  inch("photo-4x6", "Photo 4 × 6", 4, 6, "Same sheet as the 4 × 6 card."),
  mm(
    "meishi",
    "Business card (JP)",
    91,
    55,
    "Meishi — the largest of the three.",
  ),
  mm("eu-card", "Business card (EU)", 85, 55),
  inch("us-card", "Business card (US)", 3.5, 2),
  mm(
    "id-1",
    "ID-1 credit card",
    85.6,
    54,
    "ISO/IEC 7810; the handiest real-world ruler.",
  ),
];

// ---------------------------------------------------------------------------
// Overlay sets — each is drawn stacked from a shared corner, largest first.
// ---------------------------------------------------------------------------

/** A0 down to A6: enough steps to show the halving without the labels colliding. */
export const OVERLAY_A_SERIES = A_SERIES.slice(0, 7);

/** The everyday sheets, so A4 and Letter can finally be compared directly. */
export const OVERLAY_EVERYDAY: PaperSize[] = [
  NORTH_AMERICAN[0]!, // Tabloid
  A_SERIES[3]!, // A3
  NORTH_AMERICAN[1]!, // Legal
  A_SERIES[4]!, // A4
  NORTH_AMERICAN[2]!, // Letter
];

/** The small end, anchored on the credit card. */
export const OVERLAY_CARDS: PaperSize[] = [
  A_SERIES[5]!, // A5
  CARDS[0]!, // 5 x 8
  A_SERIES[6]!, // A6
  CARDS[1]!, // 4 x 6
  CARDS[2]!, // 3 x 5
  A_SERIES[7]!, // A7
  CARDS[7]!, // ID-1
];
