import { Outcome } from '../../shared/models/outcome'
import { ResolvedNote } from '../note-binding/resolved-note'
import { ToolCall } from '../../model/providers/types'
import { TurnCancellationController } from './turn-cancellation-controller'
import { TurnEndingService } from '../turn-ending-service'
import { ModelService } from './model-service'
import { ToolCallExecutor } from './tool-call-executor'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { TurnRepository } from './turn-repository'
import { TurnSpend } from './turn-spend'
import { TurnOutcomes } from './turn-outcomes'
import { TurnStepOutcome, TurnStepOutcomes } from './turn-step-outcome'

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
  ) {}

  cancel(): void {
    this.cancellationController.cancel()
  }

  // The turn owns what it writes to, so a note opened behind it arrives here
  // rather than through the repository it holds.
  retargetTo(resolved: ResolvedNote): void {
    this.repository.retargetTo(resolved)
  }

  async run(): Promise<Outcome<string>> {
    const spend = new TurnSpend()
    for (let step = 0; !spend.isExhausted(); step++) {
      const turnStepOutcome = await this.runTurnStep(spend, step)
      if (turnStepOutcome.turnEnded()) return turnStepOutcome.outcome
    }
    return TurnOutcomes.exhausted()
  }

  private async runTurnStep(spend: TurnSpend, stepNumber: number): Promise<TurnStepOutcome> {
    if (this.cancellationController.isCancelled()) {
      const outcome = this.turnEndingService.endTurnAsCancelled(this.repository.notesWritten())
      return TurnStepOutcomes.turnEnded(outcome)
    }

    const modelAnswer = await this.modelService.askModel(stepNumber)

    if (!modelAnswer.succeeded()) {
      const outcome = this.turnEndingService.endTurnAsUnfinished(
        modelAnswer,
        this.repository.notesWritten(),
      )
      return TurnStepOutcomes.turnEnded(outcome)
    }

    if (modelAnswer.value.isText())
      return TurnStepOutcomes.turnEnded(this.endTurnWithModelUtterance(modelAnswer.value.content))

    return this.executeToolCalls(modelAnswer.value.calls, spend)
  }

  private async executeToolCalls(calls: ToolCall[], spend: TurnSpend): Promise<TurnStepOutcome> {
    await this.toolCallExecutor.executeToolCalls(calls, spend.repeatedRefusalCounter)

    if (spend.repeatedRefusalCounter.isStuck())
      return TurnStepOutcomes.turnEnded(TurnOutcomes.stuck(spend.repeatedRefusalCounter))

    this.spendOn(spend, calls.length)

    return TurnStepOutcomes.keepGoing()
  }

  private spendOn(spend: TurnSpend, calls: number): void {
    spend.iterationCounter.spend(calls)
    if (spend.iterationCounter.justRanLow())
      this.turnProgressPublisher.runningLow(spend.iterationCounter.warning())
  }
  private endTurnWithModelUtterance(summary: string): Outcome<string> {
    return this.turnEndingService.endTurnWithModelUtterance(
      summary,
      this.repository.targetNote(),
      this.repository.editEnd(),
    )
  }
}
