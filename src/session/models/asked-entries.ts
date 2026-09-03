import { Entry, PanelState, Phase } from './panel-state'

// What becomes of an entry the user was asked to act on, once they have acted
// or the turn has ended. A pending control that no longer does anything is
// worse than a line saying what happened.
export class AskedEntries {
  // Back to thinking rather than idle: the turn is still running, and the panel
  // reads as the turn continuing rather than as one that ended.
  static openAnswered(state: PanelState, granted: boolean): PanelState {
    return new PanelState(
      'thinking',
      state.entries.map((entry) => AskedEntries.settledConfirm(entry, granted)),
    )
  }

  // The text stays and the suggestions go, so a user who dismissed the notice
  // can still read what was asked without a control that no longer acts (FR32).
  static questionAnswered(state: PanelState, phase: Phase): PanelState {
    return new PanelState(
      phase,
      state.entries.map((entry) =>
        entry.kind === 'question' && entry.pending ? { ...entry, pending: false } : entry,
      ),
    )
  }

  // A turn that ends leaves nothing answerable behind it, so both askers'
  // entries settle whichever way the turn went.
  static turnEnded(state: PanelState): PanelState {
    return AskedEntries.questionAnswered(AskedEntries.openAnswered(state, false), state.phase)
  }

  private static settledConfirm(entry: Entry, granted: boolean): Entry {
    if (entry.kind !== 'confirm' || !entry.pending) return entry
    return { ...entry, pending: false, text: AskedEntries.outcomeText(entry.path, granted) }
  }

  private static outcomeText(path: string, granted: boolean): string {
    return granted ? `Opened ${path}` : `Declined ${path}`
  }
}
