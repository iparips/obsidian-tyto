import { Outcome, Outcomes } from '../shared/models/outcome'
import { ConversationTurnRunner } from './turn/conversation-turn-runner'
import { TurnRunnerFactory } from './turn/turn-runner-factory'
import { SessionRepository } from '../session/session-repository'
import { TargetNoteResolver } from './note-binding/target-note-resolver'
import { TurnProgressPublisher } from './turn-progress-publisher'
import { UtteranceQueue } from './utterance-queue'
import { ChatMessage } from '../model/providers/types'

export class EditEngine {
  // Null between turns, so a cancel arriving after one finished reaches nothing.
  private currentTurnRunner: ConversationTurnRunner | null = null
  private readonly utterances = new UtteranceQueue((text) => this.runTurn(text))

  constructor(
    private sessionRepository: SessionRepository,
    private currentTurnRunnerFactory: TurnRunnerFactory,
    private turnProgressPublisher: TurnProgressPublisher,
    private targetNoteResolver: TargetNoteResolver,
  ) {}

  // A note the user opened themselves is as much a retarget as one a command
  // opened, so the session follows rather than editing the note behind them.
  // A turn already running follows too, or the next edit lands on the note the
  // user just moved off.
  async followActiveNote(path: string | null): Promise<void> {
    if (path === this.sessionRepository.targetNote()) return
    this.sessionRepository.bindTo(path)
    this.sessionRepository.appendChatMessage(EditEngine.retargetMessage())
    this.turnProgressPublisher.retargetedFn(path)
    await this.retargetRunningTurn()
  }

  // Appended where it happened rather than enqueued as a turn, so the model
  // reads it as history on its next real turn. It names no note: the note
  // context that follows names the current one, and naming one here is what
  // archived spec 29 found dragging the target back.
  private static retargetMessage(): ChatMessage {
    return ChatMessage.system('The user moved to a different note. Later turns are about this one.')
  }

  // Resolved after the session target moved, since that is what the resolver
  // reads. A resolve that fails leaves the turn on the note it had, which is
  // what a command opening an unfollowable note already does.
  private async retargetRunningTurn(): Promise<void> {
    if (!this.currentTurnRunner) return
    const maybeNote = await this.targetNoteResolver.resolveOrNothing()
    if (maybeNote === null) return
    this.currentTurnRunner.retargetTo(maybeNote)
  }

  // Ignored between turns: a cancel that arrives after the turn finished has
  // nothing left to stop.
  cancelTurn(): void {
    this.currentTurnRunner?.cancel()
  }

  processUtterance(text: string): Promise<Outcome<string>> {
    return this.utterances.enqueue(text)
  }

  private async runTurn(text: string): Promise<Outcome<string>> {
    this.sessionRepository.appendChatMessage(ChatMessage.user(text))
    const runnerCreationOutcome = await this.currentTurnRunnerFactory.build()

    if (runnerCreationOutcome.hasFailed())
      return Outcomes.failure(runnerCreationOutcome.step, runnerCreationOutcome.message)

    this.currentTurnRunner = runnerCreationOutcome.value

    try {
      return await this.currentTurnRunner.run()
    } finally {
      this.currentTurnRunner = null
    }
  }
}
