import { Outcomes } from '../shared/models/outcome'
import { ConversationTurnRunner } from './turn/conversation-turn-runner'
import { TurnRunnerFactory } from './turn/turn-runner-factory'
import { SessionRepository } from '../session/session-repository'
import { TurnProgressPublisher } from './turn-progress-publisher'
import { UtteranceQueue } from './utterance-queue'
import { ChatMessage } from '../model/providers/types'
import { ToolNoteOpening } from '../session/tool-note-opening'
import { TurnResult } from './turn/ending/turn-result'
import { TurnEndingKind } from './turn/ending/turn-ending-kind'

export class EditEngine {
  // Null between turns, so a cancel arriving after one finished reaches nothing.
  private currentTurnRunner: ConversationTurnRunner | null = null
  private readonly utterances = new UtteranceQueue((text) => this.runTurn(text))

  constructor(
    private sessionRepository: SessionRepository,
    private currentTurnRunnerFactory: TurnRunnerFactory,
    private turnProgressPublisher: TurnProgressPublisher,
    // Read to tell a command's open from the user's: both arrive as the same
    // workspace event, and only the user's belongs on the timeline.
    private toolNoteOpening: ToolNoteOpening = new ToolNoteOpening(),
  ) {}

  // A note the user opened themselves is as much a retarget as one a command
  // opened, so the session follows rather than editing the note behind them.
  // A turn already running keeps the note it began on: the utterance was given
  // about that note, so it is carried out there and the next turn starts where
  // the user now is.
  followActiveNote(path: string | null): void {
    if (path === this.sessionRepository.targetNote()) return
    this.sessionRepository.bindTo(path)
    this.turnProgressPublisher.retargetedFn(path, !this.toolNoteOpening.isOpening())
  }

  // Ignored between turns: a cancel that arrives after the turn finished has
  // nothing left to stop.
  cancelTurn(): void {
    this.currentTurnRunner?.cancel()
  }

  processUtterance(text: string): Promise<TurnResult> {
    return this.utterances.enqueue(text)
  }

  private async runTurn(text: string): Promise<TurnResult> {
    this.sessionRepository.appendChatMessage(ChatMessage.user(text))
    const runnerCreationOutcome = await this.currentTurnRunnerFactory.build()

    // A turn that never started still ended, so the failure comes back wearing
    // the kind the rest of the path expects.
    if (runnerCreationOutcome.hasFailed())
      return TurnResult.of(
        TurnEndingKind.Failed,
        Outcomes.failure(runnerCreationOutcome.step, runnerCreationOutcome.message),
      )

    this.currentTurnRunner = runnerCreationOutcome.value

    try {
      return await this.currentTurnRunner.run()
    } finally {
      this.currentTurnRunner = null
    }
  }
}
