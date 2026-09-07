import { SessionRepository } from '../session/session-repository'
import { WorkspaceNoteLocator } from './workspace-note-locator'
import { AgentsMdRepository } from '../agents/agents-md-repository'
import { AgentsMdChain } from '../agents/agents-md-chain'
import { ResolvedNote } from './models/resolved-note'
import { OpenNote } from './models/open-note'
import { Attempt, Outcomes } from '../shared/models/outcome'
import { TurnProgressPublisher } from './turn-progress-publisher'

// Turns the session's target path into something writable: the editor showing
// it, and the chain its folders state. A path is what survives between turns;
// an editor handle would go stale the moment the user closed the tab.
export class TargetNoteResolver {
  constructor(
    private sessionRepository: SessionRepository,
    private noteLocator: WorkspaceNoteLocator,
    private agentsMdRepository: AgentsMdRepository,
    private turnProgressPublisher: TurnProgressPublisher,
  ) {}

  // A null note is an unbound session rather than a failure, so the turn opens
  // and the search tools work.
  async resolve(): Promise<Attempt<ResolvedNote | null>> {
    const targetPath = this.sessionRepository.targetNote()
    if (targetPath === null) return Outcomes.success(null)
    const openNoteOutcome = this.noteLocator.locate(targetPath)
    if (openNoteOutcome.hasFailed())
      return Outcomes.failure(openNoteOutcome.step, openNoteOutcome.message)
    const openNote = openNoteOutcome.value
    return Outcomes.success(
      new ResolvedNote(openNote, await this.collectAgentMdInstructions(openNote)),
    )
  }

  // Resolved from the note this turn writes to, not from the session, and
  // passed down rather than held, so no chain reaches another target (FR8, FR13).
  private async collectAgentMdInstructions(note: OpenNote): Promise<AgentsMdChain> {
    const chain = await this.agentsMdRepository.resolveFor(note.path)
    this.turnProgressPublisher.instructionsResolved(chain)
    return chain
  }
}
