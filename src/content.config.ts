// Content collections.
//
// The etudes are computed rather than authored — a table of pitches crossed with two
// modes and two variations — so this collection's loader generates its entries outright
// instead of reading files. The generator itself lives in `src/music/etudes/` and knows
// nothing about Astro; this file only validates what it returns and puts it in the store.
//
// When hand-written etudes arrive they join this same collection rather than a new one:
// a `glob()` loader is itself just `{ name, load }`, so `await glob({ ... }).load(context)`
// can run inside `load` below and write file-backed entries into the same store. Pages
// query `getCollection("etudes")` either way and never learn where an entry came from.

import { defineCollection } from "astro:content";
import { z } from "zod";
import type { Loader } from "astro/loaders";
import { generateSingleStringScaleEtudes } from "./music/etudes/single-octave-single-string.ts";

const etudeSchema = z.object({
  family: z.literal("single-octave-single-string"),
  tonicSlug: z.string(),
  tonicName: z.string(),
  octave: z.number().int(),
  semitonesFromC4: z.number().int(),
  modeSlug: z.enum(["major", "minor"]),
  modeName: z.string(),
  variationSlug: z.enum(["no-shift-notes", "with-shift-notes"]),
  variationName: z.string(),
  transposition: z.number().int(),
  abcText: z.string(),
  title: z.string(),
});

const etudeLoader: Loader = {
  name: "etudes",
  load: async ({ store, parseData, generateDigest }) => {
    // Generated wholesale each run, so anything dropped from the tables disappears
    // rather than lingering in the store from a previous build.
    store.clear();
    for (const { id, ...fields } of generateSingleStringScaleEtudes()) {
      const data = await parseData({ id, data: fields });
      store.set({ id, data, digest: generateDigest(data) });
    }
  },
};

export const collections = {
  etudes: defineCollection({ loader: etudeLoader, schema: etudeSchema }),
};
