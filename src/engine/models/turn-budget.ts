import {
  ASK_USER,
  OPEN_NOTE,
  READ_NOTE,
  RUN_COMMAND,
  SEARCH_VAULT,
} from '../../providers/models/tool-call'

const MAX_COMMANDS = 3
const MAX_SEARCHES = 4
// One, because a turn writes to one note and the note it opens is that note.
const MAX_OPENS = 1
// Four, because a real clarification chains: a date, then which note, then a
// correction to the date. The iteration cap bounds it anyway, so this only has
// to stop a model that has started interviewing rather than working.
const MAX_QUESTIONS = 4

// Per-turn counters, held by the loop rather than by a collaborator: a service
// holding a turn's state would have to be rebuilt every turn (FR15, FR26).
export class TurnBudget {
  private commandsRun = 0
  private searchesRun = 0
  private opensRun = 0
  private questionsAsked = 0

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

  takeOpen(): boolean {
    if (this.opensRun >= MAX_OPENS) return false
    this.opensRun += 1
    return true
  }

  // Which flows are spent, so the schemas can drop a tool the turn can no
  // longer use. A refused call still costs an iteration, and a model that reads
  // "run no more" as advice will spend the rest of the turn on refusals.
  spentTools(): readonly string[] {
    return [
      this.commandsRun >= MAX_COMMANDS ? RUN_COMMAND : '',
      this.searchesRun >= MAX_SEARCHES ? SEARCH_VAULT : '',
      this.searchesRun >= MAX_SEARCHES ? READ_NOTE : '',
      this.opensRun >= MAX_OPENS ? OPEN_NOTE : '',
      this.questionsAsked >= MAX_QUESTIONS ? ASK_USER : '',
    ].filter(Boolean)
  }

  takeQuestion(): boolean {
    if (this.questionsAsked >= MAX_QUESTIONS) return false
    this.questionsAsked += 1
    return true
  }

  // What the turn spent, in the user's terms rather than the tool's. A turn
  // that ran out of steps has to say where they went: "exceeded 10 iterations"
  // names the limit but not the cause.
  describeSpend(): string {
    const spent = [
      TurnBudget.countOf(this.commandsRun, 'command', 'commands'),
      TurnBudget.countOf(this.searchesRun, 'search', 'searches'),
      TurnBudget.countOf(this.opensRun, 'note opened', 'notes opened'),
      TurnBudget.countOf(this.questionsAsked, 'question', 'questions'),
    ].filter((entry) => entry !== null)
    return spent.length === 0 ? 'no tools ran' : spent.join(', ')
  }

  // Both forms rather than a suffix rule, since "searches" and "notes opened"
  // are not what appending an s produces.
  private static countOf(count: number, one: string, many: string): string | null {
    if (count === 0) return null
    return `${count} ${count === 1 ? one : many}`
  }

  static commandCapMessage(): string {
    return `this turn has already run ${MAX_COMMANDS} commands; run no more`
  }

  static searchCapMessage(): string {
    return `this turn has already searched or read ${MAX_SEARCHES} times; answer from what you have`
  }

  static openCapMessage(): string {
    return `this turn has already opened ${MAX_OPENS} note; edit that note rather than opening another`
  }

  static questionCapMessage(): string {
    return `this turn has already asked ${MAX_QUESTIONS} questions; act on what you have or say what stopped you`
  }
}
