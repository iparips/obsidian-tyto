import { ChatMessage } from '../../model/providers/types'
import { ProgressLine } from '../models/panel-state'
import { TurnEndingKind } from '../../engine/turn/ending/turn-ending-kind'
import { LoadedSkills } from './loaded-skills'
import { RecordedEnding, RecordedTurnStep } from './models/transcript-record'
import { TranscriptSource } from './models/transcript-source'
import { TranscriptTurn } from './models/transcript-turn'
import { TranscriptEntryLines } from './transcript-entry-lines'
import { TranscriptTurnStep } from './transcript-turn-step'

// One conversation turn: the utterance, the harness work before the first model
// call, the turn steps it spent, and whatever the panel showed beside them.
// The turn's own closing note, which carries no tool calls and is neither the
// utterance nor a tool result.
const isModelText = (message: ChatMessage): boolean =>
  !message.hasToolCalls() && !message.isUser() && !message.isToolResult() && !message.isSystem()

export class TranscriptTurnSection {
  constructor(
    private source: TranscriptSource,
    private progressLines: readonly ProgressLine[],
    private skills: LoadedSkills,
  ) {}

  write(turn: TranscriptTurn): string[] {
    const steps = this.source.stepsOfTurn(turn.index)
    return [
      `## Conversation turn ${turn.index + 1}`,
      '',
      `Utterance: ${turn.utterance}`,
      '',
      ...this.setup(turn.index, steps),
      ...steps.flatMap((step, index) => [...this.step(step, steps, index), '']),
      ...turn.entriesBesideSteps().flatMap((entry) => [...TranscriptEntryLines.of(entry), '']),
    ]
  }

  // TurnRunnerFactory resolves the note and collects its AGENTS.md chain before
  // the loop starts, so what it narrates belongs ahead of the first step rather
  // than inside a step no model call produced.
  // Bounded at both ends. A turn that spent no steps has no first step to slice
  // to, so an unbounded start would reprint every line the session ever had.
  private setup(turn: number, steps: readonly RecordedTurnStep[]): string[] {
    const before = this.progressLines.slice(
      this.previousTurnEndedAt(turn),
      steps[0]?.progressLines.first ?? this.progressLines.length,
    )
    if (before.length === 0) return []
    return ['### Setup', '', ...before.map(TranscriptEntryLines.line), '']
  }

  // The line after the last one any earlier turn claimed. A step that published
  // nothing carries an empty range, so the search skips it rather than slicing
  // from a last that sits below its first.
  private previousTurnEndedAt(turn: number): number {
    const earlier = this.source.steps.filter(
      (step) => step.turn < turn && !step.progressLines.isEmpty(),
    )
    const last = earlier.at(-1)
    return last ? last.progressLines.last + 1 : 0
  }

  // The step's own answer opens the next step's history slice, so a step is
  // written from the slice it was sent and the one after it.
  private step(step: RecordedTurnStep, steps: readonly RecordedTurnStep[], at: number): string[] {
    const last = at === steps.length - 1
    const ending = last ? this.source.endingOfTurn(step.turn) : null
    return TranscriptTurnStep.write(
      step,
      {
        sent: this.slice(step),
        answered: this.answered(step, steps[at + 1], ending),
        harnessNotes: this.harnessNotesAfter(step),
      },
      this.progressLinesOf(step),
      ending,
      this.skills,
    )
  }

  // Every step but the session's last is followed by one whose Request block
  // carries the messages after it, since a recorded step opens where the one
  // before it closed. The last has no such step, so a retarget appended once
  // the session went idle is only written if its Harness block says it.
  private harnessNotesAfter(step: RecordedTurnStep): readonly ChatMessage[] {
    if (step !== this.source.steps.at(-1)) return []
    return this.tail(step).filter((message) => message.isSystem())
  }

  // The last step has no step after it, so its answer sits in the tail. On four
  // of the five endings TurnEndingService closes that tail with the turn's own
  // note, which is the harness speaking rather than the model.
  private answered(
    step: RecordedTurnStep,
    next: RecordedTurnStep | undefined,
    ending: RecordedEnding | null,
  ): readonly ChatMessage[] {
    if (next) return this.slice(next)
    const tail = this.tail(step)
    if (!ending || ending.kind === TurnEndingKind.Replied) return tail
    return tail.slice(0, TranscriptTurnSection.lastModelNoteAt(tail))
  }

  private static lastModelNoteAt(tail: readonly ChatMessage[]): number {
    const at = tail.findLastIndex((message) => isModelText(message))
    return at === -1 ? tail.length : at
  }

  private progressLinesOf(step: RecordedTurnStep): ProgressLine[] {
    if (step.progressLines.isEmpty()) return []
    return this.progressLines.slice(step.progressLines.first, step.progressLines.last + 1)
  }

  private slice(step: RecordedTurnStep): readonly ChatMessage[] {
    return this.source.chatHistory.slice(step.history.first, step.history.last + 1)
  }

  // What a step got back when no step of its own turn follows it: the messages
  // the turn appended once the loop stopped. Bounded by the next step of the
  // session rather than running to the end of the history, since a turn that
  // replied is followed by the next turn's work and that belongs to that turn.
  private tail(step: RecordedTurnStep): readonly ChatMessage[] {
    return this.source.chatHistory.slice(step.history.last + 1, this.nextStepStartsAt(step))
  }

  // Undefined where nothing follows, which slices to the end of the history.
  private nextStepStartsAt(step: RecordedTurnStep): number | undefined {
    const at = this.source.steps.indexOf(step)
    return this.source.steps[at + 1]?.history.first
  }
}
