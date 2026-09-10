// The two languages Word Steps is played in, and everything that differs between them.
//
// A word ladder needs three things from a language: an alphabet, a list of words, and a
// sense of how long a word should be for a given age. Everything else in the game — the
// search, the rules, the page — is the same either way, so those three things are all
// that is written down here and nothing branches on the language anywhere else.
//
// The one asymmetry worth naming is the keypad. Any device a child opens this on can type
// Latin letters, so English declares no keypad and the text box is enough. Hiragana needs
// an IME the family tablet almost certainly has not got, so Japanese declares the gojūon
// and the page draws it as buttons.

import { ENGLISH_WORDS } from "./words/english.ts";
import { JAPANESE_WORDS } from "./words/japanese.ts";
import { KANA_GRID, KANA_GRID_MARKED, romanise } from "./kana.ts";

export type LanguageSlug = "en" | "ja";

/** One difficulty tier: all the ladders whose words are this long. */
export interface LengthGroup {
  length: number;
  name: string;
  description: string;
}

/** A block of keypad rows, drawn as one panel. An empty string is a gap in the grid. */
export type KeypadSection = readonly (readonly string[])[];

export interface Language {
  slug: LanguageSlug;
  name: string;
  /** What one square of a word is called, in the rules and in the game's replies. */
  unit: string;
  unitPlural: string;
  /** The words a ladder may pass through, by word length. */
  words: Record<number, readonly string[]>;
  /** The difficulty tiers, easiest first. */
  groups: readonly LengthGroup[];
  /** On-screen keys, for a script the device cannot be assumed to type. */
  keypad?: readonly KeypadSection[];
  /** How one of this language's words is written into a URL. */
  slugFor(word: string): string;
  /** How a pair of its words is named, in a title or a link. */
  nameFor(start: string, target: string): string;
}

export const LANGUAGES: Record<LanguageSlug, Language> = {
  en: {
    slug: "en",
    name: "English",
    unit: "letter",
    unitPlural: "letters",
    words: ENGLISH_WORDS,
    groups: [
      {
        length: 3,
        name: "Short ladders",
        description: "Three letters. A good place to start.",
      },
      {
        length: 4,
        name: "Longer ladders",
        description: "Four letters, and a few more steps to climb.",
      },
    ],
    slugFor: (word) => word,
    nameFor: (start, target) => `${titleCase(start)} to ${titleCase(target)}`,
  },
  ja: {
    slug: "ja",
    name: "Japanese",
    unit: "character",
    unitPlural: "characters",
    words: JAPANESE_WORDS,
    groups: [
      {
        length: 2,
        name: "Short ladders",
        description: "Two characters. Every word here connects to another one.",
      },
      {
        length: 3,
        name: "Longer ladders",
        description:
          "Three characters. Japanese adjectives all end in い and plain verbs in う or る, " +
          "so those are the rungs most of these ladders climb.",
      },
    ],
    keypad: [KANA_GRID, KANA_GRID_MARKED],
    slugFor: romanise,
    // Kana have no capitals to lean on, so the arrow does the work the word "to" does.
    nameFor: (start, target) => `${start} → ${target}`,
  },
};

function titleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Every character of a word, one array entry each, whatever the script. */
export function charactersOf(word: string): string[] {
  return [...word];
}

/** Every word a ladder of this language and length may pass through. */
export function wordsFor(language: Language, length: number): ReadonlySet<string> {
  const words = language.words[length];
  if (!words) {
    throw new Error(`Word Steps has no ${length}-${language.unit} ${language.name} words.`);
  }
  return new Set(words);
}

/**
 * The keypad for one puzzle, with any key that no word of this length uses blanked out.
 * The grid keeps its shape — a child looks for `ぬ` where `ぬ` lives — but a key that
 * could never begin a word it accepts is not offered.
 */
export function keypadFor(language: Language, length: number): readonly KeypadSection[] {
  if (!language.keypad) return [];
  const used = new Set(language.words[length]?.flatMap(charactersOf) ?? []);
  return language.keypad
    .map((section) =>
      section
        .map((row) => row.map((key) => (used.has(key) ? key : "")))
        .filter((row) => row.some((key) => key !== "")),
    )
    .filter((section) => section.length > 0);
}
