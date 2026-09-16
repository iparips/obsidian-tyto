import {
  PanelEntry,
  PanelItem,
  PanelItems,
  ProgressLine,
  PanelTurn,
} from '../../models/panel-state'

// One conversation turn as the panel recorded it: the utterance that opened it
// and every entry that landed before the next one. A turn is what the runner
// spends turn steps on, so the document nests the same way.
export class TranscriptTurn {
  constructor(
    readonly index: number,
    readonly utterance: string,
    readonly entries: readonly PanelEntry[],
  ) {}

  // What the panel showed beside the steps: replies, answers, warnings,
  // choices. The steps themselves belong to the turn steps that produced them,
  // and the utterance is written above as the turn's own line.
  entriesBesideSteps(): PanelEntry[] {
    return this.entries.filter((entry) => entry.kind !== 'progress' && entry.kind !== 'user')
  }

  // Every progress line of the session in publication order, which is what the
  // recorded ranges index into: a range is a fact about the entries themselves,
  // so it counts across turns rather than within one.
  static allProgressLines(items: readonly PanelItem[]): ProgressLine[] {
    return items
      .flatMap(PanelItems.entriesOf)
      .filter((entry) => entry.kind === 'progress')
      .flatMap((entry) => entry.lines)
  }

  // What the panel showed before the first turn, which belongs to none: a
  // restore marker, or a retarget the user made before speaking.
  static before(items: readonly PanelItem[]): PanelEntry[] {
    const firstTurnAt = items.findIndex((item) => item.kind === 'turn')
    const before = firstTurnAt === -1 ? [...items] : items.slice(0, firstTurnAt)
    return before.flatMap(PanelItems.entriesOf)
  }

  // Read off the turns the panel holds rather than inferred by scanning back to
  // an utterance, which is what put a retarget in the wrong turn once (D6).
  static split(items: readonly PanelItem[]): TranscriptTurn[] {
    return items
      .filter((item) => item.kind === 'turn')
      .map(
        (turn, index) => new TranscriptTurn(index, TranscriptTurn.utteranceOf(turn), turn.entries),
      )
  }

  // The turn's first entry, which is the utterance the reducer opened it with.
  private static utteranceOf(turn: PanelTurn): string {
    const first = turn.entries[0]
    return first?.kind === 'user' ? first.text : ''
  }
}
