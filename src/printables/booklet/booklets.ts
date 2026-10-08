// The booklets that get a page, and what is printed on each of their sixteen
// pages. Words and numbers only — `BookletPage.astro` maps each kind of page to
// markup, and `TCutBooklet.astro` places the pages on the sheet.
//
// A booklet page is tiny (2⅛ × 2¾ inches on US Letter), so each kind does one
// job. A new booklet is a new entry in `BOOKLETS` made of the same kinds; a new
// kind is a new branch in `BookletPage.astro`.

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export type BookletPage =
  /** Front cover: the booklet's name, a blank for the week, and a focus box. */
  | { kind: "cover"; title: string }
  /** One short row per day, for the week's fixed appointments. */
  | { kind: "glance"; title: string }
  /** A few numbered priorities with tick boxes, over a few ruled lines. */
  | { kind: "priorities"; title: string; count: number; linesTitle: string }
  /** One day: name and date, must-dos with tick boxes, then ruled lines. */
  | { kind: "day"; day: string; tasks: number }
  /** Habit names down the side, a box for each day across. */
  | { kind: "habits"; title: string; rows: number }
  /** An expense log: what, how much, and the budget it comes out of. */
  | { kind: "budget"; title: string; rows: number }
  /** A checklist with a write-in line per item. */
  | { kind: "checklist"; title: string; rows: number }
  /** A dot grid. */
  | { kind: "dots"; title: string }
  /** Prompts with a few ruled lines each. */
  | { kind: "prompts"; title: string; prompts: string[] }
  /** Back cover: left blank but for a small mark. */
  | { kind: "back" };

export interface Booklet {
  /** URL segment under `/printables/booklets`. */
  slug: string;
  name: string;
  /** One line of prose for the page and the index. */
  description: string;
  /** Pages 1–16, in reading order. */
  pages: BookletPage[];
}

export const BOOKLETS: Booklet[] = [
  {
    slug: "weekly-planner",
    name: "Weekly Planner Booklet",
    description:
      "A pocket planner for one week: a page per day, a habit tracker, a budget and a shopping list.",
    pages: [
      { kind: "cover", title: "Weekly Planner" },
      { kind: "glance", title: "Week at a glance" },
      {
        kind: "priorities",
        title: "Top 3 this week",
        count: 3,
        linesTitle: "Don't forget",
      },
      ...WEEKDAYS.map((day) => ({ kind: "day" as const, day, tasks: 3 })),
      { kind: "habits", title: "Habits", rows: 6 },
      { kind: "budget", title: "Budget", rows: 10 },
      { kind: "checklist", title: "Shopping", rows: 13 },
      { kind: "dots", title: "Notes" },
      {
        kind: "prompts",
        title: "Week review",
        prompts: ["Went well", "Didn't go well", "Next week"],
      },
      { kind: "back" },
    ],
  },
];

for (const booklet of BOOKLETS) {
  if (booklet.pages.length !== 16) {
    throw new Error(
      `Booklet ${booklet.slug} has ${booklet.pages.length} pages; a T-cut booklet has 16`,
    );
  }
}
