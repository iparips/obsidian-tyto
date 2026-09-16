import { TFile } from 'obsidian'
import { EditEngine } from '../engine/edit-engine'
import { TurnEndingService } from '../engine/turn-ending-service'
import { NoteEditor } from '../engine/note-editing/note-editor'
import { HarnessToolsService } from '../engine/tools/harness-tools-service'
import { TargetNoteResolver } from '../engine/note-binding/target-note-resolver'
import { TurnProgressPublisher } from '../engine/turn-progress-publisher'
import { TurnRunnerFactory } from '../engine/turn/turn-runner-factory'
import { WorkspaceNoteLocator } from '../engine/note-binding/workspace-note-locator'
import { SessionRepository } from '../session/session-repository'
import { TranscriptRepository } from '../session/transcript/transcript-repository'
import { ChatProvider } from '../model/providers/types'
import { AllowList } from '../commands/allow-list'
import { ObsidianCommandCatalogue } from '../commands/obsidian-command-catalogue'
import { ObsidianCommandRegistry } from '../commands/obsidian-command-registry'
import { ObsidianCommandRunner } from '../commands/obsidian-command-runner'
import { OpenedNoteWait } from '../commands/opened-note-wait'
import { NoteGlob } from '../search/note-glob'
import { NoteGrep } from '../search/note-grep'
import { SearchToolsService } from '../engine/tools/search-tools-service'
import { DateToolService } from '../engine/tools/date-tool-service'
import { NoteReader } from '../search/note-reader'
import { NoteChoiceService } from '../engine/waiting/note-choice-service'
import { NoteOpener } from '../engine/note-binding/note-opener'
import { NotesChosenByUserRepository } from '../engine/turn/notes-chosen-by-user-repository'
import { TurnCancellationController } from '../engine/turn/turn-cancellation-controller'
import { UserQuestionService } from '../engine/waiting/user-question-service'
import { PluginScope } from './plugin-scope'

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
  constructor(private scope: PluginScope) {}

  build(
    modelProvider: ChatProvider,
    file: TFile | null,
    progress: TurnProgressPublisher,
    askers: EngineAskers = {},
    // Both built by SessionPanelPropsBuilder rather than here, because the panel reads
    // them and nothing built inside this factory can be read back. A recorded
    // step indexes into the history, so the two travel together.
    transcript: TranscriptRepository = new TranscriptRepository(),
    sessions: SessionRepository = new SessionRepository(file),
  ): EditEngine {
    const targetNote = new TargetNoteResolver(
      sessions,
      new WorkspaceNoteLocator(this.scope.app),
      this.scope.agentsMdRepository(),
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
        transcript,
      ),
      progress,
      targetNote,
    )
  }

  private buildTurnFactory(
    sessions: SessionRepository,
    targetNote: TargetNoteResolver,
    harnessToolsService: HarnessToolsService,
    progress: TurnProgressPublisher,
    askers: EngineAskers,
    modelProvider: ChatProvider,
    transcript: TranscriptRepository,
  ): TurnRunnerFactory {
    return new TurnRunnerFactory(
      sessions,
      targetNote,
      this.scope.skillRepository(),
      new NoteEditor(),
      harnessToolsService,
      progress,
      modelProvider,
      new TurnEndingService(sessions, new NoteEditor()),
      new NoteOpener(this.scope.app, new OpenedNoteWait(this.scope.app)),
      askers.noteChoiceService ??
        ((_cancellationController, notesChosenByUser) =>
          NoteChoiceService.unasked(notesChosenByUser)),
      askers.userQuestionService ?? (() => UserQuestionService.unanswered()),
      transcript,
    )
  }

  private buildHarnessTools(): HarnessToolsService {
    const registry = new ObsidianCommandRegistry(this.scope.app)
    const catalogue = new ObsidianCommandCatalogue(
      registry,
      new AllowList(this.scope.settings.commandAllowList),
    )
    return new HarnessToolsService(
      new ObsidianCommandRunner(
        this.scope.app,
        catalogue,
        new OpenedNoteWait(this.scope.app),
        registry,
      ),
      new NoteReader(this.scope.app.vault),
      catalogue,
      this.scope.settings.searchEnabled,
      new SearchToolsService(
        new NoteGlob(this.scope.app.vault),
        new NoteGrep(this.scope.app.vault),
      ),
      new DateToolService(),
      // Both modes ask about several candidates now, so both need the tool that
      // asks. The parameter stays because ToolCatalogue carries the search gate
      // through it (NFR4).
      true,
    )
  }
}
