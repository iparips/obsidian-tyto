import { NoteOpenedByObsidianCommand } from '../../commands/models/note-opened-by-obsidian-command'
import { ChoiceRequest } from './choice-request'
import { TurnStep } from '../turn-step'
import { HarnessResultKind } from './harness-result-kind'

// One class per kind, so a tool constructs its result rather than assembling an
// object literal the type checks structurally. The kind is readonly on each, so
// the union still narrows on it.

// Nothing further: a glob, a grep, a read. The text is the whole result.
export class TextResult {
  readonly kind = HarnessResultKind.Text as const

  constructor(
    readonly result: string,
    readonly publishStepSummary?: TurnStep,
  ) {}

  // Every refusal is a step, since it spent an iteration and is usually what the
  // user most needs to see when a turn goes nowhere.
  static refusing(reason: string): TextResult {
    return new TextResult(reason, TurnStep.refusedByUnnamedTool(reason))
  }
}

// Park the turn until a person picks one of the offered notes.
export class ChoiceResult {
  readonly kind = HarnessResultKind.Choice as const

  constructor(
    readonly result: string,
    readonly presentChoiceToUser: ChoiceRequest,
    readonly publishStepSummary?: TurnStep,
  ) {}
}

// Open this path and move the session onto it.
export class OpenNoteResult {
  readonly kind = HarnessResultKind.OpenNote as const

  constructor(
    readonly result: string,
    readonly openNoteAtPath: string,
    readonly publishStepSummary?: TurnStep,
  ) {}
}

// A command ran, and may have moved the note under the session. It carries no
// result text: what the model is told depends on whether the opened note turned
// out to be editable, which only the dispatcher can observe.
export class ObsidianCommandRanResult {
  readonly kind = HarnessResultKind.ObsidianCommandRan as const
  readonly result = ''

  constructor(
    readonly recordNoteOpenedByObsidianCommand: NoteOpenedByObsidianCommand,
    readonly publishStepSummary?: TurnStep,
  ) {}
}
