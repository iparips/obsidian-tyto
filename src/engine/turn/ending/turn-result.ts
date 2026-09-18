import { Outcome } from '../../../shared/models/outcome'
import { TurnEndingKind } from './turn-ending-kind'
import { EndedTurn } from './turn-step-outcome'

// What a finished turn hands back: the outcome the panel acts on, and the kind
// it cannot read off that outcome. A class rather than a pair, so the panel asks
// a question rather than destructuring a position.
export class TurnResult {
  private constructor(
    readonly kind: TurnEndingKind,
    readonly outcome: Outcome<string>,
  ) {}

  static of(kind: TurnEndingKind, outcome: Outcome<string>): TurnResult {
    return new TurnResult(kind, outcome)
  }

  static ofEndedTurn(endedTurn: EndedTurn): TurnResult {
    return new TurnResult(endedTurn.kind, endedTurn.outcome)
  }

  answered(): boolean {
    return this.kind === TurnEndingKind.Answered
  }
}
