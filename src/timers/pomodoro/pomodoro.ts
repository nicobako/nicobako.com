export type Phase = "work" | "shortBreak" | "longBreak";

export interface PomodoroConfig {
  workMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  /** Number of completed work sessions before a long break is taken. */
  longBreakEvery: number;
}

export const PHASE_LABEL: Record<Phase, string> = {
  work: "Focus",
  shortBreak: "Short Break",
  longBreak: "Long Break",
};

/**
 * Tracks which phase (focus / short break / long break) is current and how
 * many work sessions have been completed. Does not run a clock itself —
 * pair it with src/timers/shared/countdown.ts's `Countdown`.
 */
export class PomodoroCycle {
  phase: Phase = "work";
  completedWorkSessions = 0;

  constructor(public config: PomodoroConfig) {}

  durationMs(phase: Phase = this.phase): number {
    const minutes =
      phase === "work"
        ? this.config.workMin
        : phase === "shortBreak"
          ? this.config.shortBreakMin
          : this.config.longBreakMin;
    return minutes * 60_000;
  }

  /** Advances to the next phase once the current one's countdown finishes. */
  advance(): Phase {
    if (this.phase === "work") {
      this.completedWorkSessions++;
      this.phase =
        this.completedWorkSessions % this.config.longBreakEvery === 0
          ? "longBreak"
          : "shortBreak";
    } else {
      this.phase = "work";
    }
    return this.phase;
  }

  reset(): void {
    this.phase = "work";
    this.completedWorkSessions = 0;
  }
}
