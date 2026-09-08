import { Outcome, Outcomes } from '../shared/models/outcome'
import { Turn } from './turn/turn'
import { TurnFactory } from './turn/turn-factory'
import { SessionRepository } from '../session/session-repository'
import { TurnProgressPublisher } from './turn-progress-publisher'
import { UtteranceQueue } from './utterance-queue'

export class EditEngine {
  // Null between turns, so a cancel arriving after one finished reaches nothing.
  private runningTurn: Turn | null = null
  private readonly utterances = new UtteranceQueue((text) => this.runTurn(text))

  constructor(
    private sessionRepository: SessionRepository,
    private turnFactory: TurnFactory,
    private turnProgressPublisher: TurnProgressPublisher,
  ) {}

  // A note the user opened themselves is as much a retarget as one a command
  // opened, so the session follows rather than editing the note behind them.
  followActiveNote(path: string): void {
    if (path === this.sessionRepository.targetNote()) return
    this.sessionRepository.changeTargetNote(path)
    this.turnProgressPublisher.retargeted(path)
  }

  // Ignored between turns: a cancel that arrives after the turn finished has
  // nothing left to stop.
  cancelTurn(): void {
    this.runningTurn?.cancel()
  }

  processUtterance(text: string): Promise<Outcome<string>> {
    return this.utterances.enqueue(text)
  }

  private async runTurn(text: string): Promise<Outcome<string>> {
    const turnOutcome = await this.turnFactory.openTurn(text)
    if (turnOutcome.hasFailed()) return Outcomes.failure(turnOutcome.step, turnOutcome.message)
    this.runningTurn = turnOutcome.value
    try {
      return await turnOutcome.value.run()
    } finally {
      this.runningTurn = null
    }
  }
}
