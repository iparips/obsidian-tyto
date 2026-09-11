import { ChatMessage } from '../../model/providers/types'
import { PanelStep } from '../models/panel-state'
import { TurnEndingKind } from '../../engine/turn/turn-ending-kind'
import { LoadedSkills } from './models/loaded-skills'
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
    private panelSteps: readonly PanelStep[],
    private skills: LoadedSkills,
  ) {}

  write(turn: TranscriptTurn): string[] {
    const steps = this.source.stepsOfTurn(turn.index)
    return [
      `## Conversation turn ${turn.index + 1}`,
      '',
      `Utterance: ${turn.utterance}`,
      '',
      ...this.setup(steps),
      ...steps.flatMap((step, index) => [...this.step(step, steps, index), '']),
      ...turn.entriesBesideSteps().flatMap((entry) => [...TranscriptEntryLines.of(entry), '']),
    ]
  }

  // TurnRunnerFactory resolves the note and collects its AGENTS.md chain before
  // the loop starts, so what it narrates belongs ahead of the first step rather
  // than inside a step no model call produced.
  private setup(steps: readonly RecordedTurnStep[]): string[] {
    const before = this.panelSteps.slice(0, steps[0]?.panelSteps.first ?? this.panelSteps.length)
    if (before.length === 0) return []
    return ['### Setup', '', ...before.map(TranscriptEntryLines.step), '']
  }

  // The step's own answer opens the next step's history slice, so a step is
  // written from the slice it was sent and the one after it.
  private step(step: RecordedTurnStep, steps: readonly RecordedTurnStep[], at: number): string[] {
    const last = at === steps.length - 1
    const ending = last ? this.source.endingOfTurn(step.turn) : null
    return TranscriptTurnStep.write(
      step,
      { sent: this.slice(step), answered: this.answered(step, steps[at + 1], ending) },
      this.panelStepsOf(step),
      ending,
      this.skills,
    )
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

  private panelStepsOf(step: RecordedTurnStep): PanelStep[] {
    if (step.panelSteps.isEmpty()) return []
    return this.panelSteps.slice(step.panelSteps.first, step.panelSteps.last + 1)
  }

  private slice(step: RecordedTurnStep): readonly ChatMessage[] {
    return this.source.chatHistory.slice(step.history.first, step.history.last + 1)
  }

  // The last step has no step after it, so what it got back is whatever the
  // turn appended to the history once the loop stopped.
  private tail(step: RecordedTurnStep): readonly ChatMessage[] {
    return this.source.chatHistory.slice(step.history.last + 1)
  }
}
