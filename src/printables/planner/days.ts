// A month's days as table columns or table rows.
//
// The days of a month are the one thing an undated sheet can still print: the
// 14th is the 14th in every year. A spread splits them at the cut — the first
// half of the month on the left page, the rest on the right — so a row of
// ticks runs across the whole sheet, which is the reason the sheet is a
// spread at all.
import type { PaperColumn } from "../../components/paper/Table.astro";

/** The longest a month gets. A short month leaves its last columns unused. */
export const MONTH_DAYS = 31;

/** Where a month is split across the cut: 1–16 on the left, 17–31 on the right. */
export const HALF = 16;

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

/** The days of the month on one page, as the numbers they are. */
export function dayNumbers(half: "first" | "second"): number[] {
  return half === "first" ? range(1, HALF) : range(HALF + 1, MONTH_DAYS);
}

/** The same days as labels, for a table whose rows are days. */
export function dayRows(half: "first" | "second"): string[] {
  return dayNumbers(half).map(String);
}

/** The same days as narrow columns, for a table whose columns are days. */
export function dayColumns(half: "first" | "second"): PaperColumn[] {
  return dayNumbers(half).map((day) => ({
    label: String(day),
    width: 1,
    centre: true,
  }));
}
