// The A5 planner: binder pages for a six-ring A5 binder, each printed either
// two to a sheet of A4 and cut in half, or one to a sheet of A5.
//
// This module holds names and numbers only. Each layout's pages are markup in
// its own component under `components/a5-planner/layouts/`, looked up by slug
// in `PlannerLayout.astro`; this list is what the index, the page headings and
// the paper picker read.
//
// Every layout is undated, as the booklets are: the reader writes the week,
// month or year in, so one page serves every one of them rather than a page per
// date, and the list of layouts is the whole of what gets precached.

export interface PlannerLayoutInfo {
  /** URL segment under `/printables/a5-planner`, and the key of its component. */
  slug: string;
  name: string;
  description: string;
  /**
   * A5 pages the layout has. Two is a spread, left page then right; on A4 the
   * two share the sheet. One page prints twice on A4, so one cut makes two.
   */
  pages: 1 | 2;
}

export interface PlannerGroup {
  name: string;
  layouts: PlannerLayoutInfo[];
}

export const PLANNER_GROUPS: PlannerGroup[] = [
  {
    name: "Year",
    layouts: [
      {
        slug: "year-at-a-glance",
        name: "Year at a Glance",
        description: "The twelve months, each with ruled lines for plans and key dates.",
        pages: 1,
      },
      {
        slug: "year-goals",
        name: "Year Goals",
        description:
          "A spread: a theme and goals by area of life on the left, goals with quarterly milestones on the right.",
        pages: 2,
      },
      {
        slug: "year-tracker",
        name: "Year Tracker",
        description:
          "Every day of the year as a square — a month to a column — to colour in for mood, a habit or anything else, with a key.",
        pages: 1,
      },
    ],
  },
  {
    name: "Quarter",
    layouts: [
      {
        slug: "quarter-plan",
        name: "Quarter Plan",
        description:
          "A spread: the quarter's goals and its three months on the left, its thirteen weeks with a focus for each on the right.",
        pages: 2,
      },
      {
        slug: "quarter-tracker",
        name: "Quarter Tracker",
        description:
          "Goals, projects and habits against the quarter's thirteen weeks.",
        pages: 1,
      },
      {
        slug: "quarter-review",
        name: "Quarter Review",
        description:
          "Wins and lessons, the numbers against their targets, stop / start / continue, and the next quarter's focus.",
        pages: 1,
      },
    ],
  },
  {
    name: "Month",
    layouts: [
      {
        slug: "month-calendar",
        name: "Month Calendar",
        description:
          "A spread: a calendar to write the dates into on the left; goals, key dates, a 31-day habit tracker and notes on the right.",
        pages: 2,
      },
      {
        slug: "month-on-one-page",
        name: "Month on One Page",
        description:
          "A small calendar, goals and key dates, and a habit tracker for the whole month, on one page.",
        pages: 1,
      },
      {
        slug: "month-list",
        name: "Month List",
        description:
          "A line for every day of the month, with six narrow columns beside it to track habits.",
        pages: 1,
      },
    ],
  },
  {
    name: "Week",
    layouts: [
      {
        slug: "week-on-two-pages",
        name: "Week on Two Pages",
        description:
          "A spread: Monday to Thursday on the left; Friday to Sunday, a habit tracker and the week's top three on the right.",
        pages: 2,
      },
      {
        slug: "week-on-one-page",
        name: "Week on One Page",
        description:
          "The week's top three and a habit tracker, over the seven days in two columns.",
        pages: 1,
      },
      {
        slug: "week-time-blocks",
        name: "Week in Time Blocks",
        description:
          "Seven columns of hours from 6 to 22, with a habit tracker and a to-do list underneath.",
        pages: 1,
      },
    ],
  },
  {
    name: "Day",
    layouts: [
      {
        slug: "day-on-a-page",
        name: "Day on a Page",
        description:
          "A schedule from 6 to 22 beside the day's top three, tasks, habits and notes, with water and mood at the foot.",
        pages: 1,
      },
      {
        slug: "two-days-on-a-page",
        name: "Two Days on a Page",
        description: "Two days, each a schedule from 7 to 21 beside a task list.",
        pages: 1,
      },
      {
        slug: "daily-journal",
        name: "Daily Journal",
        description:
          "Mood, gratitude and the day's intention in the morning; a page to write on; wins and tomorrow at night.",
        pages: 1,
      },
    ],
  },
  {
    name: "Lists and trackers",
    layouts: [
      {
        slug: "habit-tracker",
        name: "Habit Tracker",
        description: "Twenty-four habits against the 31 days of a month.",
        pages: 1,
      },
      {
        slug: "table",
        name: "Table",
        description:
          "A ruled table with a numbered column and four more to head yourself: a log, a reading list, a collection.",
        pages: 1,
      },
      {
        slug: "checklist",
        name: "Checklist",
        description: "Two columns of lines with tick boxes, for to-dos, packing or shopping.",
        pages: 1,
      },
      {
        slug: "budget",
        name: "Monthly Budget",
        description:
          "Income, then every expense with its date and category, and the totals at the foot.",
        pages: 1,
      },
      {
        slug: "goal-planner",
        name: "Goal Planner",
        description:
          "One goal: why it matters, its steps with due dates, what could get in the way, and a progress bar.",
        pages: 1,
      },
      {
        slug: "meal-plan",
        name: "Meal Plan",
        description: "A week of breakfasts, lunches and dinners, and the shopping list for it.",
        pages: 1,
      },
    ],
  },
  {
    name: "Paper",
    layouts: [
      {
        slug: "lined",
        name: "Lined",
        description: "Narrow-ruled lines, about 5 mm apart, for small handwriting.",
        pages: 1,
      },
      {
        slug: "dot-grid",
        name: "Dot Grid",
        description: "A 5 mm dot grid.",
        pages: 1,
      },
      {
        slug: "square-grid",
        name: "Square Grid",
        description: "A 5 mm square grid.",
        pages: 1,
      },
    ],
  },
];

export const PLANNER_LAYOUTS: PlannerLayoutInfo[] = PLANNER_GROUPS.flatMap(
  (group) => group.layouts,
);

export function plannerLayout(slug: string): PlannerLayoutInfo {
  const found = PLANNER_LAYOUTS.find((layout) => layout.slug === slug);
  if (!found) throw new Error(`No planner layout "${slug}" in PLANNER_GROUPS`);
  return found;
}

/** The paper a layout is printed on: the one axis every layout has. */
export interface Paper {
  /** URL segment after the layout's; empty for the default at the bare path. */
  slug: string;
  name: string;
  /** How to print it, for the line under the picker. */
  instructions: string;
}

/**
 * A4 is the default, and so keeps the bare path: it is the paper a home printer
 * holds, and one sheet cut down the middle is two binder pages. A5 is for paper
 * that is already cut, or bought that size.
 */
export const PAPERS: Paper[] = [
  {
    slug: "",
    name: "A4, cut in half",
    instructions:
      "Print on A4, landscape, at 100% scale with the margins set to none, then cut along the marks at the middle of the top and bottom edges.",
  },
  {
    slug: "a5",
    name: "A5",
    instructions:
      "Print on A5, portrait, at 100% scale with the margins set to none.",
  },
];

export const A4 = PAPERS[0];
export const A5 = PAPERS[1];

/** URL for a layout on a paper. A4 keeps the bare path. */
export function plannerHref(layout: PlannerLayoutInfo, paper: Paper = A4): string {
  const base = `/printables/a5-planner/${layout.slug}/`;
  return paper.slug ? `${base}${paper.slug}/` : base;
}

/** What a reader gets from one print of a layout, on a paper. */
export function describeLayout(layout: PlannerLayoutInfo, paper: Paper): string {
  if (paper === A5) {
    return layout.pages === 2
      ? "Two A5 pages: the left page of a spread, then the right."
      : "One A5 page.";
  }
  return layout.pages === 2
    ? "One A4 sheet holds the spread: the left page and the right."
    : "One A4 sheet holds the page twice, so one cut makes two.";
}

/** Numbers for a column heading per day of a month. */
export const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));

export const MONTHS = [
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
];

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** One-letter weekday headings, Monday first. */
export const WEEKDAY_LETTERS = WEEKDAYS.map((day) => day[0]);
