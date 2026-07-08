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

/** One rendered tune: its own notation, warnings, playback, and downloads. */
class Track {
  readonly root: HTMLElement;
  private notation: HTMLElement;
  private warnings: HTMLElement;
  private status: HTMLElement;
  private synthControl: SynthObjectController | null = null;
  private tune: TuneObject | null = null;
  private source = "";
  private transposeValue: HTMLElement;
  /** Visual/playback transpose in semitones; the `.abc` source is left as-is. */
  private transpose = 0;

  constructor(root: HTMLElement) {
    this.root = root;
    this.notation = root.querySelector("[data-notation]")!;
    this.warnings = root.querySelector("[data-warnings]")!;
    this.status = root.querySelector("[data-status]")!;
    this.transposeValue = root.querySelector("[data-transpose-value]")!;
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

    root.querySelector("[data-transpose-down]")!.addEventListener("click", () => {
      this.setTranspose(this.transpose - 1);
    });
    root.querySelector("[data-transpose-up]")!.addEventListener("click", () => {
      this.setTranspose(this.transpose + 1);
    });
  }

  /** Point the track at a new source (one tune, as split out by abcjs) and draw it. */
  update(source: string): void {
    this.source = source;
    this.draw();
  }

  private setTranspose(semitones: number): void {
    const clamped = Math.max(-24, Math.min(24, semitones));
    if (clamped === this.transpose) return;
    this.transpose = clamped;
    this.transposeValue.textContent = clamped > 0 ? `+${clamped}` : `${clamped}`;
    this.draw();
  }

  /**
   * Render this track's source into its notation element, applying the current
   * transpose, and re-prime playback. `visualTranspose` shifts both the notation
   * and the tune object feeding the synth, so notation, playback, WAV and MIDI
   * all follow the transpose; only the `.abc` download keeps the original source.
   */
  private draw(): void {
    const tunes = abcjs.renderAbc(this.notation, this.source, {
      responsive: "resize",
      visualTranspose: this.transpose,
    });
    const tune = tunes[0] ?? null;
    this.tune = tune;

    this.warnings.textContent = tune?.warnings?.length
      ? tune.warnings.map((w) => w.replace(/<\/?[^>]+>/g, "")).join("\n")
      : "";

    if (this.synthControl && tune) {
      // visualTranspose only shifts the notation: abcjs treats it as a
      // transposing-instrument offset and subtracts it back out of the MIDI so
      // the sound stays at concert pitch. Pass a matching midiTranspose so
      // playback follows the notation. (see abc_midi_sequencer.js)
      void this.synthControl.setTune(tune, false, { midiTranspose: this.transpose });
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
    await midiBuffer.init({ visualObj: this.tune, options: { midiTranspose: this.transpose } });
    await midiBuffer.prime();
    triggerDownload(midiBuffer.download(), `${fileBaseName(this.tune)}.wav`);
  }

  private downloadMidi(): void {
    if (!this.tune) return;
    const bytes = abcjs.synth.getMidiFile(this.tune, { midiOutputType: "binary", midiTranspose: this.transpose }) as Uint8Array<ArrayBuffer>;
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
    // Let abcjs split the document into tunes rather than doing it by hand: a
    // TuneBook parses the source exactly the way renderAbc does internally, so
    // each tune's source string below is what abcjs would render on its own.
    const tunes = new abcjs.TuneBook(abc).tunes;

    // Reconcile the track sections with the number of tunes in the source,
    // reusing existing tracks so playback state isn't torn down on every keystroke.
    while (this.tracks.length > tunes.length) {
      this.tracks.pop()!.dispose();
    }
    while (this.tracks.length < tunes.length) {
      const root = this.template.content.firstElementChild!.cloneNode(true) as HTMLElement;
      this.container.appendChild(root);
      this.tracks.push(new Track(root));
    }

    // Each track renders its own tune: they carry independent transpose amounts,
    // and renderAbc's params (visualTranspose) apply per call, not per tune.
    this.tracks.forEach((track, i) => track.update(tunes[i].abc));
  }
}
