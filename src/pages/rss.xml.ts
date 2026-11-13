// /rss.xml — the blog's feed. `@astrojs/rss` writes the XML (escaping, dates,
// the self link); this file only says what goes in it. Drafts are excluded by
// `publishedPosts`, as they are everywhere else.
//
// `site` must be set in astro.config.mjs: `rss()` throws without it, because a
// feed reader cannot resolve a relative URL.
import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { publishedPosts } from "../blog/blog.ts";

export const GET: APIRoute = async (context) =>
  rss({
    title: "Nico Bako",
    description:
      "Writing by Nico Bako on software, music, and whatever else I'm building.",
    site: context.site!,
    customData: "<language>en</language>",
    items: (await publishedPosts()).map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/blog/${post.id}/`,
    })),
  });
