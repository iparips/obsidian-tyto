import { ChatMessage } from '../../../model/providers/types'
import { Entry } from '../../models/panel-state'
import { OwlSettings } from '../../../settings/settings'
import { RecordedEnding, RecordedTurnStep, TranscriptPart } from './transcript-record'

// Where the transcript is copied from and when, so the document is a pure
// function of its inputs and the clock is the caller's problem.
export interface TranscriptSession {
  copiedAt: Date
  pluginVersion: string
  notePath: string | null
}

// Everything one transcript is made of, gathered where the panel and the store
// sit side by side. A value, so the document takes one argument rather than
// six every caller keeps in order.
export class TranscriptSource {
  constructor(
    readonly session: TranscriptSession,
    readonly settings: OwlSettings,
    readonly entries: readonly Entry[],
    readonly chatHistory: readonly ChatMessage[],
    readonly steps: readonly RecordedTurnStep[],
    readonly endings: readonly RecordedEnding[],
    readonly parts: readonly TranscriptPart[],
  ) {}

  stepsOfTurn(turn: number): readonly RecordedTurnStep[] {
    return this.steps.filter((step) => step.turn === turn)
  }

  endingOfTurn(turn: number): RecordedEnding | null {
    return this.endings.find((ending) => ending.turn === turn) ?? null
  }
}
