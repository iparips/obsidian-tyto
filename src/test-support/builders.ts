import { ChatTurn, ToolCall } from '../providers/types'
import { App } from 'obsidian'
import { HarnessTools } from '../engine/harness-tools'
import { CommandRunner } from '../commands/command-runner'
import { OpenedNoteWait } from '../commands/opened-note-wait'
import { CommandCatalogue } from '../commands/command-catalogue'
import { AllowList } from '../commands/allow-list'
import { VaultSearch } from '../search/vault-search'
import { NoteReader } from '../search/note-reader'
import { FakeVault } from './fake-vault'
import { FakeAdapter } from './fake-adapter'
import { EditEngine } from '../engine/edit-engine'
import { NoteEditor } from '../engine/note-editor'
import { TargetNoteResolver } from '../engine/target-note-resolver'
import { TurnProgressPublisher } from '../engine/turn-progress-publisher'
import { TurnFactory } from '../engine/turn-factory'
import { WorkspaceNoteLocator } from '../engine/workspace-note-locator'
import { TFile } from 'obsidian'
import { SessionRepository } from '../session/session-repository'
import { AgentsMdRepository } from '../agents/agents-md-repository'
import { SkillRepository } from '../skills/skill-repository'
import { ChatProvider } from '../providers/types'

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
  )
  return new EditEngine(
    modelProvider,
    options.sessions,
    new NoteEditor(),
    harness,
    turnFactory,
    progress,
  )
}

export const aSession = (path = 'note.md'): SessionRepository =>
  new SessionRepository({ path, basename: path.replace(/\.md$/, '') } as TFile)

export const noHarness = (): HarnessTools =>
  new HarnessTools(
    new CommandRunner(
      {} as App,
      new CommandCatalogue({} as App, new AllowList([])),
      new OpenedNoteWait({} as App),
    ),
    new VaultSearch(new FakeVault().asVault()),
    new NoteReader(new FakeVault().asVault()),
    new CommandCatalogue({} as App, new AllowList([])),
    false,
  )
