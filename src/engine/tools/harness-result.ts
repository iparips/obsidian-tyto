import { PathsReturnedByVaultRepository } from '../../search/models/paths-returned-by-vault-repository'
import { TurnBudget } from '../turn/turn-budget'
import {
  ChoiceResult,
  ObsidianCommandRanResult,
  OpenNoteResult,
  TextResult,
} from './harness-results'

// What the harness tools return. The kind each class carries says what the
// dispatcher must do next, because a tool can run a command or filter a
// shortlist but cannot move the session or park a turn on a person.
export type HarnessResult = TextResult | ChoiceResult | OpenNoteResult | ObsidianCommandRanResult

// What a tool reads off the turn it runs in. Narrower than TurnRepository, so
// the tools see the two counters they spend and nothing else.
export interface TurnState {
  readonly turnBudget: TurnBudget
  readonly pathsReturnedByVault: PathsReturnedByVaultRepository
  // Told when the model looks past the note the turn started on, which is what
  // makes the inherited binding no longer a safe edit target.
  searchRan(): void
}

// Shared by every tool that can refuse, so a cap message and a bad argument
// reach the model in one shape rather than two.
export class Refusal {
  static of(reason: string): HarnessResult {
    return TextResult.refusing(reason)
  }
}
