import { ChatMessage, ToolCall } from '../../model/providers/types'
import { RepeatedRefusalCounter } from './spending/repeated-refusal-counter'
import { SessionRepository } from '../../session/session-repository'
import { ToolDispatcher } from '../tool-dispatcher'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { TurnRepository } from './turn-repository'
import { ProgressLine } from '../progress-line'

const SECOND_EDIT_REFUSAL =
  'One edit per step. The note is read at the start of each step, so a second ' +
  'edit here would anchor against a note the first one changed. Send this edit ' +
  'on the next step, or use write_note to make a scattered edit in one call.'

const movedTargetRefusalFor = (openedPath: string | null, previousPath: string | null): string =>
  `One note per step. Running that opened ${openedPath}, and the note this step ` +
  `was read against was ${previousPath}, so this call would act on a note you ` +
  `have not been shown. Send it on the next step, which reads ${openedPath} first.`

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
    const targetAtStepStart = this.sessionRepository.targetNote()
    for (const call of toolCalls) {
      if (this.hasTargetMovedFrom(targetAtStepStart)) this.refuseAfterMove(call, targetAtStepStart)
      else if (this.isSecondEditIn(call, editApplied)) this.refuseSecondEdit(call)
      else await this.executeToolCall(call, refusals)
      editApplied = editApplied || call.isEditTool()
    }
  }

  // The step's own target, not the last call's: the note ModelService read at
  // the step's start is what every call in the step is anchored against. The
  // session's target rather than the turn's, since a retarget to a path that
  // will not resolve binds the session and leaves the turn's note where it was.
  private hasTargetMovedFrom(targetAtStepStart: string | null): boolean {
    return this.sessionRepository.targetNote() !== targetAtStepStart
  }

  // Not recorded against RepeatedRefusalCounter, for the reason refuseSecondEdit
  // gives: a batch of three commands produces this one twice.
  private refuseAfterMove(call: ToolCall, targetAtStepStart: string | null): void {
    const openedPath = this.sessionRepository.targetNote()
    this.refuse(call, movedTargetRefusalFor(openedPath, targetAtStepStart))
  }

  private isSecondEditIn(call: ToolCall, editApplied: boolean): boolean {
    return call.isEditTool() && editApplied
  }

  // Not recorded against RepeatedRefusalCounter: two identical refusals end a
  // turn, and a batch of three edits produces this one twice.
  private refuseSecondEdit(call: ToolCall): void {
    this.refuse(call, SECOND_EDIT_REFUSAL)
  }

  private refuse(call: ToolCall, reason: string): void {
    this.turnProgressPublisher.publishProgressLineFn(ProgressLine.refused(call.name, reason))
    this.sessionRepository.appendChatMessage(ChatMessage.toolCallResult(call.id, reason))
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
