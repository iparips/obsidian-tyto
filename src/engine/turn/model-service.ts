import { ChatTurn } from '../../model/providers/models/chat-turn'
import { Outcome } from '../../shared/models/outcome'
import { ModelCaller } from '../../model/model-caller'
import { ModelRequest } from '../../model/model-request'
import { SessionRepository } from '../../session/session-repository'
import { TurnCancellationController } from './turn-cancellation-controller'
import { TurnRepository } from './turn-repository'

// One of the two outward calls a step makes. The loop that decides when to make
// it is ConversationTurnRunner; what it calls back is ToolCallExecutor.
export class ModelService {
  constructor(
    private sessionRepository: SessionRepository,
    private turnRepository: TurnRepository,
    private turnCancellationController: TurnCancellationController,
    private modelCaller: ModelCaller,
  ) {}

  // Logged around the call rather than after it, since a turn that feels slow is
  // one model call taking its time rather than the loop doing work between them.
  async askModel(step: number): Promise<Outcome<ChatTurn>> {
    const askedAt = Date.now()
    const answer = await this.modelCaller.ask(this.requestForModel())
    if (answer.succeeded()) this.logStep(step, answer.value, Date.now() - askedAt)
    return answer
  }

  private requestForModel(): ModelRequest {
    return new ModelRequest(
      this.turnRepository.targetNote(),
      this.turnRepository.skills(),
      this.turnRepository.agentMdChain(),
      this.sessionRepository.chatHistory(),
      this.turnCancellationController.signal(),
    )
  }

  // The only record of why a turn spent its iterations: the panel shows commands
  // and answers, but not the edits the model retried or the note it aimed at.
  private logStep(step: number, turn: ChatTurn, waitedMs: number): void {
    const calls = turn.isText() ? 'text' : turn.calls.map((call) => call.name).join(', ')
    const path = this.turnRepository.targetNote()?.path ?? 'no note'
    console.debug(`[owl] iteration ${step + 1} on ${path}: ${calls} (${waitedMs}ms)`)
  }
}
