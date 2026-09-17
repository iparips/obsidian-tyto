import { PanelEntry, ProgressLine } from '../models/panel-state'

// The PanelEntry union rendered case by case, as HistoryEntry renders it for
// display. What the user saw goes in the transcript verbatim, so a reader
// matches the document against the screenshot they also have.
export class TranscriptEntryLines {
  static of(entry: PanelEntry): string[] {
    switch (entry.kind) {
      case 'user':
        return [`Utterance: ${entry.text}`]
      case 'assistant':
        return [`Reply: ${entry.text}`]
      case 'error':
        return [`Error (${entry.step}): ${entry.text}`]
      case 'instructions':
        return [`- ${entry.text}`]
      case 'warning':
        return [`- Warned - ${entry.text}`]
      case 'cancelled':
        return [`Cancelled: ${entry.text}`]
      case 'restored':
        return [`- ${entry.text}`]
      case 'answer':
        return TranscriptEntryLines.answer(entry.text, entry.sources)
      case 'choice':
        return TranscriptEntryLines.choice(entry.text, entry.candidates, entry.pending)
      case 'question':
        return TranscriptEntryLines.question(entry.text, entry.pending)
      case 'progress':
        return entry.lines.map(TranscriptEntryLines.line)
    }
  }

  // The label, the detail and the note as the panel's numbered list shows them,
  // with a refusal marked: a refused line is what a turn that went nowhere is
  // made of. The note is written whatever the turn's target, since a reader of
  // the document has no turn header beside the line to compare it against.
  static line(line: ProgressLine): string {
    const written = [line.label, line.detail, line.note].filter(Boolean).join(' - ')
    return line.refused ? `- ${written} - refused` : `- ${written}`
  }

  private static answer(text: string, sources: readonly string[]): string[] {
    if (sources.length === 0) return [`Answer: ${text}`]
    return [`Answer: ${text}`, `Sources: ${sources.join(', ')}`]
  }

  // Once settled the text is already what the user picked, so only a pending
  // one needs saying: the candidates stay either way, since a turn that went
  // nowhere still records what was offered.
  private static choice(text: string, candidates: readonly string[], pending: boolean): string[] {
    const lines = [`Choice: ${text}`, `Offered: ${candidates.join(', ')}`]
    return pending ? [...lines, 'Still waiting on the user'] : lines
  }

  private static question(text: string, pending: boolean): string[] {
    return pending ? [`Question: ${text}`, 'Still waiting on the user'] : [`Question: ${text}`]
  }
}
