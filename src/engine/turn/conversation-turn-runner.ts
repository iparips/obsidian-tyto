import { Outcome } from '../../shared/models/outcome'
import { ResolvedNote } from '../note-binding/resolved-note'
import { ToolCall } from '../../providers/types'
import { TurnCancellationController } from './turn-cancellation-controller'
import { TurnConclusionService } from '../turn-conclusion-service'
import { TurnStepService } from './turn-step-service'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { TurnRepository } from './turn-repository'
import { TurnSpend } from './turn-spend'
import { TurnStepResult, TurnStepResults } from './turn-step-result'

// One turn, from the utterance that opened it to the outcome it returns. Holds
// its collaborators and drives them; what it spends lives in TurnSpend.
export class ConversationTurnRunner {
  constructor(
    private repository: TurnRepository,
    private cancellationController: TurnCancellationController,
    private turnStepService: TurnStepService,
    private turnConclusionService: TurnConclusionService,
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
      const result = await this.runTurnStep(spend, step)
      if (result.hasEnded()) return result.outcome
    }
    return TurnConclusionService.exhausted()
  }

  private async runTurnStep(spend: TurnSpend, step: number): Promise<TurnStepResult> {
    if (this.cancellationController.isCancelled())
      return TurnStepResults.ended(this.concludeCancelled())

    const modelAnswer = await this.turnStepService.askModel(step)

    if (!modelAnswer.succeeded()) {
      const outcome = this.turnConclusionService.unfinished(
        modelAnswer,
        this.repository.writtenNotes(),
      )
      return TurnStepResults.ended(outcome)
    }

    if (modelAnswer.value.isText())
      return TurnStepResults.ended(this.concludeUtterance(modelAnswer.value.content))

    return this.executeToolCalls(modelAnswer.value.calls, spend)
  }

  private async executeToolCalls(calls: ToolCall[], spend: TurnSpend): Promise<TurnStepResult> {
    await this.turnStepService.executeToolCalls(calls, spend.repeatedRefusalCounter)

    if (spend.repeatedRefusalCounter.isStuck())
      return TurnStepResults.ended(TurnConclusionService.stuck(spend.repeatedRefusalCounter))

    this.spendOn(spend, calls.length)

    return TurnStepResults.keepGoing()
  }

  private spendOn(spend: TurnSpend, calls: number): void {
    spend.iterationCounter.spend(calls)
    if (spend.iterationCounter.justRanLow())
      this.turnProgressPublisher.runningLow(spend.iterationCounter.warning())
  }

  private concludeCancelled(): Outcome<string> {
    return this.turnConclusionService.cancelled(this.repository.writtenNotes())
  }

  private concludeUtterance(summary: string): Outcome<string> {
    return this.turnConclusionService.utterance(
      summary,
      this.repository.targetNote(),
      this.repository.editEnd(),
    )
  }
}
