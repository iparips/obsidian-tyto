// One thing a turn did, in the user's terms. The panel already shows commands
// and answers as entries; this is the rest, including the calls that refused,
// so a turn that ran out of steps can say where they went.
export class TurnStep {
  constructor(
    readonly label: string,
    readonly detail: string,
    readonly refused: boolean = false,
  ) {}

  static searched(query: string, hits: number): TurnStep {
    return new TurnStep('Searched', `${query} — ${TurnStep.hitCount(hits)}`)
  }

  // Labelled apart from a search, since reusing it would render a folder
  // listing as "3 matches", which reads as relevance where it is an enumeration.
  static globbed(pattern: string, found: number): TurnStep {
    return new TurnStep('Globbed', `${pattern} — ${TurnStep.noteCount(found)}`)
  }

  static grepped(pattern: string, found: number): TurnStep {
    return new TurnStep('Grepped', `${pattern} — ${TurnStep.noteCount(found)}`)
  }

  static read(path: string): TurnStep {
    return new TurnStep('Read', path)
  }

  static opened(path: string): TurnStep {
    return new TurnStep('Opened', path)
  }

  // The count rather than the paths: the panel entry lists them, and a steps
  // line naming eight notes is a list where the others are one line each.
  static offered(candidates: number): TurnStep {
    return new TurnStep('Offered', `${TurnStep.noteCount(candidates)} to choose from`)
  }

  // A skill and a chain of instructions are things the turn did, so they take
  // their place in the numbered list rather than floating beside it.
  static skillLoaded(name: string): TurnStep {
    return new TurnStep('Loaded skill', name)
  }

  static commandRan(detail: string): TurnStep {
    return new TurnStep('Ran command', detail)
  }

  static instructionsApplied(summary: string): TurnStep {
    return new TurnStep('Loaded agent instructions', summary)
  }

  static asked(question: string): TurnStep {
    return new TurnStep('Asked', question)
  }

  static edited(summary: string): TurnStep {
    return new TurnStep('Edit', summary)
  }

  // A refusal is a step too: it spent an iteration, and it is usually the thing
  // the user most needs to see when a turn goes nowhere.
  static refused(reason: string): TurnStep {
    return new TurnStep('Refused', reason, true)
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
