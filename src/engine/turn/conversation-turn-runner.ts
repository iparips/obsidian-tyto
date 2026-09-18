import { ToolCall } from '../../model/providers/types'
import { TurnCancellationController } from './turn-cancellation-controller'
import { TurnEndingService } from '../turn-ending-service'
import { ModelService } from './model-service'
import { ToolCallExecutor } from './tool-call-executor'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { TurnRepository } from './turn-repository'
import { TurnSpend } from './spending/turn-spend'
import { TurnOutcomes } from './ending/turn-outcomes'
import { EndedTurn, TurnStepOutcome, TurnStepOutcomes } from './ending/turn-step-outcome'
import { TranscriptRepository } from '../../session/transcript/transcript-repository'
import { TurnResult } from './ending/turn-result'

// One turn, from the utterance that opened it to the outcome it returns. Holds
// its collaborators and drives them; what it spends lives in TurnSpend.
export class ConversationTurnRunner {
  constructor(
    private repository: TurnRepository,
    private cancellationController: TurnCancellationController,
    private modelService: ModelService,
    private toolCallExecutor: ToolCallExecutor,
    private turnEndingService: TurnEndingService,
    private turnProgressPublisher: TurnProgressPublisher,
    private transcriptRepository: TranscriptRepository,
  ) {}

  cancel(): void {
    this.cancellationController.cancel()
  }

  async run(): Promise<TurnResult> {
    const spend = new TurnSpend()
    while (!spend.isExhausted()) {
      const turnStepOutcome = await this.runTurnStep(spend)
      if (turnStepOutcome.turnEnded()) return this.recordEndingAndGetResult(turnStepOutcome)
    }
    return this.recordEndingAndGetResult(TurnOutcomes.exhausted())
  }

  private recordEndingAndGetResult(endedTurn: EndedTurn): TurnResult {
    this.transcriptRepository.recordEnding(endedTurn.kind)
    return TurnResult.ofEndedTurn(endedTurn)
  }

  private async runTurnStep(spend: TurnSpend): Promise<TurnStepOutcome> {
    if (this.cancellationController.isCancelled())
      return this.turnEndingService.endTurnAsCancelled(this.repository.notesWritten())

    const modelAnswer = await this.modelService.askModel()

    // Whether an unfinished answer is a cancel or a failure is the ending
    // service's decision, so it comes back named rather than read a second time
    // off the same answer.
    if (!modelAnswer.succeeded())
      return this.turnEndingService.endTurnAsUnfinished(modelAnswer, this.repository.notesWritten())

    if (modelAnswer.value.isText()) return this.endTurnWithModelUtterance(modelAnswer.value.content)

    return this.executeToolCalls(modelAnswer.value.calls, spend, modelAnswer.value.content)
  }

  // The answer is read after the stuck check, so a batch that answered beside
  // two identical refusals still ends as stuck, and before the keep-going it
  // replaces. The spend runs either way: the batch is charged for its calls.
  private async executeToolCalls(
    calls: ToolCall[],
    spend: TurnSpend,
    spokenContent: string,
  ): Promise<TurnStepOutcome> {
    const answer = await this.toolCallExecutor.executeToolCalls(
      calls,
      spend.repeatedRefusalCounter,
      spokenContent,
    )

    if (spend.repeatedRefusalCounter.isStuck())
      return TurnOutcomes.stuck(spend.repeatedRefusalCounter)

    this.spendOn(spend, calls.length)

    if (answer) return this.turnEndingService.endTurnWithAnswer(answer)

    return TurnStepOutcomes.keepGoing()
  }

  private spendOn(spend: TurnSpend, calls: number): void {
    spend.iterationCounter.spend(calls)
    if (spend.iterationCounter.justRanLow())
      this.turnProgressPublisher.runningLowFn(spend.iterationCounter.warning())
  }
  private endTurnWithModelUtterance(summary: string): EndedTurn {
    return this.turnEndingService.endTurnWithModelUtterance(
      summary,
      this.repository.targetNote(),
      this.repository.editEnd(),
    )
  }
}
