// The booklets that get a page, and what is printed on each of their eight
// pages. Words and numbers only — `BookletPage.astro` maps each kind of page to
// markup, and `MiniZine.astro` places the pages on the sheet.
//
// A mini zine page is 2¾ × 4¼ inches on US Letter, so each kind does one job. A
// new booklet is a new entry in `BOOKLETS` made of the same kinds; a new kind is
// a new branch in `BookletPage.astro`.

export type BookletPage =
  /** Front cover: the booklet's name, blanks for the week and name, and a focus box. */
  | { kind: "cover"; title: string }
  /** A few numbered priorities with tick boxes, over a few ruled lines. */
  | { kind: "priorities"; title: string; count: number; linesTitle: string }
  /**
   * Days stacked down the page, sharing its height: each has its name and a
   * date, must-dos with tick boxes, then ruled lines.
   */
  | { kind: "days"; days: string[]; tasks: number }
  /** Habit names down the side, a box for each day across. */
  | { kind: "habits"; title: string; rows: number }
  /** An expense log: what, how much, and the budget it comes out of. */
  | { kind: "budget"; title: string; rows: number }
  /** A checklist with a write-in line per item. */
  | { kind: "checklist"; title: string; rows: number };

export interface Booklet {
  /** URL segment under `/printables/booklets`. */
  slug: string;
  name: string;
  /** One line of prose for the page and the index. */
  description: string;
  /** Pages 1–8, in reading order. */
  pages: BookletPage[];
}

export const BOOKLETS: Booklet[] = [
  {
    slug: "weekly-planner",
    name: "Weekly Planner Booklet",
    description:
      "A pocket planner for one week: the days, a habit tracker, a budget and a shopping list.",
    pages: [
      { kind: "cover", title: "Weekly Planner" },
      {
        kind: "priorities",
        title: "Top 3 this week",
        count: 3,
        linesTitle: "Don't forget",
      },
      { kind: "days", days: ["Monday", "Tuesday"], tasks: 2 },
      { kind: "days", days: ["Wednesday", "Thursday"], tasks: 2 },
      { kind: "days", days: ["Friday", "Saturday", "Sunday"], tasks: 1 },
      { kind: "habits", title: "Habits", rows: 8 },
      { kind: "budget", title: "Budget", rows: 14 },
      // The back cover is the one page seen without opening the booklet, which
      // is where a shopping list wants to be.
      { kind: "checklist", title: "Shopping", rows: 18 },
    ],
  },
];

for (const booklet of BOOKLETS) {
  if (booklet.pages.length !== 8) {
    throw new Error(
      `Booklet ${booklet.slug} has ${booklet.pages.length} pages; a mini zine has 8`,
    );
  }
}
