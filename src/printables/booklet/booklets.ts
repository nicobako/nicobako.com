// Every booklet on the site: its name and one line about it, grouped the way
// the booklets index shows them. Each booklet's pages are markup in its own
// page file under `src/pages/printables/booklets/`; this list is what the
// indexes and each page's heading read, so the two cannot drift apart.

export interface BookletInfo {
  /** The page file's name, and the URL segment under `/printables/booklets`. */
  slug: string;
  name: string;
  description: string;
}

export interface BookletGroup {
  name: string;
  booklets: BookletInfo[];
}

export const BOOKLET_GROUPS: BookletGroup[] = [
  {
    name: "Planners",
    booklets: [
      {
        slug: "weekly-planner",
        name: "Weekly Planner",
        description:
          "One week: the days, a habit tracker, a budget and a shopping list.",
      },
      {
        slug: "monthly-planner",
        name: "Monthly Planner",
        description:
          "One month: a calendar to write the dates into, goals and key dates, the weeks, a budget and a review.",
      },
      {
        slug: "year-planner",
        name: "Year Planner",
        description:
          "A year and its four quarters: the year's goals, a line per month, a page per quarter and a review.",
      },
      {
        slug: "task-tracker",
        name: "Task Tracker",
        description:
          "A month of repeating tasks: daily ones ticked off week by week, weekly and monthly ones, and who does what.",
      },
    ],
  },
  {
    name: "Study and work",
    booklets: [
      {
        slug: "study-planner",
        name: "Study Planner",
        description:
          "Subjects and topics, tests and due dates, a week of study blocks, a log of what was covered, and a self-quiz.",
      },
      {
        slug: "sprint",
        name: "Sprint Booklet",
        description:
          "A two-week sprint: the goal, the committed stories, ten stand-ups, a burndown grid and the retro.",
      },
      {
        slug: "project-notebook",
        name: "Project Notebook",
        description:
          "One idea, taken somewhere: the problem, sketches on dot and square grids, next steps, a log and a parking lot.",
      },
    ],
  },
  {
    name: "Practice",
    booklets: [
      {
        slug: "practice-journal",
        name: "Practice Journal",
        description:
          "A week at the instrument: assignments, what each day's practice covered and for how long, a scales tracker and lesson notes.",
      },
      {
        slug: "kana-practice",
        name: "Kana Practice",
        description:
          "Writing squares with centre guides for hiragana and katakana, and a vocabulary list.",
      },
    ],
  },
  {
    name: "For kids",
    booklets: [
      {
        slug: "comic-book",
        name: "Comic Book",
        description:
          "Six pages of comic panels in different layouts, a cover to draw, and an about-the-author page.",
      },
      {
        slug: "sketchbook",
        name: "Sketchbook",
        description:
          "A drawing prompt on every page, and a dot page for inventing a creature.",
      },
      {
        slug: "reading-log",
        name: "Reading Log",
        description:
          "A page per book — title, author, a rating and a picture of the best part — and a list of books to read next.",
      },
    ],
  },
];

export const BOOKLETS: BookletInfo[] = BOOKLET_GROUPS.flatMap(
  (group) => group.booklets,
);

export function booklet(slug: string): BookletInfo {
  const found = BOOKLETS.find((b) => b.slug === slug);
  if (!found) throw new Error(`No booklet "${slug}" in BOOKLET_GROUPS`);
  return found;
}
