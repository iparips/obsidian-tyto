import { Outcome } from '../../../shared/models/outcome'
import { TurnEndingKind } from './turn-ending-kind'

// What one step of the loop decided: the turn ended here, or it has more to do.
// Two states rather than a nullable outcome, so a step that keeps going says so
// rather than returning nothing and leaving the loop to read the absence.
export type TurnStepOutcome = EndedTurn | TurnContinues

// The step reached an ending, and the outcome it carries is the turn's. The
// kind travels beside it because the outcome cannot say which ending it was:
// TurnOutcomes builds exhausted and stuck as the same chat failure.
export class EndedTurn {
  constructor(
    readonly kind: TurnEndingKind,
    readonly outcome: Outcome<string>,
  ) {}

  turnEnded(): this is EndedTurn {
    return true
  }
}

// The step did its work and settled nothing, so the loop runs another.
export class TurnContinues {
  turnEnded(): this is EndedTurn {
    return false
  }
}

// Built here rather than at the call sites, so a step reads as the decision it
// made rather than as the class it constructs.
export class TurnStepOutcomes {
  static endedTurn(kind: TurnEndingKind, outcome: Outcome<string>): EndedTurn {
    return new EndedTurn(kind, outcome)
  }

  static keepGoing(): TurnStepOutcome {
    return new TurnContinues()
  }
}
