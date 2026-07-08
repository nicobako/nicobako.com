export interface Lap {
  number: number;
  /** Time elapsed since the previous lap. */
  splitMs: number;
  /** Cumulative time since the stopwatch started. */
  totalMs: number;
}

export type StopwatchTickHandler = (elapsedMs: number) => void;

export class Stopwatch {
  laps: Lap[] = [];

  private startTime = 0;
  private elapsedAtPause = 0;
  private lastLapTotalMs = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly onTick: StopwatchTickHandler) {}

  get isRunning(): boolean {
    return this.intervalId !== null;
  }

  get elapsedMs(): number {
    return this.isRunning ? Date.now() - this.startTime : this.elapsedAtPause;
  }

  start(): void {
    if (this.isRunning) return;
    this.startTime = Date.now() - this.elapsedAtPause;
    this.intervalId = setInterval(() => this.onTick(this.elapsedMs), 200);
  }

  pause(): void {
    if (!this.isRunning) return;
    this.elapsedAtPause = Date.now() - this.startTime;
    clearInterval(this.intervalId!);
    this.intervalId = null;
  }

  reset(): void {
    this.pause();
    this.elapsedAtPause = 0;
    this.lastLapTotalMs = 0;
    this.laps = [];
  }

  lap(): Lap {
    const totalMs = this.elapsedMs;
    const entry: Lap = {
      number: this.laps.length + 1,
      splitMs: totalMs - this.lastLapTotalMs,
      totalMs,
    };
    this.lastLapTotalMs = totalMs;
    this.laps.push(entry);
    return entry;
  }
}

export function formatStopwatch(ms: number): string {
  const totalCentis = Math.floor(ms / 10);
  const centis = totalCentis % 100;
  const totalSeconds = Math.floor(totalCentis / 100);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  const cc = String(centis).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}.${cc}` : `${mm}:${ss}.${cc}`;
}
