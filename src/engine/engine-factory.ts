import { App, TFile } from 'obsidian'
import { EditEngine } from './edit-engine'
import { NoteEditor } from './note-editor'
import { HarnessTools } from './harness-tools'
import { TargetNoteResolver } from './target-note-resolver'
import { TurnProgressPublisher } from './turn-progress-publisher'
import { TurnFactory } from './turn-factory'
import { WorkspaceNoteLocator } from './workspace-note-locator'
import { SessionRepository } from '../session/session-repository'
import { AgentsMdRepository } from '../agents/agents-md-repository'
import { SkillRepository } from '../skills/skill-repository'
import { ChatProvider } from '../providers/types'
import { AllowList } from '../commands/allow-list'
import { CommandCatalogue } from '../commands/command-catalogue'
import { CommandRegistry } from '../commands/command-registry'
import { CommandRunner } from '../commands/command-runner'
import { OpenedNoteWait } from '../commands/opened-note-wait'
import { NoteReader } from '../search/note-reader'
import { VaultSearch } from '../search/vault-search'
import { OwlSettings } from '../settings/settings'

// Assembles one session's engine. Every collaborator is explicit, and this is
// the only place that knows how they fit together.
export class EngineFactory {
  constructor(
    private app: App,
    private settings: OwlSettings,
    private skillRepository: SkillRepository,
    private agentsMdRepository: AgentsMdRepository,
  ) {}

  build(
    modelProvider: ChatProvider,
    file: TFile | null,
    progress: TurnProgressPublisher,
  ): EditEngine {
    const sessions = new SessionRepository(file)
    const targetNote = new TargetNoteResolver(
      sessions,
      new WorkspaceNoteLocator(this.app),
      this.agentsMdRepository,
      progress,
    )
    const harnessTools = this.buildHarnessTools()
    return new EditEngine(
      modelProvider,
      sessions,
      new NoteEditor(),
      harnessTools,
      this.buildTurnFactory(sessions, targetNote, harnessTools, progress),
      progress,
    )
  }

  private buildTurnFactory(
    sessions: SessionRepository,
    targetNote: TargetNoteResolver,
    harnessTools: HarnessTools,
    progress: TurnProgressPublisher,
  ): TurnFactory {
    return new TurnFactory(
      sessions,
      targetNote,
      this.skillRepository,
      new NoteEditor(),
      harnessTools,
      progress,
    )
  }

  private buildHarnessTools(): HarnessTools {
    const registry = new CommandRegistry(this.app)
    const catalogue = new CommandCatalogue(registry, new AllowList(this.settings.commandAllowList))
    return new HarnessTools(
      new CommandRunner(this.app, catalogue, new OpenedNoteWait(this.app), registry),
      new VaultSearch(this.app.vault),
      new NoteReader(this.app.vault),
      catalogue,
      this.settings.searchEnabled,
    )
  }
}
