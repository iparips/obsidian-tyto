import { SkillRepository } from '../skills/skill-repository'
import { NoteEditor } from './note-editor'
import { NoteEditTool } from './note-edit-tool'
import { HarnessTools } from './harness-tools'
import { TargetNoteResolver } from './target-note-resolver'
import { ToolDispatcher } from './tool-dispatcher'
import { Turn } from './models/turn'
import { TurnRepository } from './turn-repository'
import { TurnProgressPublisher } from './turn-progress-publisher'
import { TurnCancellation } from './turn-cancellation'
import { OpenApproval } from './open-approval'
import { UserQuestion } from './user-question'
import { SessionRepository } from '../session/session-repository'
import { Attempt, Outcomes } from '../shared/models/outcome'

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
    // Built per turn rather than held, so the per-path hold dies with the turn
    // and nothing has to expire it (FR12). It takes the turn's cancellation, so
    // a parked confirmation settles on a cancel rather than parking the loop
    // forever (FR29).
    private buildOpenApproval: (cancellation: TurnCancellation) => OpenApproval = () =>
      OpenApproval.granted(),
    private buildUserQuestion: (cancellation: TurnCancellation) => UserQuestion = () =>
      UserQuestion.unanswered(),
  ) {}

  async openTurn(): Promise<Attempt<Turn>> {
    const resolved = await this.targetNoteResolver.resolve()
    if (resolved.hasFailed()) return Outcomes.failure(resolved.step, resolved.message)
    const skills = await this.skillRepository.listSkills()
    const turnRepository = new TurnRepository(resolved.value, skills)
    const cancellation = new TurnCancellation()
    const askers = this.askersFor(cancellation)
    const dispatcher = this.dispatcherFor(turnRepository, cancellation, askers)
    return Outcomes.success(new Turn(turnRepository, dispatcher, cancellation))
  }

  private askersFor(cancellation: TurnCancellation): TurnAskers {
    return {
      openApproval: this.buildOpenApproval(cancellation),
      userQuestion: this.buildUserQuestion(cancellation),
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
      askers.openApproval,
      askers.userQuestion,
    )
  }
}

// The two things a turn parks on, built together so a cancellation reaches both
// or neither.
interface TurnAskers {
  openApproval: OpenApproval
  userQuestion: UserQuestion
}
