// The voice of the ear trainer: single notes and short chord sequences.
//
// `Drone` next door plays a note for as long as you hold it; a cadence instead needs
// several notes started at once and a chord following the last one to the beat, so the
// timing has to be handed to the audio clock rather than to `setTimeout`. That is the
// whole reason this is its own class — the envelope and the lazily-created context are
// deliberately the same shape as the drone's.

/** Everything sounds a beat after the call, so the first chord is never clipped. */
const LEAD_IN = 0.06;

export class EarTrainingSynth {
  private ctx: AudioContext | null = null;
  private out: AudioNode | null = null;
  private voices = new Set<OscillatorNode>();

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      const comp = this.ctx.createDynamicsCompressor();
      comp.connect(this.ctx.destination);
      this.out = comp;
    } else if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  /** One tone, started and stopped on the audio clock. Times are absolute. */
  private schedule(freq: number, startAt: number, duration: number, peak: number): void {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.out!);
    // A triangle carries enough of a harmonic to hear the pitch clearly without the
    // upper partials a sawtooth would add, which are exactly what a listener trying to
    // name the fundamental does not need.
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(peak, startAt + 0.02);
    gain.gain.setValueAtTime(peak, startAt + duration * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
    osc.start(startAt);
    osc.stop(startAt + duration);
    this.voices.add(osc);
    osc.onended = () => this.voices.delete(osc);
  }

  /** The question. Returns how long it sounds for, in seconds. */
  playNote(freq: number): number {
    this.stop();
    const duration = 1.8;
    this.schedule(freq, this.getCtx().currentTime + LEAD_IN, duration, 0.35);
    return LEAD_IN + duration;
  }

  /**
   * A chord per `secondsPerChord`, with the last one left ringing so the cadence ends
   * on the tonic rather than being cut off by it. Returns the total length in seconds.
   */
  playChords(chords: number[][], secondsPerChord: number): number {
    this.stop();
    const start = this.getCtx().currentTime + LEAD_IN;
    chords.forEach((chord, i) => {
      const last = i === chords.length - 1;
      const duration = secondsPerChord * (last ? 2.2 : 1.05);
      // Three voices at once, so each is quieter than a single note would be.
      for (const freq of chord) this.schedule(freq, start + i * secondsPerChord, duration, 0.2);
    });
    return LEAD_IN + (chords.length - 1 + 2.2) * secondsPerChord;
  }

  /** Silence whatever is sounding or scheduled, so a new question never overlaps an old one. */
  stop(): void {
    for (const osc of this.voices) {
      osc.onended = null;
      try {
        osc.stop();
      } catch {
        // Already stopped; nothing to do.
      }
    }
    this.voices.clear();
  }
}
