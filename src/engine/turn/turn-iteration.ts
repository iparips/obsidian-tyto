import { ChatMessage, ToolCall } from '../../providers/types'
import { ChatTurn } from '../../providers/models/chat-turn'
import { Outcome } from '../../shared/models/outcome'
import { ModelCaller, ModelRequest } from '../model-caller'
import { RepeatedRefusalCounter } from './repeated-refusal-counter'
import { SessionRepository } from '../../session/session-repository'
import { ToolDispatcher } from '../tool-dispatcher'
import { TurnCancellationController } from './turn-cancellation-controller'
import { TurnRepository } from './turn-repository'

// What one model call cost, kept together so the loop can log the answer with
// the wait that produced it.
export class TimedAnswer {
  constructor(
    readonly outcome: Outcome<ChatTurn>,
    readonly waitedMs: number,
  ) {}
}

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

  // Timed around the call rather than after it, since a turn that feels slow is
  // one model call taking its time rather than the loop doing work between them.
  // The pass it belongs to is the loop's to say, so Turn logs what comes back.
  async askModel(): Promise<TimedAnswer> {
    const askedAt = Date.now()
    const answer = await this.modelCaller.ask(this.requestForModel())
    return new TimedAnswer(answer, Date.now() - askedAt)
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
  logPass(pass: number, answer: TimedAnswer): void {
    if (!answer.outcome.succeeded()) return
    const turn = answer.outcome.value
    const calls = turn.isText() ? 'text' : turn.calls.map((call) => call.name).join(', ')
    const path = this.turnRepository.targetNote()?.path ?? 'no note'
    console.debug(`[owl] iteration ${pass + 1} on ${path}: ${calls} (${answer.waitedMs}ms)`)
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
