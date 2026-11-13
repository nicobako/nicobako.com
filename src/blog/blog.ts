// The blog's data layer: which posts exist, in what order, and how a date is
// written. Kept out of the pages so the index, a post and anything later
// (a feed, a tag page) all agree without repeating the query.

import { getCollection, type CollectionEntry } from "astro:content";

export type Post = CollectionEntry<"blog">;

/**
 * Every published post, newest first.
 *
 * A post with `draft: true` is kept out of a production build but shown by
 * `npm run dev`, so a half-written post can be read in place without being
 * published or precached.
 */
export async function publishedPosts(): Promise<Post[]> {
  const posts = await getCollection("blog", ({ data }) =>
    import.meta.env.PROD ? !data.draft : true,
  );
  return posts.sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
}

/** `2026-11-12` → `12 November 2026`. */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** `2026-11-12`, for a `<time datetime>` attribute. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
