import { ChatTurn, ToolCall } from '../model/providers/types'
import { App } from 'obsidian'
import { HarnessToolsService } from '../engine/tools/harness-tools-service'
import { ObsidianCommandRunner } from '../commands/obsidian-command-runner'
import { OpenedNoteWait } from '../commands/opened-note-wait'
import { ObsidianCommandCatalogue } from '../commands/obsidian-command-catalogue'
import { ObsidianCommandRegistry } from '../commands/obsidian-command-registry'
import { AllowList } from '../commands/allow-list'
import { NoteGlob } from '../search/note-glob'
import { NoteGrep } from '../search/note-grep'
import { SearchToolsService } from '../engine/tools/search-tools-service'
import { DateToolService } from '../engine/tools/date-tool-service'
import { NoteReader } from '../search/note-reader'
import { FakeVault } from './fake-vault'
import { FakeAdapter } from './fake-adapter'
import { EditEngine } from '../engine/edit-engine'
import { TurnEndingService } from '../engine/turn-ending-service'
import { NoteEditor } from '../engine/note-editing/note-editor'
import { TargetNoteWriter } from '../engine/note-editing/target-note-writer'
import { TargetNoteResolver } from '../engine/note-binding/target-note-resolver'
import { TurnProgressPublisher } from '../engine/turn-progress-publisher'
import { TurnRunnerFactory } from '../engine/turn/turn-runner-factory'
import { FakeNoteLocator } from './fake-note-locator'
import { TFile } from 'obsidian'
import { SessionRepository } from '../session/session-repository'
import { TranscriptRepository } from '../session/transcript/transcript-repository'
import { ToolNoteOpening } from '../session/tool-note-opening'
import { AgentsMdRepository } from '../agents/agents-md-repository'
import { SkillRepository } from '../skills/skill-repository'
import { ChatProvider } from '../model/providers/types'
import { NoteChoiceService } from '../engine/waiting/note-choice-service'
import { NoteOpener } from '../engine/note-binding/note-opener'
import { NotesChosenByUserRepository } from '../engine/turn/notes-chosen-by-user-repository'
import { NotesOpenedCounter } from '../engine/turn/notes-opened-counter'
import { NotesReadRepository } from '../engine/turn/notes-read-repository'
import { PathsReturnedByVaultRepository } from '../engine/turn/paths-returned-by-vault-repository'
import { OpenNote } from '../engine/note-editing/open-note'
import { TurnState } from '../engine/tools/harness-result'
import { TurnCancellationController } from '../engine/turn/turn-cancellation-controller'
import { UserQuestionService } from '../engine/waiting/user-question-service'

let nextCallId = 0

export const aToolCall = (name: string, args: Record<string, unknown>): ToolCall =>
  new ToolCall(`call-${nextCallId++}`, name, args)

export const aToolTurn = (...calls: ToolCall[]): ChatTurn => ChatTurn.ofToolCalls(calls)

export const aTextTurn = (content: string): ChatTurn => ChatTurn.ofText(content)

export interface EnginePartsOptions {
  sessions: SessionRepository
  noteLocator: FakeNoteLocator
  agentsMdRepository: AgentsMdRepository
  skillRepository?: SkillRepository
  harnessToolsService?: HarnessToolsService
  progress?: TurnProgressPublisher
  noteOpener?: NoteOpener | null
  noteChoiceService?: (
    cancellationController: TurnCancellationController,
    notesChosenByUser: NotesChosenByUserRepository,
  ) => NoteChoiceService
  userQuestionService?: (cancellationController: TurnCancellationController) => UserQuestionService
  transcript?: TranscriptRepository
  toolNoteOpening?: ToolNoteOpening
  // Where a read and a write land when the editor's text does not match the
  // file. Every open note is mirrored into it, so a test that says nothing
  // about the vault gets a view that finished loading (D1).
  vault?: FakeVault
}

// The resolver and dispatcher a test needs beside an engine, wired the way
// EngineFactory wires them, so a test states only what it varies.
export const anEngine = (modelProvider: ChatProvider, options: EnginePartsOptions): EditEngine => {
  const skills = options.skillRepository ?? new SkillRepository(new FakeAdapter().asAdapter(), '')
  const harness = options.harnessToolsService ?? noHarness()
  const progress = options.progress ?? TurnProgressPublisher.silent()
  const vault = (options.vault ?? new FakeVault()).withLoadedNotes(options.noteLocator)
  const targetNoteWriter = new TargetNoteWriter(
    new NoteEditor(),
    options.noteLocator,
    vault.asVault(),
  )
  const targetNote = new TargetNoteResolver(
    options.sessions,
    options.noteLocator,
    options.agentsMdRepository,
    progress,
  )
  const turnFactory = new TurnRunnerFactory(
    options.sessions,
    targetNote,
    skills,
    targetNoteWriter,
    harness,
    progress,
    modelProvider,
    new TurnEndingService(options.sessions, targetNoteWriter),
    options.noteOpener ?? null,
    options.noteChoiceService ??
      ((_cancellationController, notesChosenByUser) =>
        NoteChoiceService.unasked(notesChosenByUser)),
    options.userQuestionService ?? (() => UserQuestionService.unanswered()),
    options.transcript ?? new TranscriptRepository(),
  )
  return new EditEngine(options.sessions, turnFactory, progress, options.toolNoteOpening)
}

// The narrow view a tool sees of its turn. Unbound by default, since only a
// read of the turn's own note looks at the target.
export const aTurnState = (
  targetNote: OpenNote | null = null,
  wroteThroughEditor = false,
): TurnState => ({
  notesOpenedCounter: new NotesOpenedCounter(),
  pathsReturnedByVault: new PathsReturnedByVaultRepository(),
  notesRead: new NotesReadRepository(),
  targetNote: () => targetNote,
  wasWrittenThroughEditor: () => wroteThroughEditor,
})

export const aSession = (path = 'note.md'): SessionRepository =>
  new SessionRepository({ path, basename: path.replace(/\.md$/, '') } as TFile)

export const noHarness = (): HarnessToolsService =>
  new HarnessToolsService(
    new ObsidianCommandRunner(
      {} as App,
      new ObsidianCommandCatalogue(new ObsidianCommandRegistry({} as App), new AllowList([])),
      new OpenedNoteWait({} as App),
      new ObsidianCommandRegistry({} as App),
    ),
    new NoteReader(new FakeVault().asVault()),
    new ObsidianCommandCatalogue(new ObsidianCommandRegistry({} as App), new AllowList([])),
    false,
    new SearchToolsService(
      new NoteGlob(new FakeVault().asVault()),
      new NoteGrep(new FakeVault().asVault()),
    ),
    new DateToolService(),
  )

// A published line flattened to one string, so a test asserts what the turn
// said in one value. The note is a field rather than part of the detail, so it
// is joined back on here rather than dropped.
export const stepTextOf = (step: {
  label: string
  detail: string
  note: string | null
}): string => {
  if (step.note === null) return `${step.label}: ${step.detail}`
  if (step.detail === '') return `${step.label}: ${step.note}`
  return `${step.label}: ${step.detail} — ${step.note}`
}
