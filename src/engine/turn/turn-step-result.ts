import { Outcome } from '../../shared/models/outcome'

// What one step of the loop decided: the turn ended here, or it has more to do.
// Two states rather than a nullable outcome, so a step that keeps going says so
// rather than returning nothing and leaving the loop to read the absence.
export type TurnStepResult = TurnEnded | TurnContinues

// The step reached an ending, and the outcome it carries is the turn's.
export class TurnEnded {
  constructor(readonly outcome: Outcome<string>) {}

  hasEnded(): this is TurnEnded {
    return true
  }
}

// The step did its work and settled nothing, so the loop runs another.
export class TurnContinues {
  hasEnded(): this is TurnEnded {
    return false
  }
}

// Built here rather than at the call sites, so a step reads as the decision it
// made rather than as the class it constructs.
export class TurnStepResults {
  static ended(outcome: Outcome<string>): TurnStepResult {
    return new TurnEnded(outcome)
  }

  static keepGoing(): TurnStepResult {
    return new TurnContinues()
  }
}
