import abcjs from "abcjs";
import type { SynthObjectController, TuneObject } from "abcjs";
import "abcjs/abcjs-audio.css";

export interface AbcEditorTargets {
  /** Container the per-track sections are appended into. */
  container: HTMLElement;
  /** Template holding the markup for a single track (see abc-editor.astro). */
  template: HTMLTemplateElement;
}

function triggerDownload(url: string, filename: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function fileBaseName(tune: TuneObject | null): string {
  const title = tune?.metaText?.title?.trim();
  const slug = title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "tune";
}

/**
 * Split an ABC document into one source string per tune. A new tune starts at
 * each `X:` header once the current block already has one, so multiple tunes
 * separated by blank lines (or not) each become their own block.
 */
export function splitTunes(abc: string): string[] {
  const lines = abc.split(/\r?\n/);
  const blocks: string[] = [];
  let current: string[] = [];
  let currentHasX = false;

  for (const line of lines) {
    const isHeader = /^X:/.test(line);
    if (isHeader && currentHasX) {
      blocks.push(current.join("\n"));
      current = [];
      currentHasX = false;
    }
    current.push(line);
    if (isHeader) currentHasX = true;
  }
  if (current.some((l) => l.trim() !== "")) blocks.push(current.join("\n"));

  return blocks.length ? blocks : [abc];
}

/** One rendered tune: its own notation, warnings, playback, and downloads. */
class Track {
  readonly root: HTMLElement;
  private notation: HTMLElement;
  private warnings: HTMLElement;
  private status: HTMLElement;
  private synthControl: SynthObjectController | null = null;
  private tune: TuneObject | null = null;
  private source = "";

  constructor(root: HTMLElement) {
    this.root = root;
    this.notation = root.querySelector("[data-notation]")!;
    this.warnings = root.querySelector("[data-warnings]")!;
    this.status = root.querySelector("[data-status]")!;
    const audio = root.querySelector<HTMLElement>("[data-audio]")!;

    if (abcjs.synth.supportsAudio()) {
      this.synthControl = new abcjs.synth.SynthController();
      this.synthControl.load(audio, undefined, {
        displayLoop: true,
        displayRestart: true,
        displayPlay: true,
        displayProgress: true,
        displayWarp: false,
      });
    } else {
      audio.textContent = "Audio playback isn't supported in this browser.";
    }

    root.querySelector("[data-download-abc]")!.addEventListener("click", () => {
      this.downloadAbcText();
    });
    root.querySelector("[data-download-wav]")!.addEventListener("click", () => {
      this.status.textContent = "Rendering audio…";
      this.downloadWav()
        .then(() => {
          this.status.textContent = "";
        })
        .catch(() => {
          this.status.textContent = "Couldn't render audio for download.";
        });
    });
    root.querySelector("[data-download-midi]")!.addEventListener("click", () => {
      try {
        this.downloadMidi();
        this.status.textContent = "";
      } catch {
        this.status.textContent = "Couldn't generate a MIDI file.";
      }
    });
  }

  update(source: string): void {
    this.source = source;
    const tunes = abcjs.renderAbc(this.notation, source, { responsive: "resize" });
    const tune = tunes[0] ?? null;
    this.tune = tune;

    this.warnings.textContent = tune?.warnings?.length
      ? tune.warnings.map((w) => w.replace(/<\/?[^>]+>/g, "")).join("\n")
      : "";

    if (this.synthControl && tune) {
      void this.synthControl.setTune(tune, false, {});
      // abcjs's SynthController only primes audio for a tune the first time
      // Play is pressed: setTune() never clears the isLoaded/isLoading flags
      // it sets during that first priming, so without this, editing after
      // playing once would keep playing (or, if a note ever failed to load,
      // get permanently stuck "loading") the stale tune. Reset both so the
      // next Play re-primes against the tune we just rendered.
      const internal = this.synthControl as unknown as { isLoaded: boolean; isLoading: boolean };
      internal.isLoaded = false;
      internal.isLoading = false;
    }
  }

  dispose(): void {
    this.root.remove();
  }

  private downloadAbcText(): void {
    const blob = new Blob([this.source], { type: "text/plain;charset=utf-8" });
    triggerDownload(URL.createObjectURL(blob), `${fileBaseName(this.tune)}.abc`);
  }

  private async downloadWav(): Promise<void> {
    if (!this.tune) return;
    const midiBuffer = new abcjs.synth.CreateSynth();
    await midiBuffer.init({ visualObj: this.tune });
    await midiBuffer.prime();
    triggerDownload(midiBuffer.download(), `${fileBaseName(this.tune)}.wav`);
  }

  private downloadMidi(): void {
    if (!this.tune) return;
    const bytes = abcjs.synth.getMidiFile(this.tune, { midiOutputType: "binary" }) as Uint8Array<ArrayBuffer>;
    const blob = new Blob([bytes], { type: "audio/midi" });
    triggerDownload(URL.createObjectURL(blob), `${fileBaseName(this.tune)}.midi`);
  }
}

export class AbcEditor {
  private container: HTMLElement;
  private template: HTMLTemplateElement;
  private tracks: Track[] = [];

  constructor({ container, template }: AbcEditorTargets) {
    this.container = container;
    this.template = template;
  }

  render(abc: string): void {
    const blocks = splitTunes(abc);

    // Reconcile the track sections with the number of tunes in the source,
    // reusing existing tracks so playback state isn't torn down on every keystroke.
    while (this.tracks.length > blocks.length) {
      this.tracks.pop()!.dispose();
    }
    while (this.tracks.length < blocks.length) {
      const root = this.template.content.firstElementChild!.cloneNode(true) as HTMLElement;
      this.container.appendChild(root);
      this.tracks.push(new Track(root));
    }

    blocks.forEach((block, i) => this.tracks[i].update(block));
  }
}
