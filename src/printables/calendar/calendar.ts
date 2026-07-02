// Pure calendar logic shared by the Printables calendar pages.
//
// This module is the single source of truth for both the server render (imported
// in an .astro frontmatter block and emitted via `set:html`) and the live client
// updates (imported inside a page `<script>`). It has no DOM dependencies — the
// render functions simply return HTML strings, and every value they interpolate is
// derived from a numeric `year`, so there is no injection surface.
//
// All week math is ISO-8601: weeks start on Monday, and week 1 is the week that
// contains the year's first Thursday (equivalently, the week containing Jan 4).

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

// Monday-first weekday abbreviations (ISO weekday 1..7 = Mon..Sun).
const WEEKDAY_ABBR = ["M", "T", "W", "R", "F", "S", "K"] as const;

const MS_PER_DAY = 86_400_000;

/** ISO weekday for a UTC date: Monday = 1 ... Sunday = 7. */
function isoWeekday(date: Date): number {
  return ((date.getUTCDay() + 6) % 7) + 1;
}

/** Zero-pad a number to two digits (ISO style): 1 -> "01", 12 -> "12". */
function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Days in a given month (0-indexed month). */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** ISO week number (1..53) for the given UTC date. */
export function isoWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  // Shift to the Thursday of this week, then count weeks from Jan 1 of that year.
  d.setUTCDate(d.getUTCDate() + 4 - isoWeekday(d));
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart) / MS_PER_DAY + 1) / 7);
}

/** The ISO week-numbering year a date belongs to (may differ from the calendar year). */
export function isoWeekYear(date: Date): number {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  d.setUTCDate(d.getUTCDate() + 4 - isoWeekday(d));
  return d.getUTCFullYear();
}

/** Number of ISO weeks (52 or 53) in a given ISO year. */
export function isoWeeksInYear(year: number): number {
  const p = (y: number) =>
    (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400)) % 7;
  return p(year) === 4 || p(year - 1) === 3 ? 53 : 52;
}

/** The Monday (UTC) that begins ISO week 1 of the given year. */
function isoWeek1Monday(year: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (isoWeekday(jan4) - 1));
  return monday;
}

export interface WeekRow {
  /** ISO week number for this row. */
  week: number;
  /** Seven cells (Mon..Sun); null for days outside the month. */
  days: (number | null)[];
}

export interface MonthGrid {
  name: string;
  weeks: WeekRow[];
}

/** Data for the standard 12-month grid, Monday-first, for a calendar year. */
export function buildYearGrid(year: number): MonthGrid[] {
  return MONTH_NAMES.map((name, month) => {
    const first = new Date(Date.UTC(year, month, 1));
    const lead = isoWeekday(first) - 1; // blank cells before day 1
    const total = daysInMonth(year, month);

    const cells: (number | null)[] = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let day = 1; day <= total; day++) cells.push(day);
    while (cells.length % 7 !== 0) cells.push(null);

    // Monday of the first grid row (may fall in the previous month).
    const firstRowMonday = new Date(first);
    firstRowMonday.setUTCDate(first.getUTCDate() - lead);

    const weeks: WeekRow[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      const rowMonday = new Date(firstRowMonday);
      rowMonday.setUTCDate(firstRowMonday.getUTCDate() + i);
      weeks.push({ week: isoWeek(rowMonday), days: cells.slice(i, i + 7) });
    }
    return { name, weeks };
  });
}

export interface BookmarkDay {
  /** Day-of-month (1..31). */
  day: number;
  /** ISO month number (1..12) this day falls in. */
  month: number;
}

export interface BookmarkRow {
  week: number;
  /** Mon..Sun of this ISO week. */
  days: BookmarkDay[];
  /** ISO month number (1..12) of this week's Sunday. */
  month: number;
}

/** One row per ISO week of the given ISO year (52 or 53 rows). */
export function buildBookmarkRows(year: number): BookmarkRow[] {
  const rows: BookmarkRow[] = [];
  const totalWeeks = isoWeeksInYear(year);
  const firstMonday = isoWeek1Monday(year);

  for (let week = 1; week <= totalWeeks; week++) {
    const monday = new Date(firstMonday);
    monday.setUTCDate(firstMonday.getUTCDate() + (week - 1) * 7);

    const days: BookmarkDay[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setUTCDate(monday.getUTCDate() + i);
      days.push({ day: d.getUTCDate(), month: d.getUTCMonth() + 1 });
    }

    // Right column tracks the month of this week's Sunday (the last day).
    rows.push({ week, days, month: days[6].month });
  }

  return rows;
}

/** HTML for the standard 12-month year grid. */
export function renderYearGridHTML(year: number): string {
  const head =
    `<th scope="col" class="wk">Wk</th>` +
    WEEKDAY_ABBR.map((d) => `<th scope="col">${d}</th>`).join("");

  const months = buildYearGrid(year)
    .map((m) => {
      const body = m.weeks
        .map(
          (wk) =>
            `<tr><th scope="row" class="wk">${pad2(wk.week)}</th>${wk.days
              .map((d) => (d === null ? "<td></td>" : `<td>${pad2(d)}</td>`))
              .join("")}</tr>`,
        )
        .join("");
      return `<table class="month"><caption>${m.name}</caption><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    })
    .join("");

  return `<h2 class="cal-year">${year}</h2><div class="months">${months}</div>`;
}

/** HTML for the bookmark ISO-week table. */
export function renderBookmarkTableHTML(year: number): string {
  const head =
    `<th scope="col">Wk</th>` +
    WEEKDAY_ABBR.map((d) => `<th scope="col">${d}</th>`).join("") +
    `<th scope="col">Mt</th>`;

  const parity = (m: number) => (m % 2 === 0 ? "month-even" : "month-odd");

  const body = buildBookmarkRows(year)
    .map(
      (r) =>
        `<tr><th scope="row">${pad2(r.week)}</th>${r.days
          .map((d) => `<td class="${parity(d.month)}">${pad2(d.day)}</td>`)
          .join(
            "",
          )}<td class="month ${parity(r.month)}">${pad2(r.month)}</td></tr>`,
    )
    .join("");

  return `<table class="bookmark"><caption>${year}</caption><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}
