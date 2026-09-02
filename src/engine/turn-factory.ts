import { SkillRepository } from '../skills/skill-repository'
import { NoteEditor } from './note-editor'
import { HarnessTools } from './harness-tools'
import { TargetNoteResolver } from './target-note-resolver'
import { ToolDispatcher } from './tool-dispatcher'
import { Turn } from './models/turn'
import { TurnRepository } from './turn-repository'
import { TurnProgressPublisher } from './turn-progress-publisher'
import { SessionRepository } from '../session/session-repository'
import { Outcome, Outcomes } from '../shared/models/outcome'

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
  ) {}

  async openTurn(): Promise<Outcome<Turn>> {
    const resolved = await this.targetNoteResolver.resolve()
    if (resolved.hasFailed()) return Outcomes.failure(resolved.step, resolved.message)
    const skills = await this.skillRepository.listSkills()
    const turnRepository = new TurnRepository(resolved.value, skills)
    return Outcomes.success(new Turn(turnRepository, this.dispatcherFor(turnRepository)))
  }

  private dispatcherFor(repository: TurnRepository): ToolDispatcher {
    return new ToolDispatcher(
      this.sessionRepository,
      this.targetNoteResolver,
      this.skillRepository,
      this.noteEditor,
      this.harnessTools,
      this.turnProgressPublisher,
      repository,
    )
  }
}
