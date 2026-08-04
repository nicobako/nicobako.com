// Which years the calendar pages are pre-rendered for.
//
// Both calendar printables used to swap years in the browser by rebuilding their table
// from an HTML string. Instead each year is now its own statically generated page and
// the year picker is a pair of links, so the pages ship no rendering code at all.

// Kept deliberately small: every year is a real generated page and the whole site is
// precached by the service worker, so the range trades directly against install size.
/** Years before the build year that get a page. */
const YEARS_BACK = 1;
/** Years after the build year that get a page. */
const YEARS_FORWARD = 3;

/**
 * The year the site was built in. Evaluated at build time only — these pages are
 * static, so "current" means "current as of the last deploy".
 */
export const BUILD_YEAR = new Date().getFullYear();

/** Every year with a generated page, oldest first. */
export const YEARS: number[] = Array.from(
  { length: YEARS_BACK + YEARS_FORWARD + 1 },
  (_, i) => BUILD_YEAR - YEARS_BACK + i,
);

/**
 * URL for a given year. The build year keeps the bare path so existing links and
 * bookmarks still resolve; every other year lives under it.
 */
export function yearHref(basePath: string, year: number): string {
  return year === BUILD_YEAR ? `${basePath}/` : `${basePath}/${year}/`;
}

/** The years that need a `[year]` page — all of them except the one at the bare path. */
export function subPageYears(): number[] {
  return YEARS.filter((year) => year !== BUILD_YEAR);
}

/** Neighbouring years for the prev/next links, or null at the ends of the range. */
export function adjacentYears(year: number): { prev: number | null; next: number | null } {
  return {
    prev: YEARS.includes(year - 1) ? year - 1 : null,
    next: YEARS.includes(year + 1) ? year + 1 : null,
  };
}
