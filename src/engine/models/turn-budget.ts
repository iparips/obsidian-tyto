const MAX_COMMANDS = 3
const MAX_SEARCHES = 4

// Per-turn counters, held by the loop rather than by a collaborator: a service
// holding a turn's state would have to be rebuilt every turn (FR15, FR26).
export class TurnBudget {
  private commandsRun = 0
  private searchesRun = 0

  takeCommand(): boolean {
    if (this.commandsRun >= MAX_COMMANDS) return false
    this.commandsRun += 1
    return true
  }

  takeSearch(): boolean {
    if (this.searchesRun >= MAX_SEARCHES) return false
    this.searchesRun += 1
    return true
  }

  static commandCapMessage(): string {
    return `this turn has already run ${MAX_COMMANDS} commands; run no more`
  }

  static searchCapMessage(): string {
    return `this turn has already searched or read ${MAX_SEARCHES} times; answer from what you have`
  }
}
