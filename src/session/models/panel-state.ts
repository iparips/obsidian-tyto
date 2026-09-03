import { FailureStep } from '../../shared/models/outcome'
import { AskedEntries } from './asked-entries'
import { PanelAction } from './panel-action'

// cancelling sits between the click and the loop stopping, so the button stops
// offering while the turn is still on its way down. choosing and asking both
// park the turn on the user, and differ in how the user answers: rows on the
// entry, or the input row.
export type Phase =
  'idle' | 'recording' | 'transcribing' | 'thinking' | 'cancelling' | 'choosing' | 'asking'

export type Entry =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string }
  | { kind: 'error'; step: FailureStep; text: string }
  | { kind: 'instructions'; text: string }
  | { kind: 'command'; text: string }
  | { kind: 'warning'; text: string }
  // One entry per turn holding every step, so the panel gains a collapsed list
  // rather than a line per tool call.
  | { kind: 'steps'; steps: PanelStep[] }
  | { kind: 'answer'; text: string; sources: string[] }
  | { kind: 'cancelled'; text: string }
  // pending while the rows are live; the outcome replaces them, because a row
  // that no longer does anything is worse than a line saying what happened.
  // The candidates stay once settled, so a turn that went nowhere still records
  // what was offered.
  | { kind: 'choice'; candidates: string[]; pending: boolean; text: string }
  // pending while the question is answerable; once the turn ends its text stays
  // as a record of what was asked, and its suggestions go (FR32).
  | { kind: 'question'; pending: boolean; suggestions: string[]; text: string }

export interface PanelStep {
  label: string
  detail: string
  refused: boolean
}

export class PanelState {
  constructor(
    readonly phase: Phase,
    readonly entries: Entry[],
  ) {}

  withPhase(phase: Phase): PanelState {
    return new PanelState(phase, this.entries)
  }

  withEntry(phase: Phase, entry: Entry): PanelState {
    return new PanelState(phase, [...this.entries, entry])
  }
}

export const INITIAL_PANEL_STATE: PanelState = new PanelState('idle', [])

export class PanelReducer {
  static reduce(state: PanelState, action: PanelAction): PanelState {
    switch (action.type) {
      case 'recordingStarted':
        return state.withPhase('recording')
      case 'stopRequested':
        return state.withPhase('transcribing')
      case 'cancelled':
        return state.withPhase('idle')
      case 'transcript':
        return state.withEntry('thinking', { kind: 'user', text: action.text })
      case 'summary':
        return AskedEntries.turnEnded(state).withEntry('idle', {
          kind: 'assistant',
          text: action.text,
        })
      case 'failed':
        return AskedEntries.turnEnded(state).withEntry('idle', {
          kind: 'error',
          step: action.step,
          text: action.message,
        })
      case 'instructions':
        return state.withEntry(state.phase, { kind: 'instructions', text: action.text })
      case 'commandRan':
        return state.withEntry(state.phase, { kind: 'command', text: action.text })
      case 'warned':
        return state.withEntry(state.phase, { kind: 'warning', text: action.text })
      case 'stepTaken':
        return PanelReducer.withStep(state, {
          label: action.label,
          detail: action.detail,
          refused: action.refused,
        })
      case 'answer':
        return state.withEntry(state.phase, {
          kind: 'answer',
          text: action.text,
          sources: action.sources,
        })
      case 'cancelRequested':
        return state.withPhase('cancelling')
      case 'turnCancelled':
        return AskedEntries.turnEnded(state).withEntry('idle', {
          kind: 'cancelled',
          text: PanelReducer.cancelledText(action.writtenNotes),
        })
      case 'choiceRequested':
        return state.withEntry('choosing', {
          kind: 'choice',
          candidates: action.candidates,
          pending: true,
          text: action.purpose,
        })
      case 'choiceAnswered':
        return AskedEntries.choiceAnswered(state, action.chosen)
      case 'questionAsked':
        return state.withEntry('asking', {
          kind: 'question',
          pending: true,
          suggestions: action.suggestions,
          text: action.text,
        })
      case 'questionAnswered':
        return AskedEntries.questionAnswered(state, 'thinking')
    }
  }

  // Appended to the turn's steps entry wherever it sits, rather than only when
  // it is last: a skill or command entry landing between two steps must not
  // split one turn's record into two lists.
  private static withStep(state: PanelState, step: PanelStep): PanelState {
    const at = PanelReducer.openStepsAt(state)
    if (at === -1) return state.withEntry(state.phase, { kind: 'steps', steps: [step] })
    const open = state.entries[at] as { kind: 'steps'; steps: PanelStep[] }
    return new PanelState(
      state.phase,
      state.entries.with(at, { kind: 'steps', steps: [...open.steps, step] }),
    )
  }

  // The last steps entry after the last utterance, since an utterance is where
  // one turn ends and the next begins.
  private static openStepsAt(state: PanelState): number {
    const turnStart = state.entries.findLastIndex((entry) => entry.kind === 'user')
    const within = state.entries.slice(turnStart + 1)
    const at = within.findLastIndex((entry) => entry.kind === 'steps')
    return at === -1 ? -1 : turnStart + 1 + at
  }

  // Naming the notes is the whole of what a cancel owes the user: nothing is
  // reverted, so the panel says where to look.
  private static cancelledText(writtenNotes: readonly string[]): string {
    if (writtenNotes.length === 0) return 'Stopped. Nothing was changed.'
    return `Stopped. Already changed: ${writtenNotes.join(', ')}`
  }
}
