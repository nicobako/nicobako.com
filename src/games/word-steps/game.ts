// Word Steps in the browser: judging the words a player enters, drawing the rungs they
// have climbed, and finding the next one when they ask for a hint.
//
// Everything that could be settled at build time already was — the puzzle's language, its
// two ends and its par arrive as data attributes on `#word-steps`, and the start rung, the
// target rung and the keypad are markup. What is left here is the part that only exists
// once someone is playing: the chain so far. It is rebuilt with `document.createElement`
// rather than assembled as HTML, and it is the only thing on the page the script creates.
//
// Nothing here branches on which language is being played. The words, the alphabet and the
// nouns used in the game's replies all come from the language record, so hiragana works
// for the same reason English does.

import {
  LANGUAGES,
  charactersOf,
  wordsFor,
  type LanguageSlug,
} from "./languages.ts";
import { alphabetOf, characterDistance, describeSteps, shortestLadder } from "./ladders.ts";
import { rememberSolved } from "./progress.ts";

const root = document.querySelector<HTMLElement>("#word-steps");

if (root) {
  const start = root.dataset.start!;
  const target = root.dataset.target!;
  const slug = root.dataset.slug!;
  const par = Number(root.dataset.par);
  const language = LANGUAGES[root.dataset.language as LanguageSlug];
  const length = charactersOf(start).length;
  const words = wordsFor(language, length);
  const alphabet = alphabetOf(words);

  const chainList = root.querySelector<HTMLOListElement>(".chain")!;
  const targetRung = root.querySelector<HTMLElement>(".rung.target")!;
  const form = root.querySelector<HTMLFormElement>(".entry")!;
  const input = form.querySelector<HTMLInputElement>("input")!;
  const message = root.querySelector<HTMLElement>(".message")!;
  const keypad = root.querySelector<HTMLElement>(".keypad");
  const hintButton = root.querySelector<HTMLButtonElement>("[data-action='hint']")!;
  const undoButton = root.querySelector<HTMLButtonElement>("[data-action='undo']")!;
  const restartButton = root.querySelector<HTMLButtonElement>("[data-action='restart']")!;

  /** The words played so far, the start word first. Never repeats itself. */
  let chain: string[] = [start];
  let hintsUsed = 0;

  const currentWord = () => chain[chain.length - 1]!;
  const solved = () => currentWord() === target;

  /** One rung: the word as separate characters, with the one that changed picked out. */
  function buildRung(word: string, previous: string | undefined): HTMLLIElement {
    const characters = charactersOf(word);
    const before = previous ? charactersOf(previous) : [];
    const rung = document.createElement("li");
    rung.className = "rung";
    characters.forEach((character, index) => {
      const tile = document.createElement("span");
      tile.className = "tile";
      if (previous && before[index] !== character) tile.classList.add("changed");
      tile.textContent = character;
      rung.append(tile);
    });
    return rung;
  }

  function render(): void {
    chainList.replaceChildren(
      ...chain.slice(1).map((word, index) => buildRung(word, chain[index])),
    );
    targetRung.classList.toggle("reached", solved());
    form.hidden = solved();
    if (keypad) keypad.hidden = solved();
    hintButton.hidden = solved();
    undoButton.disabled = chain.length === 1;
    input.value = "";
  }

  function say(text: string, tone: "info" | "error" | "win" = "info"): void {
    message.textContent = text;
    message.dataset.tone = tone;
  }

  /** What the player entered, with anything this language cannot spell a word with removed. */
  function normalise(raw: string): string {
    return charactersOf(raw.trim().toLowerCase())
      .filter((character) => alphabet.has(character))
      .join("");
  }

  /** Why `word` cannot follow the current one, or null if it can. */
  function reject(word: string): string | null {
    const current = currentWord();
    if (charactersOf(word).length !== length) {
      return `Words in this ladder are ${length} ${language.unitPlural} long.`;
    }
    if (word === current) return "That's the word you're already on!";
    if (characterDistance(current, word) > 1) {
      return `Change just one ${language.unit} at a time.`;
    }
    if (chain.includes(word)) return "You already used that word — try a different one.";
    if (!words.has(word)) return `I don't know the word "${word}". Try another one.`;
    return null;
  }

  // Three things can be true at the end, and each gets its own sentence: there is no
  // losing here, so the worst news the game ever gives is that a shorter way exists.
  function finish(): void {
    const steps = chain.length - 1;
    const climbed = `You made it in ${describeSteps(steps)}`;
    if (steps > par) {
      say(`${climbed}. There's a way to do it in ${describeSteps(par)} — try again?`, "win");
    } else if (hintsUsed > 0) {
      say(`${climbed} — the shortest way there is. Now try it without hints!`, "win");
    } else {
      say(`${climbed}, all on your own — and that's the shortest way there is!`, "win");
    }
    rememberSolved(slug);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const word = normalise(input.value);
    if (!word) return;

    const problem = reject(word);
    if (problem) {
      say(problem, "error");
      input.select();
      return;
    }

    chain.push(word);
    render();
    if (solved()) finish();
    else say("");
    input.focus();
  });

  hintButton.addEventListener("click", () => {
    // Words already played are off the table, so the hint is always a legal move.
    const route = shortestLadder(currentWord(), target, words, new Set(chain));
    if (!route) {
      say("There's no way on from here. Press Undo and try a different word.", "error");
      return;
    }
    hintsUsed++;
    input.value = route[1]!;
    input.focus();
    input.select();
    say("Try this one.");
  });

  undoButton.addEventListener("click", () => {
    if (chain.length === 1) return;
    chain.pop();
    render();
    say("");
  });

  restartButton.addEventListener("click", () => {
    chain = [start];
    hintsUsed = 0;
    render();
    say("");
  });

  // The keypad is how a script the device cannot type gets entered. It only ever edits
  // the text box, so a family that *does* have a Japanese keyboard can ignore it.
  keypad?.addEventListener("click", (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>("button");
    if (!button) return;
    const characters = charactersOf(input.value);
    if (button.dataset.key) {
      if (characters.length < length) input.value += button.dataset.key;
    } else if (button.dataset.action === "erase") {
      input.value = characters.slice(0, -1).join("");
    }
    say("");
  });

  render();
}
