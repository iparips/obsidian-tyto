import { SkillRepository } from '../../skills/skill-repository'
import { NoteEditor } from '../note-editing/note-editor'
import { NoteEditTool } from '../tools/note-edit-tool'
import { HarnessToolsService } from '../tools/harness-tools-service'
import { TargetNoteResolver } from '../note-binding/target-note-resolver'
import { ToolDispatcher } from '../tool-dispatcher'
import { ConversationTurnRunner } from './conversation-turn-runner'
import { TurnRepository } from './turn-repository'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { TurnCancellationController } from './turn-cancellation-controller'
import { NoteChoiceService } from '../waiting/note-choice-service'
import { NoteOpener } from '../note-binding/note-opener'
import { NotesChosenByUserRepository } from './notes-chosen-by-user-repository'
import { PathsReturnedByVaultRepository } from '../../search/models/paths-returned-by-vault-repository'
import { NotesOpenedCounter } from './notes-opened-counter'
import { UserQuestionService } from '../waiting/user-question-service'
import { SessionRepository } from '../../session/session-repository'
import { Attempt, Outcomes } from '../../shared/models/outcome'
import { ModelCaller } from '../model-caller'
import { TurnConclusionService } from '../turn-conclusion-service'
import { TurnStepService } from './turn-step-service'

// Holds what outlives a turn and builds what does not, so the turn-scoped
// boundary is one class rather than a convention spread across the loop.
export class TurnRunnerFactory {
  constructor(
    private sessionRepository: SessionRepository,
    private targetNoteResolver: TargetNoteResolver,
    private skillRepository: SkillRepository,
    private noteEditor: NoteEditor,
    private harnessToolsService: HarnessToolsService,
    private turnProgressPublisher: TurnProgressPublisher,
    private modelCaller: ModelCaller,
    private turnConclusionService: TurnConclusionService,
    // Null where nothing can open a note, which is every test that exercises the
    // guards rather than the workspace.
    private noteOpener: NoteOpener | null = null,
    // Built per turn because it takes the turn's cancellation, so a parked
    // choice settles on a cancel rather than parking the loop forever (NFR2).
    // The set it records into comes from the turn, so what the user chose dies
    // with the write they consented to (FR5).
    private buildNoteChoice: (
      cancellationController: TurnCancellationController,
      notesChosenByUser: NotesChosenByUserRepository,
    ) => NoteChoiceService = (_cancellationController, notesChosenByUser) =>
      NoteChoiceService.automatic(notesChosenByUser),
    private buildUserQuestion: (
      cancellationController: TurnCancellationController,
    ) => UserQuestionService = () => UserQuestionService.unanswered(),
  ) {}

  // Session-scoped, so a note found in one turn can still be opened in the
  // next. A path that has gone stale fails loudly on the read, which is a
  // better answer than refusing one the user watched the model find.
  private readonly pathsReturnedByVault = new PathsReturnedByVaultRepository()

  // Opened on the utterance EditEngine has already recorded, so a turn that
  // cannot open still leaves the history holding what was said to it.
  async build(): Promise<Attempt<ConversationTurnRunner>> {
    const resolution = await this.targetNoteResolver.resolve()
    // The one caller that tells the three states apart: a named note nothing
    // can show refuses the turn so the message reaches the user, where an
    // unbound session opens one that searches and answers without writing.
    if (resolution.hasFailed()) return Outcomes.failure('apply', resolution.reason)
    const skills = await this.skillRepository.listSkills()
    const turnRepository = new TurnRepository(
      resolution.noteOrNull(),
      skills,
      new NotesOpenedCounter(),
      this.pathsReturnedByVault,
    )
    const cancellationController = new TurnCancellationController()
    const askers = this.askersFor(cancellationController, turnRepository.notesChosenByUser)
    const toolDispatcher = this.dispatcherFor(turnRepository, cancellationController, askers)
    return Outcomes.success(this.buildTurn(turnRepository, toolDispatcher, cancellationController))
  }

  private buildTurn(
    repository: TurnRepository,
    toolDispatcher: ToolDispatcher,
    cancellationController: TurnCancellationController,
  ): ConversationTurnRunner {
    return new ConversationTurnRunner(repository, cancellationController, new TurnStepService(
      this.sessionRepository,
      repository,
      toolDispatcher,
      cancellationController,
      this.modelCaller,
    ), this.turnConclusionService, this.turnProgressPublisher)
  }

  private askersFor(
    turnCancellation: TurnCancellationController,
    notesChosenByUser: NotesChosenByUserRepository,
  ): TurnAskersService {
    return {
      noteChoiceService: this.buildNoteChoice(turnCancellation, notesChosenByUser),
      userQuestionService: this.buildUserQuestion(turnCancellation),
    }
  }

  private dispatcherFor(
    repository: TurnRepository,
    cancellationController: TurnCancellationController,
    askers: TurnAskersService,
  ): ToolDispatcher {
    return new ToolDispatcher(
      this.sessionRepository,
      this.targetNoteResolver,
      this.skillRepository,
      new NoteEditTool(this.noteEditor, repository),
      this.harnessToolsService,
      this.turnProgressPublisher,
      repository,
      cancellationController,
      askers.noteChoiceService,
      askers.userQuestionService,
      this.noteOpener,
    )
  }
}

// The two things a turn parks on, built together so a cancellation reaches both
// or neither.
interface TurnAskersService {
  noteChoiceService: NoteChoiceService
  userQuestionService: UserQuestionService
}
