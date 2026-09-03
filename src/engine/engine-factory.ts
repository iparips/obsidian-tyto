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
import { NoteGlob } from '../search/note-glob'
import { NoteGrep } from '../search/note-grep'
import { SearchTools } from './search-tools'
import { NoteReader } from '../search/note-reader'
import { OwlSettings } from '../settings/settings'
import { NoteChoice } from './note-choice'
import { NoteOpener } from './note-opener'
import { ChosenNotes } from './models/chosen-notes'
import { TurnCancellation } from './turn-cancellation'
import { UserQuestion } from './user-question'

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
      modelProvider,
      sessions,
      new NoteEditor(),
      harnessTools,
      this.buildTurnFactory(sessions, targetNote, harnessTools, progress, askers),
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
    const registry = new CommandRegistry(this.app)
    const catalogue = new CommandCatalogue(registry, new AllowList(this.settings.commandAllowList))
    return new HarnessTools(
      new CommandRunner(this.app, catalogue, new OpenedNoteWait(this.app), registry),
      new NoteReader(this.app.vault),
      catalogue,
      this.settings.searchEnabled,
      new SearchTools(new NoteGlob(this.app.vault), new NoteGrep(this.app.vault)),
      this.settings.openMode === 'confirm',
    )
  }
}
