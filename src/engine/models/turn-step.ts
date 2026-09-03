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

  static read(path: string): TurnStep {
    return new TurnStep('Read', path)
  }

  static opened(path: string): TurnStep {
    return new TurnStep('Opened', path)
  }

  static asked(question: string): TurnStep {
    return new TurnStep('Asked', question)
  }

  static edited(summary: string): TurnStep {
    return new TurnStep('Edited', summary)
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
}
