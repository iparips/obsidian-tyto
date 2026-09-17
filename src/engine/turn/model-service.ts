import { ChatTurn } from '../../model/providers/models/chat-turn'
import { Outcome } from '../../shared/models/outcome'
import { ChatProvider } from '../../model/providers/types'
import { ModelRequest } from '../../model/model-request'
import { ModelRequestParts, PromptFactory } from '../../model/prompt'
import { HarnessToolsService } from '../tools/harness-tools-service'
import { SessionRepository } from '../../session/session-repository'
import { TranscriptRepository } from '../../session/transcript/transcript-repository'
import { TurnCancellationController } from './turn-cancellation-controller'
import { TurnRepository } from './turn-repository'
import { TargetNoteWriter } from '../note-editing/target-note-writer'
import { NoteDetails } from '../note-editing/note-details'

// One of the two outward calls a step makes. The loop that decides when to make
// it is ConversationTurnRunner; what it calls back is ToolCallExecutor.
export class ModelService {
  constructor(
    private sessionRepository: SessionRepository,
    private turnRepository: TurnRepository,
    private turnCancellationController: TurnCancellationController,
    private modelProvider: ChatProvider,
    private harnessToolsService: HarnessToolsService,
    private transcriptRepository: TranscriptRepository,
    private targetNoteWriter: TargetNoteWriter,
  ) {}

  // Logged around the call rather than after it, since a turn that feels slow is
  // one model call taking its time rather than the loop doing work between them.
  async askModel(step: number): Promise<Outcome<ChatTurn>> {
    const askedAt = Date.now()
    const request = await this.requestForModel()
    const parts = PromptFactory.build(request)
    // Recorded before the call rather than after it, so a step the provider
    // failed on still says what it was sent.
    this.recordCall(parts, request.chatHistory.length)

    const answer = await this.modelProvider.complete(
      parts.asMessagesAround(request.chatHistory),
      this.harnessToolsService.getToolCallSchemas(this.turnRepository.definesSkills()),
      this.turnCancellationController.signal(),
    )

    if (answer.succeeded()) this.logStep(step, answer.value, Date.now() - askedAt)
    return answer
  }

  // The reach is read here rather than deeper down, so every message the turn
  // sends states the same one.
  private async requestForModel(): Promise<ModelRequest> {
    return new ModelRequest(
      await this.targetNoteDetails(),
      this.turnRepository.skills(),
      this.turnRepository.agentMdChain(),
      this.sessionRepository.chatHistory(),
      this.harnessToolsService.allowedCommands(),
      this.harnessToolsService.hasSearchEnabled(),
    )
  }

  // Through the writer rather than off the handle the turn holds: a tab that
  // moved would put another note's content under the target's path.
  private async targetNoteDetails(): Promise<NoteDetails | null> {
    const target = this.turnRepository.targetNote()
    return target ? this.targetNoteWriter.getDetails(target) : null
  }

  private recordCall(parts: ModelRequestParts, historyLength: number): void {
    this.transcriptRepository.recordCall(
      new Map([
        ['systemPrompt', parts.systemPrompt.content],
        ['dateMessage', parts.dateMessage.content],
        ['sessionTarget', parts.sessionTarget.content],
      ]),
      historyLength,
    )
  }

  // The only record of why a turn spent its iterations: the panel shows commands
  // and answers, but not the edits the model retried or the note it aimed at.
  private logStep(step: number, turn: ChatTurn, waitedMs: number): void {
    const calls = turn.isText() ? 'text' : turn.calls.map((call) => call.name).join(', ')
    const path = this.turnRepository.targetNote()?.path ?? 'no note'
    console.debug(`[tyto] iteration ${step + 1} on ${path}: ${calls} (${waitedMs}ms)`)
  }
}
