// The weekly activity planner's contents: the bands of rows down the sheet, and
// the week lengths that get a page.
//
// This module holds words and numbers only — no markup. Both week lengths are
// hand-picked presets rather than anything chosen in the browser, so the pages
// resolve entirely at build time and ship no JavaScript.

/**
 * One band of the sheet: a named group of rows spanning every day, the way a
 * school work plan groups a week into sections rather than clock times.
 */
export interface Band {
  /** Heading in the left-hand column. */
  name: string;
  /** One line under the heading, suggesting what belongs in the band. */
  hint: string;
  /** Rows the band gets, per day. */
  rows: number;
  /** Whether each cell carries a tick box to mark the activity done. */
  tick: boolean;
}

/**
 * The bands, top to bottom. Row counts are chosen together so the whole sheet
 * lands on one A4 landscape page — adding rows here takes them from the notes.
 *
 * Only the child's own choices get a tick box: the lessons band is filled in by
 * a grown-up, and those are not the child's to tick off.
 */
export const BANDS: Band[] = [
  {
    name: "My Study Choices",
    hint: "reading, writing, numbers",
    rows: 8,
    tick: true,
  },
  {
    name: "My Fun Choices",
    hint: "outside, making, music",
    rows: 4,
    tick: true,
  },
  {
    name: "Lessons & Events",
    hint: "with a grown-up",
    rows: 2,
    tick: false,
  },
];

const SCHOOL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const WEEKEND = ["Saturday", "Sunday"];

/** A generated sheet: the days it has a column for, and the words that go with it. */
export interface Plan {
  /** URL segment under `/printables/weekly-activity-planner`. */
  slug: string;
  /** Label shown in the picker and the page title. */
  name: string;
  /** One line of prose about who the week suits. */
  description: string;
  /** Column headings, left to right. */
  days: string[];
}

/**
 * Every week length that gets a page. Two is the whole list on purpose: each one
 * is a real, precached page, and a week is either the school one or all of it.
 */
export const PLANS: Plan[] = [
  {
    slug: "school-week",
    name: "School week",
    description: "Monday to Friday, for a week planned around school.",
    days: SCHOOL_DAYS,
  },
  {
    slug: "full-week",
    name: "Full week",
    description: "Monday to Sunday, for holidays and weekends at home.",
    days: [...SCHOOL_DAYS, ...WEEKEND],
  },
];

/**
 * The plan shown at the bare `/printables/weekly-activity-planner` path — the
 * school week, since that is the sheet a term is planned on. Every other plan
 * hangs off it, the same way the sheet music puts its sizes under its bare path.
 */
export const DEFAULT_PLAN: Plan = planFor("school-week");

/** The one entry in `PLANS` with this slug. */
export function planFor(slug: string): Plan {
  return PLANS.find((plan) => plan.slug === slug)!;
}

/** Whether a plan is the one at the bare path. Compared by slug, not identity. */
export function isDefaultPlan(plan: Plan): boolean {
  return plan.slug === DEFAULT_PLAN.slug;
}

/** URL for a plan. The default keeps the bare path so existing links still resolve. */
export function planHref(plan: Plan): string {
  const basePath = "/printables/weekly-activity-planner";
  return isDefaultPlan(plan) ? `${basePath}/` : `${basePath}/${plan.slug}/`;
}

/** The plans that need a `[plan]` page — all of them except the one at the bare path. */
export function subPagePlans(): Plan[] {
  return PLANS.filter((plan) => !isDefaultPlan(plan));
}

/** Rows a plan prints, across every band. */
export function rowCount(): number {
  return BANDS.reduce((total, band) => total + band.rows, 0);
}

/** The shape of a sheet, for the line of small print under the intro. */
export function describePlan(plan: Plan): string {
  const bands = BANDS.map((band) => `${band.rows} for ${band.name.toLowerCase()}`);
  return `${plan.days.length} columns · ${rowCount()} rows a day — ${bands.join(", ")}.`;
}
