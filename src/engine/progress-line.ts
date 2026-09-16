// One thing a turn did, in the user's terms, and the innermost of the three
// levels a session nests: a turn is one utterance, a turn step is one model
// call, and a progress line is one line of the panel's numbered list.
//
// A line belongs to the turn rather than to a turn step. Most fall inside one,
// but a batch publishes several from a single call, a call answering in text
// publishes none, and the resolved instructions are reported before the first
// call of all.
export class ProgressLine {
  constructor(
    readonly label: string,
    readonly detail: string,
    readonly refused: boolean = false,
  ) {}

  static searched(query: string, hits: number): ProgressLine {
    return new ProgressLine('Searched', `${query} — ${ProgressLine.hitCount(hits)}`)
  }

  // Labelled apart from a search, since reusing it would render a folder
  // listing as "3 matches", which reads as relevance where it is an enumeration.
  static globbed(pattern: string, found: number): ProgressLine {
    return new ProgressLine('Globbed', `${pattern} — ${ProgressLine.noteCount(found)}`)
  }

  static grepped(pattern: string, found: number): ProgressLine {
    return new ProgressLine('Grepped', `${pattern} — ${ProgressLine.noteCount(found)}`)
  }

  static read(path: string): ProgressLine {
    return new ProgressLine('Read', path)
  }

  static opened(path: string): ProgressLine {
    return new ProgressLine('Opened', path)
  }

  // The count rather than the paths: the panel entry lists them, and a steps
  // line naming eight notes is a list where the others are one line each.
  static offered(candidates: number): ProgressLine {
    return new ProgressLine('Offered', `${ProgressLine.noteCount(candidates)} to choose from`)
  }

  // A skill and a chain of instructions are things the turn did, so they take
  // their place in the numbered list rather than floating beside it.
  static skillLoaded(name: string): ProgressLine {
    return new ProgressLine('Loaded skill', name)
  }

  static commandRan(detail: string): ProgressLine {
    return new ProgressLine('Ran command', detail)
  }

  // Both halves, because a resolve the user did not mean is only visible if the
  // panel shows the phrase beside the date the turn then worked from.
  static resolved(phrase: string, isoDate: string): ProgressLine {
    return new ProgressLine('Resolved', `${phrase} — ${isoDate}`)
  }

  static instructionsApplied(summary: string): ProgressLine {
    return new ProgressLine('Loaded agent instructions', summary)
  }

  static asked(question: string): ProgressLine {
    return new ProgressLine('Asked', question)
  }

  // Named, because the note an edit reached is the one thing the panel could
  // not show: a choice of one note followed by an edit to another reads as an
  // open the model never ran.
  static edited(summary: string, path: string | null): ProgressLine {
    return new ProgressLine('Edit', path === null ? summary : `${summary} — ${path}`)
  }

  // A refusal is a step too: it spent an iteration, and it is usually the thing
  // the user most needs to see when a turn goes nowhere. The tool is named in
  // the label like every other step, since three refusals in one turn read as
  // one repeated failure unless the panel says which call each stopped.
  static refused(tool: string, reason: string): ProgressLine {
    return new ProgressLine(`Refused ${tool}`, reason, true)
  }

  // Built where the tool is not in hand: the many tools that refuse know their
  // reason, and the dispatcher that routed the call names it through byTool.
  // Named apart from refused because both arguments are strings, so one factory
  // taking either shape mislabels a step instead of failing to compile.
  static refusedByUnnamedTool(reason: string): ProgressLine {
    return new ProgressLine('Refused', reason, true)
  }

  byTool(tool: string): ProgressLine {
    return new ProgressLine(`Refused ${tool}`, this.detail, true)
  }

  private static hitCount(hits: number): string {
    if (hits === 0) return 'nothing matched'
    return `${hits} ${hits === 1 ? 'match' : 'matches'}`
  }

  private static noteCount(found: number): string {
    if (found === 0) return 'nothing matched'
    return `${found} ${found === 1 ? 'note' : 'notes'}`
  }
}
