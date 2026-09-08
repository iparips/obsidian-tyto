import { IterationBudget } from './iteration-budget'
import { RepeatedRefusal } from './repeated-refusal'

// What one turn spends as it runs: its iterations, and how many times running
// it was refused the same way. Held together because both outlive an iteration
// and neither outlives the turn.
export class TurnSpend {
  readonly iterationBudget = new IterationBudget()
  readonly repeatedRefusal = new RepeatedRefusal()

  isExhausted(): boolean {
    return this.iterationBudget.isSpent()
  }
}
