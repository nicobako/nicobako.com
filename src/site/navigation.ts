// The site's own map of itself: the sections the home page offers, and the
// labels a breadcrumb trail is written from.
//
// Both come from here because they are the same fact said twice otherwise — a
// section's name on its card and its name in a trail can never disagree.

export interface Crumb {
  label: string;
  href: string;
}

export interface Section {
  label: string;
  href: string;
  /** One sentence on the card. Written as what you can do there. */
  blurb: string;
}

/**
 * The top-level sections, in the order the home page lists them. This replaced
 * the header's "Pages" dropdown: the cards are the way in, and the breadcrumb
 * every page carries is the way back out.
 */
export const SECTIONS: Section[] = [
  {
    label: "About Me",
    href: "/about/",
    blurb: "Who I am, what I work on, and where else to find me.",
  },
  {
    label: "Blog",
    href: "/blog/",
    blurb: "Notes on what I'm building, what I'm learning, and what I keep coming back to.",
  },
  {
    label: "Music",
    href: "/music/",
    blurb:
      "Practice tools that run in the browser — metronome, drone, ear training, sight reading, and generated etudes.",
  },
  {
    label: "Printables",
    href: "/printables/",
    blurb:
      "Pages made to be printed: planners, calendars, staff paper, perspective grids and fold-up booklets.",
  },
  {
    label: "Timers",
    href: "/timers/",
    blurb:
      "A timer, stopwatch, Pomodoro, interval and meditation clock, each notifying you when it finishes.",
  },
  {
    label: "Games",
    href: "/games/",
    blurb: "Small browser games — a word ladder in English and Japanese, and a platformer.",
  },
  {
    label: "References",
    href: "/references/",
    blurb: "Short reference pages: the facts I keep looking up, one page each.",
  },
  {
    label: "Tools",
    href: "/tools/",
    blurb: "Odds and ends that work on your own data, kept in the browser.",
  },
];

/**
 * Labels for the paths a trail passes *through*. Only a path with pages under
 * it can ever appear in a trail, so this list is the site's directories and
 * nothing else — a leaf is the page you are on, which a trail doesn't repeat.
 *
 * Anything missing falls back to `titleize`, which is right far more often than
 * not; an entry here is for where it isn't ("Abc Editor", "A5 Planner"), or
 * where a page is called something other than its slug.
 */
const PATH_LABELS: Record<string, string> = {
  "/about/": "About Me",
  "/blog/": "Blog",
  "/games/": "Games",
  "/games/word-steps/": "Word Steps",
  "/music/": "Music",
  "/music/etudes/": "Etudes",
  "/music/etudes/ascending-on-string/": "Ascending on String",
  "/music/etudes/presets/": "Presets",
  "/music/etudes/single-octave/": "Single octave",
  "/music/etudes/single-octave/single-string/": "Single string",
  "/printables/": "Printables",
  "/printables/a5-planner/": "A5 Planner",
  "/printables/blank-sheet-music/": "Blank Sheet Music",
  "/printables/booklets/": "Booklets",
  "/printables/bookmark-calendar/": "Bookmark Calendar",
  "/printables/perspective-grid/": "Perspective Grids",
  "/printables/weekly-activity-planner/": "Weekly Activity Planner",
  "/printables/year-calendar/": "Year Calendar",
  "/references/": "References",
  "/references/dot-grid/": "Dot Grid",
  "/timers/": "Timers",
  "/tools/": "Tools",
};

/** `word-steps` → `Word Steps`; `a3` → `A3`. */
export function titleize(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Every path has one shape here: a leading and a trailing slash. */
function normalize(path: string): string {
  return `/${path.split("/").filter(Boolean).join("/")}/`.replace("//", "/");
}

/**
 * The trail of ancestors for a page, from Home down to its parent — the page
 * itself is not in it, because a breadcrumb is the way *out* of where you are.
 *
 * `labels` names the paths this page knows better than the table does: a
 * generated route's own segments (a tonic, a planner layout) have no entry in
 * `PATH_LABELS`, so the page that generates them passes the names along.
 */
export function breadcrumbTrail(
  pathname: string,
  labels: Record<string, string> = {},
): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const trail: Crumb[] = [{ label: "Home", href: "/" }];

  // `length - 1` drops the page itself.
  for (let i = 0; i < segments.length - 1; i += 1) {
    const href = `/${segments.slice(0, i + 1).join("/")}/`;
    const named = labels[href] ?? labels[normalize(href)];
    trail.push({
      label: named ?? PATH_LABELS[href] ?? titleize(segments[i]!),
      href,
    });
  }

  return trail;
}
