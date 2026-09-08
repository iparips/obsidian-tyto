import { Outcome } from '../../shared/models/outcome'
import { ResolvedNote } from '../note-binding/resolved-note'
import { ToolCall } from '../../providers/types'
import { ToolDispatcher } from '../tool-dispatcher'
import { TurnCancellationController } from './turn-cancellation-controller'
import { TurnConclusionService } from '../turn-conclusion-service'
import { TurnIteration } from './turn-iteration'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { TurnRepository } from './turn-repository'
import { TurnSpend } from './turn-spend'

// One turn, from the utterance that opened it to the outcome it returns. Holds
// its collaborators and drives them; what it spends lives in TurnSpend.
export class Turn {
  constructor(
    private repository: TurnRepository,
    private toolDispatcher: ToolDispatcher,
    private cancellationController: TurnCancellationController,
    private iteration: TurnIteration,
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
    for (let pass = 0; !spend.isExhausted(); pass++) {
      const ended = await this.runPass(spend, pass)
      if (ended) return ended
    }
    return TurnConclusionService.exhausted()
  }

  // Null when the turn should keep going, which is the one shape a pass that
  // either ends or continues can return.
  private async runPass(spend: TurnSpend, pass: number): Promise<Outcome<string> | null> {
    if (this.cancellationController.isCancelled()) return this.concludeCancelled()
    const answer = await this.iteration.askModel()
    this.iteration.logPass(pass, answer)
    const modelAnswer = answer.outcome

    if (!modelAnswer.succeeded())
      return this.turnConclusionService.unfinished(modelAnswer, this.repository.writtenNotes())

    if (modelAnswer.value.isText()) return this.concludeUtterance(modelAnswer.value.content)
    return this.actOn(modelAnswer.value.calls, spend)
  }

  private async actOn(calls: ToolCall[], spend: TurnSpend): Promise<Outcome<string> | null> {
    await this.iteration.executeToolCalls(calls, spend.repeatedRefusalCounter)

    if (spend.repeatedRefusalCounter.isStuck())
      return TurnConclusionService.stuck(spend.repeatedRefusalCounter)
    this.spendOn(spend, calls.length)

    return null
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
