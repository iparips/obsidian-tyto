import { App, TFile } from 'obsidian'
import { EditEngine } from './edit-engine'
import { ModelCaller } from './model-caller'
import { TurnConclusion } from './turn-conclusion'
import { NoteEditor } from './note-editing/note-editor'
import { HarnessTools } from './tools/harness-tools'
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
import { SearchTools } from './tools/search-tools'
import { NoteReader } from '../search/note-reader'
import { OwlSettings } from '../settings/settings'
import { NoteChoice } from './waiting/note-choice'
import { NoteOpener } from './note-binding/note-opener'
import { ChosenNotes } from './turn/chosen-notes'
import { TurnCancellation } from './turn/turn-cancellation'
import { UserQuestion } from './waiting/user-question'

// How a session builds what a turn parks on. Both take the turn's cancellation,
// so a parked question settles on a cancel rather than parking the loop.
export interface EngineAskers {
  noteChoice?(cancellation: TurnCancellation, chosen: ChosenNotes): NoteChoice
  userQuestion?(cancellation: TurnCancellation): UserQuestion
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
    const harnessTools = this.buildHarnessTools()
    return new EditEngine(
      sessions,
      this.buildTurnFactory(sessions, targetNote, harnessTools, progress, askers),
      new ModelCaller(modelProvider, harnessTools),
      new TurnConclusion(sessions, new NoteEditor()),
      progress,
    )
  }

  private buildTurnFactory(
    sessions: SessionRepository,
    targetNote: TargetNoteResolver,
    harnessTools: HarnessTools,
    progress: TurnProgressPublisher,
    askers: EngineAskers,
  ): TurnFactory {
    return new TurnFactory(
      sessions,
      targetNote,
      this.skillRepository,
      new NoteEditor(),
      harnessTools,
      progress,
      new NoteOpener(this.app, new OpenedNoteWait(this.app)),
      askers.noteChoice ?? ((_cancellation, chosen) => NoteChoice.automatic(chosen)),
      askers.userQuestion ?? (() => UserQuestion.unanswered()),
    )
  }

  private buildHarnessTools(): HarnessTools {
    const registry = new ObsidianCommandRegistry(this.app)
    const catalogue = new ObsidianCommandCatalogue(
      registry,
      new AllowList(this.settings.commandAllowList),
    )
    return new HarnessTools(
      new ObsidianCommandRunner(this.app, catalogue, new OpenedNoteWait(this.app), registry),
      new NoteReader(this.app.vault),
      catalogue,
      this.settings.searchEnabled,
      new SearchTools(new NoteGlob(this.app.vault), new NoteGrep(this.app.vault)),
      this.settings.openMode === 'confirm',
    )
  }
}
