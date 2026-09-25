import { EditorPosition } from 'obsidian'
import { OpenNote } from '../note-editing/open-note'
import { AgentsMdChain } from '../../agents/agents-md-chain'
import { ResolvedNote } from '../note-binding/resolved-note'
import { NotesOpenedCounter } from './notes-opened-counter'
import { NotesChosenByUserRepository } from './notes-chosen-by-user-repository'
import { NotesReadRepository } from './notes-read-repository'
import { PathsReturnedByVaultRepository } from './paths-returned-by-vault-repository'
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
  private editsApplied = 0
  private readonly writtenThroughEditor = new Set<string>()

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
    // Which turn of the session this is, counted by the session from the
    // utterances it holds. A tool result carries it so the model can place the
    // result against the utterance it answers rather than against the whole
    // history, where every applied edit otherwise reads alike.
    readonly turnNumber: number = 1,
    // What the resolution found: the note's folders when one is bound, the
    // vault root when none is. Defaulted empty so a vault with no instruction
    // file behaves as one built before them.
    private readonly instructions: AgentsMdChain = new AgentsMdChain(),
  ) {}

  // Built here rather than passed in, which is the whole of its turn scope: a
  // NotesChosenByUserRepository the session supplied would outlive the write the user consented
  // to, and a second turn would open the note without asking.
  readonly notesChosenByUser = new NotesChosenByUserRepository()

  // Built here for the same reason: the note can change between turns, so a
  // read recorded in an earlier one says nothing about the note now.
  readonly notesRead = new NotesReadRepository()

  // Built here too, and filled by glob and grep alone: it says whether this
  // turn answers from a search. A read or an earlier turn's search does not.
  readonly pathsFoundBySearch = new PathsReturnedByVaultRepository()

  // Null while the session is unbound, which is a turn that can search but not
  // write.
  targetNote(): OpenNote | null {
    return this.resolvedNote?.note ?? null
  }

  isBound(): boolean {
    return this.resolvedNote !== null
  }

  // The note's own folders once one is bound, so a command that moves the target
  // mid-turn moves the chain with it. The constructor's chain is what an unbound
  // turn has instead: the vault root, which has no note to hang it on.
  agentMdChain(): AgentsMdChain {
    return this.resolvedNote?.instructions ?? this.instructions
  }

  skills(): readonly Skill[] {
    return this.vaultSkills
  }

  // What decides whether the skill tools are offered and the skill rules stated,
  // so a vault defining none is unchanged by either.
  definesSkills(): boolean {
    return this.vaultSkills.length > 0
  }

  // The name goes to the session, since the body it fetched stays in the chat
  // history for every turn after this one. Nothing is settled per turn: each
  // call is judged on the skills it declared and what the session has read.
  recordSkillLoaded(name: string): void {
    this.skillsRead.recordNameRead(name)
  }

  // Reads the session record, so a second read of a body already in the
  // conversation is refused whichever turn first fetched it.
  hasLoaded(name: string): boolean {
    return this.skillsRead.includesNameRead(name)
  }

  skillNamesRead(): readonly string[] {
    return this.skillsRead.getNamesRead()
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

  // Counts edits rather than notes, where notesWritten() deduplicates by path.
  // Two edits to one note are two results the model has to tell apart, and a
  // step number cannot do it: a batch of three edits is one step. The pair of
  // this and turnNumber places every applied edit uniquely in the session.
  countEditApplied(): number {
    this.editsApplied += 1
    return this.editsApplied
  }

  // A write through the editor leaves text the file will not hold for two
  // seconds, so the trust test flushes before comparing. Only a view this turn
  // already wrote through may be flushed: it passed the trust test to earn that
  // write, where flushing a half-opened one writes the note it still shows.
  recordWrittenThroughEditor(path: string): void {
    this.writtenThroughEditor.add(path)
  }

  wasWrittenThroughEditor(path: string): boolean {
    return this.writtenThroughEditor.has(path)
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
