import { ChatMessage, ToolCall } from '../../model/providers/types'
import { RepeatedRefusalCounter } from './spending/repeated-refusal-counter'
import { SessionRepository } from '../../session/session-repository'
import { ToolDispatcher } from '../tool-dispatcher'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { TurnRepository } from './turn-repository'
import { TurnStep } from '../turn-step'

const SECOND_EDIT_REFUSAL =
  'One edit per step. The note is read at the start of each step, so a second ' +
  'edit here would anchor against a note the first one changed. Send this edit ' +
  'on the next step, or use write_note to make a scattered edit in one call.'

// One of the two outward calls a step makes: running back what the model asked
// for. What asked for it is ModelService.
export class ToolCallExecutor {
  constructor(
    private sessionRepository: SessionRepository,
    private turnRepository: TurnRepository,
    private toolDispatcher: ToolDispatcher,
    private turnProgressPublisher: TurnProgressPublisher,
  ) {}

  async executeToolCalls(toolCalls: ToolCall[], refusals: RepeatedRefusalCounter): Promise<void> {
    this.sessionRepository.appendChatMessage(ChatMessage.modelToolCalls(toolCalls))
    let editApplied = false
    for (const call of toolCalls) {
      if (this.isSecondEditIn(call, editApplied)) this.refuseSecondEdit(call)
      else await this.executeToolCall(call, refusals)
      editApplied = editApplied || call.isEditTool()
    }
  }

  private isSecondEditIn(call: ToolCall, editApplied: boolean): boolean {
    return call.isEditTool() && editApplied
  }

  // Not recorded against RepeatedRefusalCounter: two identical refusals end a
  // turn, and a batch of three edits produces this one twice.
  private refuseSecondEdit(call: ToolCall): void {
    this.turnProgressPublisher.publishStepTakenFn(TurnStep.refused(call.name, SECOND_EDIT_REFUSAL))
    this.sessionRepository.appendChatMessage(
      ChatMessage.toolCallResult(call.id, SECOND_EDIT_REFUSAL),
    )
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
