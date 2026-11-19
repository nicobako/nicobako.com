// Content collections.
//
// The blog is the one part of this site whose content is authored rather than
// computed, so the loader reads Markdown files and this schema is only the
// frontmatter each post has to carry. `date` is parsed by zod's coercion, so
// `date: 2026-11-12` in the frontmatter arrives as a Date.

import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "zod";

const blogSchema = z.object({
  title: z.string(),
  // Shown under the title on the index and used as the page's meta description,
  // so it is one sentence, not a paragraph.
  description: z.string(),
  date: z.coerce.date(),
  // Left out of a production build but visible in `npm run dev`.
  draft: z.boolean().default(false),
});

export const collections = {
  blog: defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
    schema: blogSchema,
  }),
};
