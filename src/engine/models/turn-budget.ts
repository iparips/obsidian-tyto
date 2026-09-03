import {
  ASK_USER,
  GLOB_NOTES,
  GREP_NOTES,
  READ_NOTE,
  RUN_COMMAND,
} from '../../providers/models/tool-call'

const MAX_COMMANDS = 3
const MAX_SEARCHES = 4
// Separate from each other and from the searches, because a glob costs no read
// and a grep costs one per candidate. Sharing them would let cheap
// reconnaissance starve the reads it exists to inform.
const MAX_GLOBS = 3
const MAX_GREPS = 4
// One, because a turn writes to one note and the note it opens is that note.
// Counted per distinct note: returning to one already opened is not a second
// note, and a command can move the target off it without the model choosing to.
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
  private globsRun = 0
  private grepsRun = 0
  private readonly opened = new Set<string>()
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

  takeGlob(): boolean {
    if (this.globsRun >= MAX_GLOBS) return false
    this.globsRun += 1
    return true
  }

  takeGrep(): boolean {
    if (this.grepsRun >= MAX_GREPS) return false
    this.grepsRun += 1
    return true
  }

  // Asked before the user is, so a note the cap forbids is refused without a
  // pointless question. The spend is separate, because a declined open is not
  // a note opened and must not cost the turn its one.
  canOpen(path: string): boolean {
    return this.opened.has(path) || this.opened.size < MAX_OPENS
  }

  takeOpen(path: string): void {
    this.opened.add(path)
  }

  // Which flows are spent, so the schemas can drop a tool the turn can no
  // longer use. A refused call still costs an iteration, and a model that reads
  // "run no more" as advice will spend the rest of the turn on refusals.
  // open_note is never here: the note already opened can always be reopened,
  // and dropping the tool strands a turn a command moved off that note.
  spentTools(): readonly string[] {
    return [
      this.commandsRun >= MAX_COMMANDS ? RUN_COMMAND : '',
      this.searchesRun >= MAX_SEARCHES ? READ_NOTE : '',
      this.globsRun >= MAX_GLOBS ? GLOB_NOTES : '',
      this.grepsRun >= MAX_GREPS ? GREP_NOTES : '',
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
      TurnBudget.countOf(this.globsRun, 'listing', 'listings'),
      TurnBudget.countOf(this.grepsRun, 'text search', 'text searches'),
      TurnBudget.countOf(this.opened.size, 'note opened', 'notes opened'),
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

  static globCapMessage(): string {
    return `this turn has already listed ${MAX_GLOBS} times; work from the paths you have`
  }

  static grepCapMessage(): string {
    return `this turn has already searched the text ${MAX_GREPS} times; answer from what you have`
  }

  static openCapMessage(): string {
    return `this turn has already opened ${MAX_OPENS} note; edit that note rather than opening another`
  }

  static questionCapMessage(): string {
    return `this turn has already asked ${MAX_QUESTIONS} questions; act on what you have or say what stopped you`
  }
}
