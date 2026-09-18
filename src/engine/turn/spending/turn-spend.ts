import { IterationCounter } from './iteration-counter'
import { RepeatedRefusalCounter } from './repeated-refusal-counter'

// What one turn spends as it runs: its iterations, and how many times running
// it was refused the same way. Held together because both outlive an iteration
// and neither outlives the turn.
export class TurnSpend {
  readonly iterationCounter: IterationCounter
  readonly repeatedRefusalCounter = new RepeatedRefusalCounter()

  constructor(maxIterations?: number) {
    this.iterationCounter = new IterationCounter(maxIterations)
  }

  isExhausted(): boolean {
    return this.iterationCounter.isSpent()
  }
}
