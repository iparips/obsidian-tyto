import { FailureStep } from '../../shared/models/outcome'

export type Phase = 'idle' | 'recording' | 'transcribing' | 'thinking'

export type Entry =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string }
  | { kind: 'error'; step: FailureStep; text: string }
  | { kind: 'instructions'; text: string }

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
    }
  }
}
