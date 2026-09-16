import { Outcome, Outcomes } from '../shared/models/outcome'
import { ConversationTurnRunner } from './turn/conversation-turn-runner'
import { TurnRunnerFactory } from './turn/turn-runner-factory'
import { SessionRepository } from '../session/session-repository'
import { TurnProgressPublisher } from './turn-progress-publisher'
import { UtteranceQueue } from './utterance-queue'
import { ChatMessage } from '../model/providers/types'
import { ToolNoteOpening } from '../session/tool-note-opening'

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
