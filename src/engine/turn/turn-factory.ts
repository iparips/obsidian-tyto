import { SkillRepository } from '../../skills/skill-repository'
import { NoteEditor } from '../note-editing/note-editor'
import { NoteEditTool } from '../tools/note-edit-tool'
import { HarnessTools } from '../tools/harness-tools'
import { TargetNoteResolver } from '../note-binding/target-note-resolver'
import { ToolDispatcher } from '../tool-dispatcher'
import { Turn } from './turn'
import { TurnRepository } from './turn-repository'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { TurnCancellation } from './turn-cancellation'
import { NoteChoice } from '../waiting/note-choice'
import { NoteOpener } from '../note-binding/note-opener'
import { ChosenNotes } from './chosen-notes'
import { SeenPaths } from '../../search/models/seen-paths'
import { TurnBudget } from './turn-budget'
import { UserQuestion } from '../waiting/user-question'
import { SessionRepository } from '../../session/session-repository'
import { Attempt, Outcomes } from '../../shared/models/outcome'

// Holds what outlives a turn and builds what does not, so the turn-scoped
// boundary is one class rather than a convention spread across the loop.
export class TurnFactory {
  constructor(
    private sessionRepository: SessionRepository,
    private targetNoteResolver: TargetNoteResolver,
    private skillRepository: SkillRepository,
    private noteEditor: NoteEditor,
    private harnessTools: HarnessTools,
    private turnProgressPublisher: TurnProgressPublisher,
    // Null where nothing can open a note, which is every test that exercises the
    // guards rather than the workspace.
    private noteOpener: NoteOpener | null = null,
    // Built per turn because it takes the turn's cancellation, so a parked
    // choice settles on a cancel rather than parking the loop forever (NFR2).
    // The set it records into comes from the turn, so what the user chose dies
    // with the write they consented to (FR5).
    private buildNoteChoice: (cancellation: TurnCancellation, chosen: ChosenNotes) => NoteChoice = (
      _cancellation,
      chosen,
    ) => NoteChoice.automatic(chosen),
    private buildUserQuestion: (cancellation: TurnCancellation) => UserQuestion = () =>
      UserQuestion.unanswered(),
  ) {}

  // Session-scoped, so a note found in one turn can still be opened in the
  // next. A path that has gone stale fails loudly on the read, which is a
  // better answer than refusing one the user watched the model find.
  private readonly pathsSeenInThisSession = new SeenPaths()

  async openTurn(): Promise<Attempt<Turn>> {
    const resolvedNote = await this.targetNoteResolver.resolve()
    if (resolvedNote.hasFailed()) return Outcomes.failure(resolvedNote.step, resolvedNote.message)
    const skills = await this.skillRepository.listSkills()
    const turnRepository = new TurnRepository(
      resolvedNote.value,
      skills,
      new TurnBudget(),
      this.pathsSeenInThisSession,
    )
    const cancellation = new TurnCancellation()
    const askers = this.askersFor(cancellation, turnRepository.chosenNotes)
    const toolDispatcher = this.dispatcherFor(turnRepository, cancellation, askers)
    return Outcomes.success(new Turn(turnRepository, toolDispatcher, cancellation))
  }

  private askersFor(turnCancellation: TurnCancellation, chosenNotes: ChosenNotes): TurnAskers {
    return {
      noteChoice: this.buildNoteChoice(turnCancellation, chosenNotes),
      userQuestion: this.buildUserQuestion(turnCancellation),
    }
  }

  private dispatcherFor(
    repository: TurnRepository,
    cancellation: TurnCancellation,
    askers: TurnAskers,
  ): ToolDispatcher {
    return new ToolDispatcher(
      this.sessionRepository,
      this.targetNoteResolver,
      this.skillRepository,
      new NoteEditTool(this.noteEditor, repository),
      this.harnessTools,
      this.turnProgressPublisher,
      repository,
      cancellation,
      askers.noteChoice,
      askers.userQuestion,
      this.noteOpener,
    )
  }
}

// The two things a turn parks on, built together so a cancellation reaches both
// or neither.
interface TurnAskers {
  noteChoice: NoteChoice
  userQuestion: UserQuestion
}
