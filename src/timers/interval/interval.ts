export interface IntervalStep {
  name: string;
  seconds: number;
}

export interface IntervalPlanConfig {
  steps: IntervalStep[];
  rounds: number;
}

export interface IntervalPosition {
  stepIndex: number;
  round: number; // 1-based
}

/** Walks a repeating sequence of named interval steps across multiple rounds. */
export class IntervalPlan {
  constructor(public readonly config: IntervalPlanConfig) {}

  stepAt(position: IntervalPosition): IntervalStep | null {
    return this.config.steps[position.stepIndex] ?? null;
  }

  /** Returns the position that follows `position`, or null once the plan is complete. */
  next(position: IntervalPosition): IntervalPosition | null {
    const stepCount = this.config.steps.length;
    if (position.stepIndex + 1 < stepCount) {
      return { stepIndex: position.stepIndex + 1, round: position.round };
    }
    if (position.round < this.config.rounds) {
      return { stepIndex: 0, round: position.round + 1 };
    }
    return null;
  }
}

export const START_POSITION: IntervalPosition = { stepIndex: 0, round: 1 };
