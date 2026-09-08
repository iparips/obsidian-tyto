import { ChatTurn, ToolCall } from '../providers/types'
import { App } from 'obsidian'
import { HarnessTools } from '../engine/tools/harness-tools'
import { ObsidianCommandRunner } from '../commands/obsidian-command-runner'
import { OpenedNoteWait } from '../commands/opened-note-wait'
import { ObsidianCommandCatalogue } from '../commands/obsidian-command-catalogue'
import { ObsidianCommandRegistry } from '../commands/obsidian-command-registry'
import { AllowList } from '../commands/allow-list'
import { NoteGlob } from '../search/note-glob'
import { NoteGrep } from '../search/note-grep'
import { SearchTools } from '../engine/tools/search-tools'
import { NoteReader } from '../search/note-reader'
import { FakeVault } from './fake-vault'
import { FakeAdapter } from './fake-adapter'
import { EditEngine } from '../engine/edit-engine'
import { ModelCaller } from '../engine/model-caller'
import { TurnConclusion } from '../engine/turn-conclusion'
import { NoteEditor } from '../engine/note-editing/note-editor'
import { TargetNoteResolver } from '../engine/note-binding/target-note-resolver'
import { TurnProgressPublisher } from '../engine/turn-progress-publisher'
import { TurnFactory } from '../engine/turn/turn-factory'
import { WorkspaceNoteLocator } from '../engine/note-binding/workspace-note-locator'
import { TFile } from 'obsidian'
import { SessionRepository } from '../session/session-repository'
import { AgentsMdRepository } from '../agents/agents-md-repository'
import { SkillRepository } from '../skills/skill-repository'
import { ChatProvider } from '../providers/types'
import { NoteChoice } from '../engine/waiting/note-choice'
import { NoteOpener } from '../engine/note-binding/note-opener'
import { NotesChosenByUserRepository } from '../engine/turn/notes-chosen-by-user-repository'
import { TurnCancellation } from '../engine/turn/turn-cancellation'
import { UserQuestion } from '../engine/waiting/user-question'

let nextCallId = 0

export const aToolCall = (name: string, args: Record<string, unknown>): ToolCall =>
  new ToolCall(`call-${nextCallId++}`, name, args)

export const aToolTurn = (...calls: ToolCall[]): ChatTurn => ChatTurn.ofToolCalls(calls)

export const aTextTurn = (content: string): ChatTurn => ChatTurn.ofText(content)

export interface EnginePartsOptions {
  sessions: SessionRepository
  noteLocator: WorkspaceNoteLocator
  agentsMdRepository: AgentsMdRepository
  skillRepository?: SkillRepository
  harnessTools?: HarnessTools
  progress?: TurnProgressPublisher
  noteOpener?: NoteOpener | null
  noteChoice?: (cancellation: TurnCancellation, chosen: NotesChosenByUserRepository) => NoteChoice
  userQuestion?: (cancellation: TurnCancellation) => UserQuestion
}

// The resolver and dispatcher a test needs beside an engine, wired the way
// EngineFactory wires them, so a test states only what it varies.
export const anEngine = (modelProvider: ChatProvider, options: EnginePartsOptions): EditEngine => {
  const skills = options.skillRepository ?? new SkillRepository(new FakeAdapter().asAdapter(), '')
  const harness = options.harnessTools ?? noHarness()
  const progress = options.progress ?? TurnProgressPublisher.silent()
  const targetNote = new TargetNoteResolver(
    options.sessions,
    options.noteLocator,
    options.agentsMdRepository,
    progress,
  )
  const turnFactory = new TurnFactory(
    options.sessions,
    targetNote,
    skills,
    new NoteEditor(),
    harness,
    progress,
    options.noteOpener ?? null,
    options.noteChoice ?? ((_cancellation, chosen) => NoteChoice.automatic(chosen)),
    options.userQuestion ?? (() => UserQuestion.unanswered()),
  )
  return new EditEngine(
    options.sessions,
    turnFactory,
    new ModelCaller(modelProvider, harness),
    new TurnConclusion(options.sessions, new NoteEditor()),
    progress,
  )
}

export const aSession = (path = 'note.md'): SessionRepository =>
  new SessionRepository({ path, basename: path.replace(/\.md$/, '') } as TFile)

export const noHarness = (): HarnessTools =>
  new HarnessTools(
    new ObsidianCommandRunner(
      {} as App,
      new ObsidianCommandCatalogue(new ObsidianCommandRegistry({} as App), new AllowList([])),
      new OpenedNoteWait({} as App),
      new ObsidianCommandRegistry({} as App),
    ),
    new NoteReader(new FakeVault().asVault()),
    new ObsidianCommandCatalogue(new ObsidianCommandRegistry({} as App), new AllowList([])),
    false,
    new SearchTools(
      new NoteGlob(new FakeVault().asVault()),
      new NoteGrep(new FakeVault().asVault()),
    ),
  )
