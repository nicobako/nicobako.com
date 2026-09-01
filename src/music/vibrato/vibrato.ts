// Vibrato: a sustained tone whose pitch swings *below* the note and back up to it.
//
// The one idea the whole page is built around is that the written note is the ceiling,
// not the centre. A string player rolls the finger back from the pitch and returns to it,
// so the ear hears the top of the swing as "the note" and everything under it as colour.
// Centring the oscillation on the note instead — which is what a plain LFO into a
// frequency does — sounds sharp, because half of every cycle is above the pitch.
//
// That is why the modulation is two nodes rather than one: a sine LFO scaled to half the
// width, plus a constant offset of *minus* half the width. Their sum lands in
// `[-width, 0]` cents, so the top of every cycle is the note exactly and the bottom is a
// full width below it. Everything is fed into `detune`, which is measured in cents, so a
// width is the same number of cents whatever note it is applied to — the way a finger's
// travel is the same distance whatever it is stopping.
//
// Unlike most modules under `src/music/`, the tables here reach the browser: the reader
// moves the sliders while listening, so the page reads the labels back out of them.

/** How fast the pitch swings, in oscillations per second. */
export interface Speed {
  hz: number;
  name: string;
}

/**
 * Real vibrato lives in a narrow band — a violinist's slow vibrato is around four
 * oscillations per second and a fast one around eight, and outside that it stops sounding
 * like vibrato at all. So the slider is five named stops over that band rather than a
 * continuous sweep: the useful values are countable and each one has a name players
 * already use.
 */
export const SPEEDS: readonly Speed[] = [
  { hz: 4, name: "Very slow" },
  { hz: 5, name: "Slow" },
  { hz: 6, name: "Moderate" },
  { hz: 7, name: "Fast" },
  { hz: 8, name: "Very fast" },
];

/** How far below the note the pitch swings, in cents. */
export interface Width {
  cents: number;
  name: string;
  /** The same distance said in intervals, which is how a player thinks about it. */
  gloss: string;
}

/**
 * A half step is 100 cents, and that is as wide as vibrato ever sensibly gets: on F it
 * reaches all the way down to E. Halving from there gives a quarter tone, and the narrow
 * end is where most playing actually sits — a normal singing vibrato is a few tens of
 * cents, not a semitone. The wide end is spaced more finely than the narrow one because
 * that is where the extremes live and where the difference between them is worth hearing.
 */
export const WIDTHS: readonly Width[] = [
  { cents: 10, name: "Very narrow", gloss: "a tenth of a half step" },
  { cents: 20, name: "Narrow", gloss: "a fifth of a half step" },
  { cents: 35, name: "Medium", gloss: "about a third of a half step" },
  { cents: 50, name: "Wide", gloss: "a quarter tone — half of a half step" },
  { cents: 75, name: "Very wide", gloss: "three quarters of a half step" },
  { cents: 100, name: "Extremely wide", gloss: "a whole half step, down to the note below" },
];

/** Moderate speed and medium width — recognisably vibrato, and neither extreme. */
export const DEFAULT_SPEED = 2;
export const DEFAULT_WIDTH = 2;

interface Voice {
  osc: OscillatorNode;
  gain: GainNode;
  lfo: OscillatorNode;
  /** Scales the LFO to half the width. */
  depth: GainNode;
  /** Pushes the whole swing down by half the width, so its top is the note. */
  centre: ConstantSourceNode;
}

/** Long enough that a slider drag is heard as a change rather than a step. */
const GLIDE = 0.04;

export class Vibrato {
  private ctx: AudioContext | null = null;
  private out: AudioNode | null = null;
  private voice: Voice | null = null;

  private freq = 440;
  private hz = SPEEDS[DEFAULT_SPEED]!.hz;
  private cents = WIDTHS[DEFAULT_WIDTH]!.cents;
  private on = true;

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

  get isPlaying(): boolean {
    return this.voice !== null;
  }

  /** Half the width, which is both the LFO's amplitude and its downward offset. */
  private get half(): number {
    return this.on ? this.cents / 2 : 0;
  }

  start(): void {
    if (this.voice) return;
    const ctx = this.getCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    // A triangle has enough of a harmonic to make the pitch movement audible without the
    // upper partials that would make a small detune hard to follow.
    osc.type = "triangle";
    osc.frequency.setValueAtTime(this.freq, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.02);
    osc.connect(gain);
    gain.connect(this.out!);

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(this.hz, now);

    const depth = ctx.createGain();
    depth.gain.setValueAtTime(this.half, now);
    lfo.connect(depth);
    depth.connect(osc.detune);

    const centre = ctx.createConstantSource();
    centre.offset.setValueAtTime(-this.half, now);
    centre.connect(osc.detune);

    osc.start(now);
    lfo.start(now);
    centre.start(now);

    this.voice = { osc, gain, lfo, depth, centre };
  }

  stop(): void {
    const voice = this.voice;
    if (!voice) return;
    this.voice = null;
    const now = this.ctx!.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
    voice.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    voice.osc.stop(now + 0.1);
    voice.lfo.stop(now + 0.1);
    voice.centre.stop(now + 0.1);
  }

  /** The note at the top of the swing. Changing it while sounding glides, never clicks. */
  setNote(freq: number): void {
    this.freq = freq;
    if (!this.voice) return;
    const now = this.ctx!.currentTime;
    this.voice.osc.frequency.cancelScheduledValues(now);
    this.voice.osc.frequency.setValueAtTime(this.voice.osc.frequency.value, now);
    this.voice.osc.frequency.linearRampToValueAtTime(freq, now + GLIDE);
  }

  setSpeed(hz: number): void {
    this.hz = hz;
    if (this.voice) {
      this.voice.lfo.frequency.setTargetAtTime(hz, this.ctx!.currentTime, GLIDE);
    }
  }

  setWidth(cents: number): void {
    this.cents = cents;
    this.applyDepth();
  }

  /**
   * Switching the vibrato off leaves the same tone sounding at the same pitch, which is
   * the comparison worth hearing: the steady note is exactly the top of the swing, not
   * its middle.
   */
  setVibrato(on: boolean): void {
    this.on = on;
    this.applyDepth();
  }

  private applyDepth(): void {
    if (!this.voice) return;
    const now = this.ctx!.currentTime;
    this.voice.depth.gain.setTargetAtTime(this.half, now, GLIDE);
    this.voice.centre.offset.setTargetAtTime(-this.half, now, GLIDE);
  }
}
