import { SessionRepository } from '../../session/session-repository'
import { WorkspaceNoteLocator } from './workspace-note-locator'
import { AgentsMdRepository } from '../../agents/agents-md-repository'
import { AgentsMdChain } from '../../agents/agents-md-chain'
import { ResolvedNote } from './resolved-note'
import {
  NoNoteBound,
  ResolutionFailed,
  TargetResolution,
  TargetResolved,
} from './target-resolution'
import { OpenNote } from '../note-editing/open-note'
import { TurnProgressPublisher } from '../turn-progress-publisher'

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

  // Which of the three the session is in. An unbound session is NoNoteBound
  // rather than a failure, so the turn still opens and the search tools work.
  async resolve(): Promise<TargetResolution> {
    const targetPath = this.sessionRepository.targetNote()
    if (targetPath === null) return new NoNoteBound()
    return this.resolveFor(targetPath)
  }

  // Resolves the path it is given rather than reading the session back. A tool
  // that opened a note names it, and the user moving tabs between the open and
  // this call would otherwise hand the turn an editor showing another note.
  async resolveFor(path: string): Promise<TargetResolution> {
    const openNoteOutcome = await this.noteLocator.locate(path)
    if (openNoteOutcome.hasFailed()) return new ResolutionFailed(path, openNoteOutcome.message)
    const openNote = openNoteOutcome.value
    return new TargetResolved(
      new ResolvedNote(openNote, await this.collectAgentMdInstructions(openNote)),
    )
  }

  // The two ways a resolve finds nothing writable are one fact mid-turn: a note
  // that will not resolve leaves the turn where it was, which is where an
  // unbound session leaves it too. Only opening a turn tells them apart, since
  // only there does an unreachable note have a message to fail with.
  async resolveOrNothing(path: string): Promise<ResolvedNote | null> {
    return (await this.resolveFor(path)).noteOrNull()
  }

  // Resolved from the note this turn writes to, not from the session, and
  // passed down rather than held, so no chain reaches another target (FR8, FR13).
  private async collectAgentMdInstructions(note: OpenNote): Promise<AgentsMdChain> {
    const chain = await this.agentsMdRepository.resolveFor(note.path)
    this.turnProgressPublisher.instructionsResolvedFn(chain)
    return chain
  }
}
