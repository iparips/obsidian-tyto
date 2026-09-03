import { Entry, PanelState, Phase } from './panel-state'

// What becomes of an entry the user was asked to act on, once they have acted
// or the turn has ended. A pending control that no longer does anything is
// worse than a line saying what happened.
export class AskedEntries {
  // Back to thinking rather than idle: the turn is still running, and the panel
  // reads as the turn continuing rather than as one that ended.
  static choiceAnswered(state: PanelState, chosen: string | null): PanelState {
    return new PanelState(
      'thinking',
      state.entries.map((entry) => AskedEntries.settledChoice(entry, chosen)),
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
  // entries settle whichever way the turn went. A choice the user never made is
  // the third outcome, and it says the turn ended rather than that they
  // declined.
  static turnEnded(state: PanelState): PanelState {
    return AskedEntries.questionAnswered(AskedEntries.unanswered(state), state.phase)
  }

  private static unanswered(state: PanelState): PanelState {
    return new PanelState(
      state.phase,
      state.entries.map((entry) => AskedEntries.settled(entry, UNANSWERED_TEXT)),
    )
  }

  private static settledChoice(entry: Entry, chosen: string | null): Entry {
    return AskedEntries.settled(entry, AskedEntries.outcomeText(chosen))
  }

  private static settled(entry: Entry, text: string): Entry {
    if (entry.kind !== 'choice' || !entry.pending) return entry
    return { ...entry, pending: false, text }
  }

  // The pick is named, so the panel records which note the turn was let into.
  private static outcomeText(chosen: string | null): string {
    return chosen === null ? DECLINED_TEXT : `Chose ${chosen}`
  }
}

const DECLINED_TEXT = 'Declined every note offered'
const UNANSWERED_TEXT = 'The turn ended before you picked a note'
