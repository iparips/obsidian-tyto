import { PanelEntry, PanelStep } from '../../models/panel-state'

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
  // choices. The steps themselves belong to the turn steps that produced them.
  entriesBesideSteps(): PanelEntry[] {
    return this.entries.filter((entry) => entry.kind !== 'steps')
  }

  // Every panel step of the session in publication order, which is what the
  // recorded ranges index into: a range is a fact about the entries themselves,
  // so it counts across turns rather than within one.
  static allPanelSteps(entries: readonly PanelEntry[]): PanelStep[] {
    return entries.filter((entry) => entry.kind === 'steps').flatMap((entry) => entry.steps)
  }

  // An utterance is where one turn ends and the next begins, which is how
  // PanelReducer already finds a turn's open steps entry.
  static split(entries: readonly PanelEntry[]): TranscriptTurn[] {
    const turns: TranscriptTurn[] = []
    entries.forEach((entry) => {
      if (entry.kind === 'user') return turns.push(new TranscriptTurn(turns.length, entry.text, []))
      const open = turns.at(-1)
      if (open) turns[turns.length - 1] = TranscriptTurn.plus(open, entry)
    })
    return turns
  }

  private static plus(turn: TranscriptTurn, entry: PanelEntry): TranscriptTurn {
    return new TranscriptTurn(turn.index, turn.utterance, [...turn.entries, entry])
  }
}
