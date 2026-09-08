import { Outcome, Outcomes } from '../shared/models/outcome'
import { Turn } from './turn/turn'
import { TurnFactory } from './turn/turn-factory'
import { SessionRepository } from '../session/session-repository'
import { TargetNoteResolver } from './note-binding/target-note-resolver'
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
    private targetNoteResolver: TargetNoteResolver,
  ) {}

  // A note the user opened themselves is as much a retarget as one a command
  // opened, so the session follows rather than editing the note behind them.
  // A turn already running follows too, or the next edit lands on the note the
  // user just moved off.
  async followActiveNote(path: string): Promise<void> {
    if (path === this.sessionRepository.targetNote()) return
    this.sessionRepository.changeTargetNote(path)
    this.turnProgressPublisher.retargeted(path)
    await this.retargetRunningTurn()
  }

  // Resolved after the session target moved, since that is what the resolver
  // reads. A resolve that fails leaves the turn on the note it had, which is
  // what a command opening an unfollowable note already does.
  private async retargetRunningTurn(): Promise<void> {
    if (!this.runningTurn) return
    const maybeNote = await this.targetNoteResolver.resolveOrNothing()
    if (maybeNote === null) return
    this.runningTurn?.retargetTo(maybeNote)
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
