import { ChatMessage, ToolCall } from '../../model/providers/types'
import { RepeatedRefusalCounter } from './repeated-refusal-counter'
import { SessionRepository } from '../../session/session-repository'
import { ToolDispatcher } from '../tool-dispatcher'
import { TurnRepository } from './turn-repository'

// One of the two outward calls a step makes: running back what the model asked
// for. What asked for it is ModelService.
export class ToolCallExecutor {
  constructor(
    private sessionRepository: SessionRepository,
    private turnRepository: TurnRepository,
    private toolDispatcher: ToolDispatcher,
  ) {}

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
