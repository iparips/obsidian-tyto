import { TurnEndingKind } from '../../../engine/turn/ending/turn-ending-kind'

// One of the four things a model call is made of. The history is not one: it is
// already in SessionRepository, and a step cites the slice it was sent.
export type PartName = 'systemPrompt' | 'dateMessage' | 'sessionTarget'

// A part's text, kept once and cited from every step that sent it. Versions run
// from 1 per part, so a step cites "system prompt v2" rather than an offset.
export class TranscriptPart {
  constructor(
    readonly name: PartName,
    readonly version: number,
    readonly text: string,
  ) {}
}

// Half-open at the top while the step is still the last one recorded: an index
// range into the panel's steps, closed by the next recording or the turn's end.
// A range rather than a count, because a count only means anything while this
// process is publishing.
export class StepRange {
  constructor(
    readonly first: number,
    readonly last: number,
  ) {}

  isEmpty(): boolean {
    return this.last < this.first
  }

  extendedTo(index: number): StepRange {
    return new StepRange(this.first, index)
  }
}

// What one pass of the turn loop sent and owns: the parts it cited by version,
// the slice of chat history it carried, and the progress lines running its tool
// calls produced.
export class RecordedTurnStep {
  constructor(
    readonly turn: number,
    readonly step: number,
    readonly parts: readonly TranscriptPart[],
    readonly history: StepRange,
    readonly progressLines: StepRange,
  ) {}

  withProgressLines(progressLines: StepRange): RecordedTurnStep {
    return new RecordedTurnStep(this.turn, this.step, this.parts, this.history, progressLines)
  }

  partNamed(name: PartName): TranscriptPart | null {
    return this.parts.find((part) => part.name === name) ?? null
  }
}

// How a turn ended, and the step the harness decided it at. Both are needed:
// the same ending at step 1 and at step 20 are different failures.
export class RecordedEnding {
  constructor(
    readonly turn: number,
    readonly kind: TurnEndingKind,
    readonly step: number,
  ) {}
}
