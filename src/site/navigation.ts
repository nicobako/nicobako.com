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
}

/**
 * The top-level sections, in the order the home page lists them. This replaced
 * the header's "Pages" dropdown: the home page's rows are the way in, and the
 * breadcrumb every page carries is the way back out.
 */
export const SECTIONS: Section[] = [
  { label: "Music", href: "/music/" },
  { label: "Printables", href: "/printables/" },
  { label: "Timers", href: "/timers/" },
];

/**
 * Labels for the paths a trail passes *through*. Only a path with pages under
 * it can ever appear in a trail, so this list is the site's directories and
 * nothing else — a leaf is the page you are on, which a trail doesn't repeat.
 *
 * Anything missing falls back to `titleize`, which is right far more often than
 * not; an entry here is for where it isn't ("Abc Editor"), or
 * where a page is called something other than its slug.
 */
const PATH_LABELS: Record<string, string> = {
  "/music/": "Music",
  "/music/presets/": "Presets",
  "/printables/": "Printables",
  "/printables/bookmark-calendar/": "Bookmark Calendar",
  "/timers/": "Timers",
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
