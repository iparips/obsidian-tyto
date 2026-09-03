import { FailureStep } from '../../shared/models/outcome'

// cancelling sits between the click and the loop stopping, so the button stops
// offering while the turn is still on its way down.
export type Phase = 'idle' | 'recording' | 'transcribing' | 'thinking' | 'cancelling'

export type Entry =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string }
  | { kind: 'error'; step: FailureStep; text: string }
  | { kind: 'instructions'; text: string }
  | { kind: 'command'; text: string }
  | { kind: 'answer'; text: string; sources: string[] }
  | { kind: 'cancelled'; text: string }

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

export type PanelAction =
  | { type: 'recordingStarted' }
  | { type: 'stopRequested' }
  | { type: 'cancelled' }
  | { type: 'transcript'; text: string }
  | { type: 'summary'; text: string }
  | { type: 'failed'; step: FailureStep; message: string }
  | { type: 'instructions'; text: string }
  | { type: 'commandRan'; text: string }
  | { type: 'answer'; text: string; sources: string[] }
  | { type: 'cancelRequested' }
  | { type: 'turnCancelled'; writtenNotes: readonly string[] }

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
        return state.withEntry('idle', { kind: 'assistant', text: action.text })
      case 'failed':
        return state.withEntry('idle', {
          kind: 'error',
          step: action.step,
          text: action.message,
        })
      case 'instructions':
        return state.withEntry(state.phase, { kind: 'instructions', text: action.text })
      case 'commandRan':
        return state.withEntry(state.phase, { kind: 'command', text: action.text })
      case 'answer':
        return state.withEntry(state.phase, {
          kind: 'answer',
          text: action.text,
          sources: action.sources,
        })
      case 'cancelRequested':
        return state.withPhase('cancelling')
      case 'turnCancelled':
        return state.withEntry('idle', {
          kind: 'cancelled',
          text: PanelReducer.cancelledText(action.writtenNotes),
        })
    }
  }

  // Naming the notes is the whole of what a cancel owes the user: nothing is
  // reverted, so the panel says where to look.
  private static cancelledText(writtenNotes: readonly string[]): string {
    if (writtenNotes.length === 0) return 'Stopped. Nothing was changed.'
    return `Stopped. Already changed: ${writtenNotes.join(', ')}`
  }
}
