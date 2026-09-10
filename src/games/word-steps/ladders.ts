// Word Steps: the puzzles, and the search that proves each one has an answer.
//
// A ladder climbs from one word to another by changing a single letter at a time, and
// every rung has to be a real word — `cat`, `cot`, `dot`, `dog`. The idea is Lewis
// Carroll's, who called it Doublets and set the first one in 1877.
//
// A puzzle is declared as nothing but its two ends. Everything else about it — how many
// steps the shortest answer takes, which group it belongs to, what it is called, where
// it lives — is derived, so adding a puzzle is one line and cannot disagree with itself.
// The one thing that is *not* derived is the order: they are listed easiest first,
// because a seven-year-old picking from the index should meet the two-step ladders before
// the five-step ones.
//
// The search is here rather than in `game.ts` because both ends of the site need it: the
// build walks it to check every puzzle is solvable and to work out its par, and the
// browser walks it again when a stuck player asks for a hint.

import { WORDS_3, WORDS_4 } from "./words.ts";

/** A puzzle: climb from `start` to `target`, one letter at a time. */
export interface Ladder {
  start: string;
  target: string;
}

/**
 * Every puzzle that gets a page, easiest first within each word length. Each one is a
 * real, precached page, so this list trades against install size the way the printable
 * presets do — keep it short, and prefer replacing a ladder to appending one.
 */
export const LADDERS: readonly Ladder[] = [
  // Three letters: two to four steps.
  { start: "hat", target: "cap" },
  { start: "toy", target: "box" },
  { start: "cat", target: "dog" },
  { start: "sun", target: "sky" },
  { start: "red", target: "hot" },
  { start: "cow", target: "pig" },
  { start: "mud", target: "pie" },
  { start: "car", target: "bus" },

  // Four letters: three to five steps.
  { start: "cook", target: "food" },
  { start: "bike", target: "ride" },
  { start: "cold", target: "warm" },
  { start: "milk", target: "cake" },
  { start: "wood", target: "fire" },
  { start: "corn", target: "farm" },
  { start: "hand", target: "foot" },
  { start: "king", target: "gold" },
];

/** The two word lengths that get played, and how each group is introduced. */
export const GROUPS = [
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
] as const;

const WORDS_BY_LENGTH: Record<number, readonly string[]> = { 3: WORDS_3, 4: WORDS_4 };

/** Every word a ladder of this length may pass through. */
export function wordsOfLength(length: number): ReadonlySet<string> {
  const words = WORDS_BY_LENGTH[length];
  if (!words) throw new Error(`Word Steps has no ${length}-letter word list.`);
  return new Set(words);
}

/** The word list a ladder plays in. */
export function wordsFor(ladder: Ladder): ReadonlySet<string> {
  return wordsOfLength(ladder.start.length);
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

/** The words one letter away from `word` — the legal moves from it. */
export function neighbours(word: string, words: ReadonlySet<string>): string[] {
  const found: string[] = [];
  for (let i = 0; i < word.length; i++) {
    for (const letter of ALPHABET) {
      if (letter === word[i]) continue;
      const candidate = word.slice(0, i) + letter + word.slice(i + 1);
      if (words.has(candidate)) found.push(candidate);
    }
  }
  return found;
}

/** How many letters two words of the same length disagree on. */
export function letterDistance(a: string, b: string): number {
  let differences = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) differences++;
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
    for (const next of neighbours(word, words)) {
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
  const route = shortestLadder(ladder.start, ladder.target, wordsFor(ladder));
  if (!route) {
    throw new Error(
      `Word Steps: no ladder connects "${ladder.start}" to "${ladder.target}". ` +
        `Either pick different words or add the missing rungs to words.ts.`,
    );
  }
  return route.length - 1;
}

/** URL segment for a ladder — `cat-to-dog`. */
export function ladderSlug(ladder: Ladder): string {
  return `${ladder.start}-to-${ladder.target}`;
}

/** URL for a ladder's page. */
export function ladderHref(ladder: Ladder): string {
  return `/games/word-steps/${ladderSlug(ladder)}/`;
}

/** A ladder's name, for titles and links — "Cat to Dog". */
export function ladderName(ladder: Ladder): string {
  return `${titleCase(ladder.start)} to ${titleCase(ladder.target)}`;
}

/** How a ladder's length is described — "3 steps". */
export function describeSteps(steps: number): string {
  return steps === 1 ? "1 step" : `${steps} steps`;
}

function titleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
