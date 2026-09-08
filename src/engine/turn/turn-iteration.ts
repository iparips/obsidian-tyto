import { ChatMessage, ToolCall } from '../../providers/types'
import { ChatTurn } from '../../providers/models/chat-turn'
import { Outcome } from '../../shared/models/outcome'
import { ModelCaller, ModelRequest } from '../model-caller'
import { RepeatedRefusalCounter } from './repeated-refusal-counter'
import { SessionRepository } from '../../session/session-repository'
import { ToolDispatcher } from '../tool-dispatcher'
import { TurnCancellationController } from './turn-cancellation-controller'
import { TurnRepository } from './turn-repository'

// The two outward calls a pass makes: asking the model, and running what it
// called back. The loop that decides when to make them is Turn.
export class TurnIteration {
  constructor(
    private sessionRepository: SessionRepository,
    private turnRepository: TurnRepository,
    private toolDispatcher: ToolDispatcher,
    private cancellationController: TurnCancellationController,
    private modelCaller: ModelCaller,
  ) {}

  // Logged around the call rather than after it, since a turn that feels slow is
  // one model call taking its time rather than the loop doing work between them.
  async askModel(iteration: number): Promise<Outcome<ChatTurn>> {
    const askedAt = Date.now()
    const answer = await this.modelCaller.ask(this.requestForModel())
    if (answer.succeeded()) this.logIteration(iteration, answer.value, Date.now() - askedAt)
    return answer
  }

  private requestForModel(): ModelRequest {
    return new ModelRequest(
      this.turnRepository.targetNote(),
      this.turnRepository.skills(),
      this.turnRepository.agentMdChain(),
      this.sessionRepository.chatHistory(),
      this.cancellationController.signal(),
    )
  }

  // The only record of why a turn spent its iterations: the panel shows commands
  // and answers, but not the edits the model retried or the note it aimed at.
  private logIteration(iteration: number, turn: ChatTurn, waitedMs: number): void {
    const calls = turn.isText() ? 'text' : turn.calls.map((call) => call.name).join(', ')
    const path = this.turnRepository.targetNote()?.path ?? 'no note'
    console.debug(`[owl] iteration ${iteration + 1} on ${path}: ${calls} (${waitedMs}ms)`)
  }

  async executeToolCalls(toolCalls: ToolCall[], refusals: RepeatedRefusalCounter): Promise<void> {
    this.sessionRepository.appendChatMessage(ChatMessage.modelToolCalls(toolCalls))
    for (const call of toolCalls) {
      await this.executeToolCall(call, refusals)
    }
  }

  private async executeToolCall(call: ToolCall, refusals: RepeatedRefusalCounter): Promise<void> {
    const toolCallOutcome = await this.toolDispatcher.execute(call)
    this.sessionRepository.appendChatMessage(
      ChatMessage.toolCallResult(call.id, toolCallOutcome.result),
    )
    this.turnRepository.storeCursorPositionAndWrittenNote(toolCallOutcome.editEndPosition)
    refusals.record(toolCallOutcome.refusal ?? null)
  }
}
