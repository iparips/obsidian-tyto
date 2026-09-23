import { AnswerCorrectionsCounter } from './answer-corrections-counter'
import { IterationCounter } from './iteration-counter'
import { RepeatedRefusalCounter } from './repeated-refusal-counter'

// What one turn spends as it runs: its iterations, how many times running it
// was refused the same way, and how many times it was sent back to answer
// through the tool. Held together because each outlives an iteration and none
// outlives the turn.
export class TurnSpend {
  readonly iterationCounter: IterationCounter
  readonly repeatedRefusalCounter = new RepeatedRefusalCounter()
  readonly answerCorrectionsCounter = new AnswerCorrectionsCounter()

  constructor(maxIterations?: number) {
    this.iterationCounter = new IterationCounter(maxIterations)
  }

  isExhausted(): boolean {
    return this.iterationCounter.isSpent()
  }
}
