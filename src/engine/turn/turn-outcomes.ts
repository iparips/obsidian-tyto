import { Outcomes } from '../../shared/models/outcome'
import { IterationCounter } from './iteration-counter'
import { RepeatedRefusalCounter } from './repeated-refusal-counter'
import { TurnEndingKind } from './turn-ending-kind'
import { EndedTurn, TurnStepOutcomes } from './turn-step-outcome'

// The endings a turn reaches without writing anything down, built from what the
// turn spent rather than from anything it holds. The endings that do write to
// history are TurnEndingService. Each names the ending it is, so the two read
// the same way at the call site and neither is paired with a kind by hand.
export class TurnOutcomes {
  // Ends on the reason itself, since a model refused the same way twice will
  // spend every remaining step being refused a third way.
  static stuck(refusals: RepeatedRefusalCounter): EndedTurn {
    return TurnStepOutcomes.endedTurn(
      TurnEndingKind.Stuck,
      Outcomes.failure('chat', refusals.message()),
    )
  }

  // Points at the steps list rather than repeating it: every step is numbered
  // there, so where the turn went is already on screen.
  static exhausted(): EndedTurn {
    return TurnStepOutcomes.endedTurn(
      TurnEndingKind.Exhausted,
      Outcomes.failure(
        'chat',
        `Owl ran out of steps for this turn after ${IterationCounter.max()}. The steps list shows where they went. Try a smaller instruction, or say which note to use.`,
      ),
    )
  }

  // The history keeps the fact rather than the partial results, so the next turn
  // knows the work stopped without being invited to resume it.
  static cancelledNote(written: readonly string[]): string {
    if (written.length === 0) return 'The user stopped this turn. Nothing was changed.'
    return `The user stopped this turn. Already changed: ${written.join(', ')}.`
  }
}
