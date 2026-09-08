import { App, TFile } from 'obsidian'
import { EditEngine } from './edit-engine'
import { ModelCaller } from './model-caller'
import { TurnConclusionService } from './turn-conclusion-service'
import { NoteEditor } from './note-editing/note-editor'
import { HarnessToolsService } from './tools/harness-tools-service'
import { TargetNoteResolver } from './note-binding/target-note-resolver'
import { TurnProgressPublisher } from './turn-progress-publisher'
import { TurnFactory } from './turn/turn-factory'
import { WorkspaceNoteLocator } from './note-binding/workspace-note-locator'
import { SessionRepository } from '../session/session-repository'
import { AgentsMdRepository } from '../agents/agents-md-repository'
import { SkillRepository } from '../skills/skill-repository'
import { ChatProvider } from '../providers/types'
import { AllowList } from '../commands/allow-list'
import { ObsidianCommandCatalogue } from '../commands/obsidian-command-catalogue'
import { ObsidianCommandRegistry } from '../commands/obsidian-command-registry'
import { ObsidianCommandRunner } from '../commands/obsidian-command-runner'
import { OpenedNoteWait } from '../commands/opened-note-wait'
import { NoteGlob } from '../search/note-glob'
import { NoteGrep } from '../search/note-grep'
import { SearchToolsService } from './tools/search-tools-service'
import { NoteReader } from '../search/note-reader'
import { OwlSettings } from '../settings/settings'
import { NoteChoiceService } from './waiting/note-choice-service'
import { NoteOpener } from './note-binding/note-opener'
import { NotesChosenByUserRepository } from './turn/notes-chosen-by-user-repository'
import { TurnCancellationController } from './turn/turn-cancellation-controller'
import { UserQuestionService } from './waiting/user-question-service'

// How a session builds what a turn parks on. Both take the turn's cancellation,
// so a parked question settles on a cancel rather than parking the loop.
export interface EngineAskers {
  noteChoiceService?(
    cancellationController: TurnCancellationController,
    notesChosenByUser: NotesChosenByUserRepository,
  ): NoteChoiceService
  userQuestionService?(cancellationController: TurnCancellationController): UserQuestionService
}

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
    askers: EngineAskers = {},
  ): EditEngine {
    const sessions = new SessionRepository(file)
    const targetNote = new TargetNoteResolver(
      sessions,
      new WorkspaceNoteLocator(this.app),
      this.agentsMdRepository,
      progress,
    )
    const harnessToolsService = this.buildHarnessTools()
    return new EditEngine(
      sessions,
      this.buildTurnFactory(
        sessions,
        targetNote,
        harnessToolsService,
        progress,
        askers,
        modelProvider,
      ),
      progress,
    )
  }

  private buildTurnFactory(
    sessions: SessionRepository,
    targetNote: TargetNoteResolver,
    harnessToolsService: HarnessToolsService,
    progress: TurnProgressPublisher,
    askers: EngineAskers,
    modelProvider: ChatProvider,
  ): TurnFactory {
    return new TurnFactory(
      sessions,
      targetNote,
      this.skillRepository,
      new NoteEditor(),
      harnessToolsService,
      progress,
      new ModelCaller(modelProvider, harnessToolsService),
      new TurnConclusionService(sessions, new NoteEditor()),
      new NoteOpener(this.app, new OpenedNoteWait(this.app)),
      askers.noteChoiceService ??
        ((_cancellationController, notesChosenByUser) =>
          NoteChoiceService.automatic(notesChosenByUser)),
      askers.userQuestionService ?? (() => UserQuestionService.unanswered()),
    )
  }

  private buildHarnessTools(): HarnessToolsService {
    const registry = new ObsidianCommandRegistry(this.app)
    const catalogue = new ObsidianCommandCatalogue(
      registry,
      new AllowList(this.settings.commandAllowList),
    )
    return new HarnessToolsService(
      new ObsidianCommandRunner(this.app, catalogue, new OpenedNoteWait(this.app), registry),
      new NoteReader(this.app.vault),
      catalogue,
      this.settings.searchEnabled,
      new SearchToolsService(new NoteGlob(this.app.vault), new NoteGrep(this.app.vault)),
      this.settings.openMode === 'confirm',
    )
  }
}
