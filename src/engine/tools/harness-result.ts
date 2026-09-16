import { OpenNote } from '../note-editing/open-note'
import { PathsReturnedByVaultRepository } from '../turn/paths-returned-by-vault-repository'
import { NotesOpenedCounter } from '../turn/notes-opened-counter'
import { NotesReadRepository } from '../turn/notes-read-repository'
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
// the tools see the counters they spend and the reads they record, and nothing
// else.
export interface TurnState {
  readonly notesOpenedCounter: NotesOpenedCounter
  readonly pathsReturnedByVault: PathsReturnedByVaultRepository
  readonly notesRead: NotesReadRepository
  // Null while the session is unbound. A read of this note comes from the
  // editor it holds, which is where the turn's writes go.
  targetNote(): OpenNote | null
}

// Shared by every tool that can refuse, so a cap message and a bad argument
// reach the model in one shape rather than two.
export class Refusal {
  static of(reason: string): HarnessResult {
    return TextResult.refusing(reason)
  }
}
