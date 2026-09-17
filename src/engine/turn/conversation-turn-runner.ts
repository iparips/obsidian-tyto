import { Outcome } from '../../shared/models/outcome'
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

  async run(): Promise<Outcome<string>> {
    const spend = new TurnSpend()
    for (let step = 0; !spend.isExhausted(); step++) {
      const turnStepOutcome = await this.runTurnStep(spend, step)
      if (turnStepOutcome.turnEnded()) return this.recordEndingAndGetOutcome(turnStepOutcome)
    }
    return this.recordEndingAndGetOutcome(TurnOutcomes.exhausted())
  }

  private recordEndingAndGetOutcome(endedTurn: EndedTurn): Outcome<string> {
    this.transcriptRepository.recordEnding(endedTurn.kind)
    return endedTurn.outcome
  }

  private async runTurnStep(spend: TurnSpend, stepNumber: number): Promise<TurnStepOutcome> {
    if (this.cancellationController.isCancelled())
      return this.turnEndingService.endTurnAsCancelled(this.repository.notesWritten())

    const modelAnswer = await this.modelService.askModel(stepNumber)

    // Whether an unfinished answer is a cancel or a failure is the ending
    // service's decision, so it comes back named rather than read a second time
    // off the same answer.
    if (!modelAnswer.succeeded())
      return this.turnEndingService.endTurnAsUnfinished(modelAnswer, this.repository.notesWritten())

    if (modelAnswer.value.isText()) return this.endTurnWithModelUtterance(modelAnswer.value.content)

    return this.executeToolCalls(modelAnswer.value.calls, spend)
  }

  private async executeToolCalls(calls: ToolCall[], spend: TurnSpend): Promise<TurnStepOutcome> {
    await this.toolCallExecutor.executeToolCalls(calls, spend.repeatedRefusalCounter)

    if (spend.repeatedRefusalCounter.isStuck())
      return TurnOutcomes.stuck(spend.repeatedRefusalCounter)

    this.spendOn(spend, calls.length)

    return TurnStepOutcomes.keepGoing()
  }

  private spendOn(spend: TurnSpend, calls: number): void {
    spend.iterationCounter.spend(calls)
    if (spend.iterationCounter.justRanLow())
      this.turnProgressPublisher.warnedFn(spend.iterationCounter.warning())
  }
  private endTurnWithModelUtterance(summary: string): EndedTurn {
    return this.turnEndingService.endTurnWithModelUtterance(
      summary,
      this.repository.targetNote(),
      this.repository.editEnd(),
    )
  }
}
