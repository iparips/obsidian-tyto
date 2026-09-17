import { FailureStep } from '../../shared/models/outcome'

// cancelling sits between the click and the loop stopping, so the button stops
// offering while the turn is still on its way down. choosing and asking both
// park the turn on the user, and differ in how the user answers: rows on the
// entry, or the input row.
export type Phase =
  'idle' | 'recording' | 'transcribing' | 'thinking' | 'cancelling' | 'choosing' | 'asking'

export type PanelEntry =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string }
  // retryable only where the panel still holds the audio behind the failure,
  // which is why the reducer is told rather than deriving it from the step.
  | { kind: 'error'; step: FailureStep; text: string; retryable?: boolean }
  | { kind: 'instructions'; text: string }
  | { kind: 'warning'; text: string }
  // One entry per turn holding every step, so the panel gains a collapsed list
  // rather than a line per tool call.
  | { kind: 'progress'; lines: ProgressLine[] }
  | { kind: 'answer'; text: string; sources: string[] }
  | { kind: 'cancelled'; text: string }
  // Where a restored session picks up, naming when it was last written. A
  // restored panel is otherwise identical to one that never went away, so
  // without this a restore is invisible (FR7b).
  | { kind: 'restored'; text: string }
  // pending while the rows are live; the outcome replaces them, because a row
  // that no longer does anything is worse than a line saying what happened.
  // The candidates stay once settled, so a turn that went nowhere still records
  // what was offered.
  | { kind: 'choice'; candidates: string[]; pending: boolean; text: string }
  // pending while the question is answerable; once the turn ends its text stays
  // as a record of what was asked, and its suggestions go (FR32).
  | { kind: 'question'; pending: boolean; suggestions: string[]; text: string }

// One turn and everything that belongs to it: the utterance that opened it, the
// note it is writing to, and the entries it produced, the first of which is the
// utterance as the panel renders it. A container rather than a convention, so
// nothing scans back to a user entry to find out what belongs where (D6).
export type PanelTurn = {
  kind: 'turn'
  // Null while the session is unbound. Starts as the session's note and moves
  // only when a tool opens another (D5).
  target: string | null
  entries: PanelEntry[]
}

// What the panel holds at the top level: turns, and the entries belonging to no
// turn, which is a restore marker.
export type PanelItem = PanelTurn | PanelEntry

export interface ProgressLine {
  label: string
  detail: string
  refused: boolean
  // The note the line acted on, null where it acted on none. Stored rather than
  // compared here, so a restored session shows what it showed.
  note: string | null
}

export class PanelState {
  constructor(
    readonly phase: Phase,
    readonly entries: PanelItem[],
  ) {}

  withPhase(phase: Phase): PanelState {
    return new PanelState(phase, this.entries)
  }

  // Into the open turn, which is where everything a turn produces belongs. Only
  // a restore marker goes beside one, through withItem.
  withEntry(phase: Phase, entry: PanelEntry): PanelState {
    const open = this.openTurnAt()
    if (open === -1) return this.withItem(phase, entry)
    const turn = this.entries[open] as PanelTurn
    return new PanelState(
      phase,
      this.entries.with(open, { ...turn, entries: [...turn.entries, entry] }),
    )
  }

  withItem(phase: Phase, item: PanelItem): PanelState {
    return new PanelState(phase, [...this.entries, item])
  }

  // The turn the panel is adding to, which is the last one: a turn opens on an
  // utterance and nothing reopens an earlier one.
  withOpenTurn(change: (turn: PanelTurn) => PanelTurn): PanelState {
    const open = this.openTurnAt()
    if (open === -1) return this
    return new PanelState(
      this.phase,
      this.entries.with(open, change(this.entries[open] as PanelTurn)),
    )
  }

  // Every entry the panel holds, turns flattened into the order they were
  // shown, so a reader that does not care about grouping sees what it used to.
  flattened(): PanelEntry[] {
    return this.entries.flatMap(PanelItems.entriesOf)
  }

  // Through the turns as well as beside them, so an entry a turn holds settles
  // the same way one at the top level does.
  mapEntries(change: (entry: PanelEntry) => PanelEntry): PanelState {
    return new PanelState(this.phase, PanelItems.mapAll(this.entries, change))
  }

  private openTurnAt(): number {
    return this.entries.findLastIndex((item) => item.kind === 'turn')
  }
}

export class PanelItems {
  static entriesOf(item: PanelItem): PanelEntry[] {
    return item.kind === 'turn' ? item.entries : [item]
  }

  static mapAll(items: PanelItem[], change: (entry: PanelEntry) => PanelEntry): PanelItem[] {
    return items.map((item) => PanelItems.mapped(item, change))
  }

  private static mapped(item: PanelItem, change: (entry: PanelEntry) => PanelEntry): PanelItem {
    if (item.kind !== 'turn') return change(item)
    return { ...item, entries: item.entries.map(change) }
  }
}

export const INITIAL_PANEL_STATE: PanelState = new PanelState('idle', [])
