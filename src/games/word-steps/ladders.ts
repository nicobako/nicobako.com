// Word Steps: the puzzles, and the search that proves each one has an answer.
//
// A ladder climbs from one word to another by changing a single character at a time, and
// every rung has to be a real word — `cat`, `cot`, `dot`, `dog`. The idea is Lewis
// Carroll's, who called it Doublets and set the first one in 1877.
//
// A puzzle is declared as its language and its two ends. Everything else about it — how
// many steps the shortest answer takes, which group it belongs to, what it is called,
// where it lives — is derived, so adding a puzzle is one line and cannot disagree with
// itself. The exceptions are the order, which is easiest-first because a seven-year-old
// picking from the index should meet the two-step ladders before the five-step ones, and
// the gloss on a Japanese ladder, which no amount of derivation can supply.
//
// The search is here rather than in `game.ts` because both ends of the site need it: the
// build walks it to check every puzzle is solvable and to work out its par, and the
// browser walks it again when a stuck player asks for a hint.

import {
  LANGUAGES,
  charactersOf,
  wordsFor,
  type Language,
  type LanguageSlug,
} from "./languages.ts";

/** A puzzle: climb from `start` to `target`, one character at a time. */
export interface Ladder {
  language: LanguageSlug;
  start: string;
  target: string;
  /** What the two ends mean, where the words alone will not say. */
  gloss?: string;
}

const en = (start: string, target: string): Ladder => ({ language: "en", start, target });
const ja = (start: string, target: string, gloss: string): Ladder => ({
  language: "ja",
  start,
  target,
  gloss,
});

/**
 * Every puzzle that gets a page, easiest first within each language and length. Each one
 * is a real, precached page, so this list trades against install size the way the
 * printable presets do — prefer replacing a ladder to appending one.
 */
export const LADDERS: readonly Ladder[] = [
  // English, three letters: two to four steps.
  en("hat", "cap"),
  en("toy", "box"),
  en("pot", "pan"),
  en("cat", "dog"),
  en("sun", "sky"),
  en("red", "hot"),
  en("cow", "pig"),
  en("mud", "pie"),
  en("car", "bus"),
  en("top", "bed"),

  // English, four letters: three to five steps.
  en("cook", "food"),
  en("bike", "ride"),
  en("cold", "warm"),
  en("milk", "cake"),
  en("wood", "fire"),
  en("corn", "farm"),
  en("hand", "foot"),
  en("king", "gold"),
  en("lake", "pond"),
  en("bird", "nest"),

  // Japanese, two characters: two to four steps.
  ja("やま", "うみ", "mountain → sea"),
  ja("くち", "みみ", "mouth → ear"),
  ja("ゆき", "あめ", "snow → rain"),
  ja("かみ", "ほん", "paper → book"),
  ja("ちち", "はは", "father → mother"),
  ja("きた", "にし", "north → west"),
  ja("ねこ", "いぬ", "cat → dog"),
  ja("つき", "ほし", "moon → star"),
  ja("あさ", "よる", "morning → night"),
  ja("くも", "そら", "cloud → sky"),

  // Japanese, three characters: two to four steps.
  ja("はしる", "とまる", "to run → to stop"),
  ja("あまい", "からい", "sweet → spicy"),
  ja("わかい", "ふるい", "young → old"),
  ja("あさい", "ふかい", "shallow → deep"),
  ja("あつい", "さむい", "hot → cold"),
  ja("ちかい", "とおい", "near → far"),
  ja("あかい", "くろい", "red → black"),
  ja("あける", "しめる", "to open → to close"),
];

/** The language a ladder is played in. */
export function languageOf(ladder: Ladder): Language {
  return LANGUAGES[ladder.language];
}

/** The words a ladder may pass through. */
export function wordsForLadder(ladder: Ladder): ReadonlySet<string> {
  return wordsFor(languageOf(ladder), charactersOf(ladder.start).length);
}

/** The words one character away from `word` — the legal moves from it. */
export function neighbours(
  word: string,
  words: ReadonlySet<string>,
  alphabet: ReadonlySet<string>,
): string[] {
  const characters = charactersOf(word);
  const found: string[] = [];
  for (let i = 0; i < characters.length; i++) {
    const original = characters[i]!;
    for (const character of alphabet) {
      if (character === original) continue;
      characters[i] = character;
      const candidate = characters.join("");
      if (words.has(candidate)) found.push(candidate);
    }
    characters[i] = original;
  }
  return found;
}

/**
 * The characters any of these words is spelled with. Taken from the words themselves
 * rather than declared, so the search never tries a letter no word could contain.
 */
export function alphabetOf(words: ReadonlySet<string>): ReadonlySet<string> {
  const alphabet = new Set<string>();
  for (const word of words) {
    for (const character of charactersOf(word)) alphabet.add(character);
  }
  return alphabet;
}

/** How many positions two words of the same length disagree on. */
export function characterDistance(a: string, b: string): number {
  const left = charactersOf(a);
  const right = charactersOf(b);
  let differences = 0;
  for (let i = 0; i < left.length; i++) {
    if (left[i] !== right[i]) differences++;
  }
  return differences;
}

/**
 * The shortest ladder from `from` to `to`, both ends included, or `null` when the words
 * do not connect. Breadth-first, so the first route to arrive is a shortest one.
 *
 * `avoid` names words the search may not climb through. The game fills it with the words
 * already played — a chain may not repeat itself — so the hint that comes back is always
 * a move the player is actually allowed to make, and a player who has walked into a dead
 * end is told so rather than handed a word the game will then reject.
 */
export function shortestLadder(
  from: string,
  to: string,
  words: ReadonlySet<string>,
  avoid: ReadonlySet<string> = new Set(),
): string[] | null {
  if (!words.has(from) || !words.has(to)) return null;

  const alphabet = alphabetOf(words);
  const cameFrom = new Map<string, string | null>([[from, null]]);
  const queue = [from];

  for (let head = 0; head < queue.length; head++) {
    const word = queue[head]!;
    if (word === to) {
      const route: string[] = [];
      for (let step: string | null = word; step !== null; step = cameFrom.get(step)!) {
        route.push(step);
      }
      return route.reverse();
    }
    for (const next of neighbours(word, words, alphabet)) {
      if (cameFrom.has(next) || avoid.has(next)) continue;
      cameFrom.set(next, word);
      queue.push(next);
    }
  }

  return null;
}

/**
 * Steps in the shortest answer — the par a player is climbing against. Throws rather
 * than returning nothing, so a puzzle that cannot be solved fails the build instead of
 * shipping a page no child can finish.
 */
export function ladderPar(ladder: Ladder): number {
  const route = shortestLadder(ladder.start, ladder.target, wordsForLadder(ladder));
  if (!route) {
    throw new Error(
      `Word Steps: no ladder connects "${ladder.start}" to "${ladder.target}". ` +
        `Either pick different words or add the missing rungs to the word list.`,
    );
  }
  return route.length - 1;
}

/** URL segment for a ladder — `cat-to-dog`, `neko-to-inu`. */
export function ladderSlug(ladder: Ladder): string {
  const language = languageOf(ladder);
  return `${language.slugFor(ladder.start)}-to-${language.slugFor(ladder.target)}`;
}

/** URL for a ladder's page. */
export function ladderHref(ladder: Ladder): string {
  return `/games/word-steps/${ladderSlug(ladder)}/`;
}

/** A ladder's name, for titles and links — "Cat to Dog", "ねこ → いぬ". */
export function ladderName(ladder: Ladder): string {
  return languageOf(ladder).nameFor(ladder.start, ladder.target);
}

/** How a ladder's length is described — "3 steps". */
export function describeSteps(steps: number): string {
  return steps === 1 ? "1 step" : `${steps} steps`;
}
