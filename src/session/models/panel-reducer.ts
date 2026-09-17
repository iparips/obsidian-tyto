import { AskedEntries } from './asked-entries'
import { PanelAction } from './panel-action'
import { PanelState, ProgressLine } from './panel-state'

export class PanelReducer {
  static reduce(state: PanelState, action: PanelAction): PanelState {
    switch (action.type) {
      case 'recordingStarted':
        return PanelReducer.withNothingToRetry(state).withPhase('recording')
      case 'stopRequested':
        return state.withPhase('transcribing')
      case 'cancelled':
        return state.withPhase('idle')
      // Opens a turn rather than appending beside one. The target starts as the
      // session's note, which is the answer for the majority of turns that name
      // no note at all (D5).
      case 'transcript':
        return PanelReducer.withNothingToRetry(state).withItem('thinking', {
          kind: 'turn',
          target: action.target,
          entries: [{ kind: 'user', text: action.text }],
        })
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
          retryable: action.retryable,
        })
      case 'instructions':
        return state.withEntry(state.phase, { kind: 'instructions', text: action.text })
      case 'warned':
        return state.withEntry(state.phase, { kind: 'warning', text: action.text })
      // The change worth seeing: a turn starts on the session's note and only a
      // tool moves it, so the turn shows the note it is on now (D5).
      case 'targetMoved':
        return state.withOpenTurn((turn) => ({ ...turn, target: action.path }))
      case 'progressLine':
        return PanelReducer.withProgressLine(state, {
          label: action.label,
          detail: action.detail,
          refused: action.refused,
          note: action.note,
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
          text: PanelReducer.cancelledText(action.notesWritten),
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

  // Both callers are moments the panel stops holding the audio: a transcript
  // came back, or a new recording replaced it. The control would otherwise
  // retry an utterance that is gone.
  private static withNothingToRetry(state: PanelState): PanelState {
    return state.mapEntries((entry) =>
      entry.kind === 'error' && entry.retryable ? { ...entry, retryable: false } : entry,
    )
  }

  // Into the open turn's progress entry wherever it sits, rather than only when
  // it is last: a skill or command entry landing between two lines must not
  // split one turn's record into two lists.
  private static withProgressLine(state: PanelState, line: ProgressLine): PanelState {
    return state.withOpenTurn((turn) => {
      const at = turn.entries.findLastIndex((entry) => entry.kind === 'progress')
      if (at === -1)
        return { ...turn, entries: [...turn.entries, { kind: 'progress', lines: [line] }] }
      const open = turn.entries[at] as { kind: 'progress'; lines: ProgressLine[] }
      return {
        ...turn,
        entries: turn.entries.with(at, { kind: 'progress', lines: [...open.lines, line] }),
      }
    })
  }

  // Naming the notes is the whole of what a cancel owes the user: nothing is
  // reverted, so the panel says where to look.
  private static cancelledText(notesWritten: readonly string[]): string {
    if (notesWritten.length === 0) return 'Stopped. Nothing was changed.'
    return `Stopped. Already changed: ${notesWritten.join(', ')}`
  }
}
