import { EditorPosition } from 'obsidian'
import { OpenNote } from '../note-editing/open-note'
import { AgentsMdChain } from '../../agents/agents-md-chain'
import { ResolvedNote } from '../note-binding/resolved-note'
import { NotesOpenedCounter } from './notes-opened-counter'
import { NotesChosenByUserRepository } from './notes-chosen-by-user-repository'
import { PathsReturnedByVaultRepository } from '../../search/models/paths-returned-by-vault-repository'
import { Skill } from '../../skills/skill'
import { SkillsReadRepository } from '../../skills/skills-read-repository'

// What one turn holds, built at its start and discarded with it. Separate from
// SessionRepository because an editor handle cannot outlive the turn: kept
// across turns it goes stale silently, whereas a path re-resolves and fails
// loudly.
export class TurnRepository {
  private lastEditEnd: EditorPosition | null = null
  private unwritablePath: string | null = null
  private refusedOpenPath: string | null = null
  private readonly written: string[] = []

  constructor(
    private resolvedNote: ResolvedNote | null,
    private readonly vaultSkills: readonly Skill[] = [],
    readonly notesOpenedCounter: NotesOpenedCounter = new NotesOpenedCounter(),
    // Supplied by the session rather than defaulted per turn: a note the model
    // found in one turn is one the user watched it find, and refusing to open
    // it in the next is what drives the model to edit whatever is still bound.
    readonly pathsReturnedByVault: PathsReturnedByVaultRepository = new PathsReturnedByVaultRepository(),
    // Supplied by the session for the same reason: the skill body it names is
    // in the chat history, so a later turn can still read the steps and a
    // refusal saying otherwise is untrue.
    private readonly skillsRead: SkillsReadRepository = new SkillsReadRepository(),
  ) {}

  // Built here rather than passed in, which is the whole of its turn scope: a
  // NotesChosenByUserRepository the session supplied would outlive the write the user consented
  // to, and a second turn would open the note without asking.
  readonly notesChosenByUser = new NotesChosenByUserRepository()

  // Null while the session is unbound, which is a turn that can search but not
  // write.
  targetNote(): OpenNote | null {
    return this.resolvedNote?.note ?? null
  }

  isBound(): boolean {
    return this.resolvedNote !== null
  }

  // Empty when unbound: a chain resolves from a note's folders, and there is no
  // note.
  agentMdChain(): AgentsMdChain {
    return this.resolvedNote?.instructions ?? new AgentsMdChain()
  }

  skills(): readonly Skill[] {
    return this.vaultSkills
  }

  // What decides whether the skill tools are offered and the skill rules stated,
  // so a vault defining none is unchanged by either.
  definesSkills(): boolean {
    return this.vaultSkills.length > 0
  }

  // Whether the model has settled the skill question this turn, either by
  // loading one or by saying none applies. The harness never decides which
  // skill fits: it only holds the model to deciding before it writes.
  private skillsSettled = false

  private loadedThisTurn = false

  settleSkills(): void {
    this.skillsSettled = true
  }

  // Loading a skill settles the question and records that it was answered by
  // loading, so a later "no skill applies" in the same turn contradicts it.
  // The name goes to the session, since the body it fetched stays in the chat
  // history for every turn after this one.
  recordSkillLoaded(name: string): void {
    this.skillsRead.record(name)
    this.loadedThisTurn = true
    this.settleSkills()
  }

  loadedASkill(): boolean {
    return this.loadedThisTurn
  }

  // Reads the session record, so a second read of a body already in the
  // conversation is refused whichever turn first fetched it.
  hasLoaded(name: string): boolean {
    return this.skillsRead.has(name)
  }

  // A vault with no skills has nothing to settle, so the check is invisible
  // there and the release 3 turn is unchanged.
  mustSettleSkills(): boolean {
    return this.definesSkills() && !this.skillsSettled
  }

  getSkillNamed(name: string): Skill | undefined {
    return this.vaultSkills.find((candidate) => candidate.name === name)
  }

  editEnd(): EditorPosition | null {
    return this.lastEditEnd
  }

  // Spent once an open is granted rather than when it is asked for, so a note
  // the user declined does not cost the turn its one open.
  recordOpen(path: string): void {
    this.notesOpenedCounter.takeOpen(path)
  }

  retargetTo(resolved: ResolvedNote): void {
    this.resolvedNote = resolved
    this.unwritablePath = null
    this.refusedOpenPath = null
  }

  // A refused open leaves the previous turn's note bound, and an edit that
  // followed one landed on it: the model reached for Thursday, was refused, and
  // wrote to the Friday note still open from the turn before. Held apart from
  // an unresolvable note because the way out differs, and the model is told to
  // take it rather than to ask the user.
  cannotOpen(path: string): void {
    this.refusedOpenPath = path
  }

  refusedOpen(): string | null {
    return this.refusedOpenPath
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
  notesWritten(): readonly string[] {
    return this.written
  }

  storeCursorPositionAndWrittenNote(editEndPosition: EditorPosition | undefined): void {
    this.lastEditEnd = editEndPosition ?? this.lastEditEnd
    if (editEndPosition) this.recordWrittenNote()
  }

  private recordWrittenNote(): void {
    const path = this.targetNote()?.path
    if (!path || this.written.includes(path)) return
    this.written.push(path)
  }
}
