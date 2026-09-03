import { EditorPosition } from 'obsidian'
import { OpenNote } from './models/open-note'
import { AgentsMdChain } from '../agents/agents-md-chain'
import { ResolvedNote } from './models/resolved-note'
import { TurnBudget } from './models/turn-budget'
import { ChosenNotes } from './models/chosen-notes'
import { SeenPaths } from '../search/models/seen-paths'
import { Skill } from '../skills/skill'

// What one turn holds, built at its start and discarded with it. Separate from
// SessionRepository because an editor handle cannot outlive the turn: kept
// across turns it goes stale silently, whereas a path re-resolves and fails
// loudly.
export class TurnRepository {
  private lastEditEnd: EditorPosition | null = null
  private unwritablePath: string | null = null
  private readonly written: string[] = []

  constructor(
    private resolved: ResolvedNote | null,
    private readonly vaultSkills: readonly Skill[] = [],
    readonly budget: TurnBudget = new TurnBudget(),
    // Supplied by the session rather than defaulted per turn: a note the model
    // found in one turn is one the user watched it find, and refusing to open
    // it in the next is what drives the model to edit whatever is still bound.
    readonly seenPaths: SeenPaths = new SeenPaths(),
  ) {}

  // Built here rather than passed in, which is the whole of its turn scope: a
  // ChosenNotes the session supplied would outlive the write the user consented
  // to, and a second turn would open the note without asking.
  readonly chosenNotes = new ChosenNotes()

  // The note the turn inherited, resolved before any tool ran. Editing it needs
  // no choice: it is the note the user was looking at when they spoke.
  private readonly startedOn: string | null = this.resolved?.note.path ?? null

  // Set once the model reaches past the note it started on. From then the turn
  // is working on a note the user has to have chosen and the loop has to have
  // opened, because the inherited binding may be a path whose editor Obsidian
  // still reports but no longer shows.
  private reachedOut = false

  // A glob or grep is the model looking for a note other than the one in front
  // of the user, which is what makes the inherited binding no longer the target.
  searchRan(): void {
    this.reachedOut = true
  }

  // Whether an edit may land on this note. The note the turn started on is the
  // one the user was looking at, until the model goes looking for another.
  mayEdit(path: string): boolean {
    if (this.openedThisTurn.has(path)) return true
    return !this.reachedOut && path === this.startedOn
  }

  private readonly openedThisTurn = new Set<string>()

  // Null while the session is unbound, which is a turn that can search but not
  // write.
  targetNote(): OpenNote | null {
    return this.resolved?.note ?? null
  }

  isBound(): boolean {
    return this.resolved !== null
  }

  // Empty when unbound: a chain resolves from a note's folders, and there is no
  // note.
  agentMdChain(): AgentsMdChain {
    return this.resolved?.instructions ?? new AgentsMdChain()
  }

  skills(): readonly Skill[] {
    return this.vaultSkills
  }

  // Whether the model has settled the skill question this turn, either by
  // loading one or by saying none applies. The harness never decides which
  // skill fits: it only holds the model to deciding before it writes.
  private skillsSettled = false

  settleSkills(): void {
    this.skillsSettled = true
  }

  // A vault with no skills has nothing to settle, so the check is invisible
  // there and the release 3 turn is unchanged.
  mustSettleSkills(): boolean {
    return this.vaultSkills.length > 0 && !this.skillsSettled
  }

  skillNamed(name: string): Skill | undefined {
    return this.vaultSkills.find((candidate) => candidate.name === name)
  }

  editEnd(): EditorPosition | null {
    return this.lastEditEnd
  }

  // Spent once an open is granted rather than when it is asked for, so a note
  // the user declined does not cost the turn its one open.
  recordOpen(path: string): void {
    this.budget.takeOpen(path)
  }

  // Separate from recordOpen, which spends the budget: a command's note is
  // opened without the model choosing to, and must not cost the turn its one.
  recordOpened(path: string): void {
    this.openedThisTurn.add(path)
  }

  retargetTo(resolved: ResolvedNote): void {
    this.resolved = resolved
    this.unwritablePath = null
  }

  // The session moved to a note this turn cannot resolve, so the note it still
  // holds is no longer the target and must not be written to.
  cannotWriteTo(path: string): void {
    this.unwritablePath = path
  }

  unwritableNote(): string | null {
    return this.unwritablePath
  }

  // The paths written this turn, in order, so a cancelled turn can say what it
  // left rather than the user reading the note to find out.
  writtenNotes(): readonly string[] {
    return this.written
  }

  recordEdit(editedTo: EditorPosition | undefined): void {
    this.lastEditEnd = editedTo ?? this.lastEditEnd
    if (editedTo) this.recordWrittenNote()
  }

  private recordWrittenNote(): void {
    const path = this.targetNote()?.path
    if (!path || this.written.includes(path)) return
    this.written.push(path)
  }
}
